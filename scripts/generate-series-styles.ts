import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Series Visual Styles ──────────────────────────────────────────────────
const VISUAL_STYLES: Record<string, { apiStyle: string; prompt: string }> = {
    "cinematic": {
        apiStyle: "<auto>",
        prompt: "Wide cinematic establishing shot of a futuristic metropolis, epic scale, lens flares, dramatic composition, 8k resolution, photorealistic, anamorphic lens"
    },
    "dark_cinematic": {
        apiStyle: "<auto>",
        prompt: "Dark moody cinematic scene, heavy shadows, film noir atmosphere, low key lighting, mysterious silhouette in the rain, high contrast, rainy street"
    },
    "scary-cartoon": {
        apiStyle: "<auto>",
        prompt: "Scary 1950s rubber hose cartoon style, unsettling smiling characters, grainy film texture, muted colors, surreal horror elements, vintage animation aesthetic"
    },
    "retro": {
        apiStyle: "<auto>",
        prompt: "Retro 80s synthwave aesthetic, vibrant neon pink and teal, VHS glitch effects, retro-futurism, glowing grid landscape, low-poly mountains"
    },
    "neon": {
        apiStyle: "<auto>",
        prompt: "Cyberpunk city street at night, intense neon lights, reflections in puddles, futuristic technology, vibrant purple and blue palette, busy urban scene"
    },
    "realistic": {
        apiStyle: "<auto>",
        prompt: "Hyper-realistic nature photography, extremely detailed textures, natural lighting, crystal clear focus, RAW photo quality, depth of field"
    },
    "animated": {
        apiStyle: "<auto>",
        prompt: "Modern 3D animation style, Pixar inspired, soft round shapes, vibrant colors, expressive character, high-quality rendering, whimsical atmosphere"
    }
};

// ─── Series Script Tones ───────────────────────────────────────────────────
const SCRIPT_STYLES: Record<string, { apiStyle: string; prompt: string }> = {
    "dramatic": {
        apiStyle: "<auto>",
        prompt: "Intense dramatic confrontation between two characters, emotional facial expressions, tight framing, moody atmospheric lighting"
    },
    "suspenseful": {
        apiStyle: "<auto>",
        prompt: "Suspenseful thriller shot, someone looking through a cracked door, high tension, shadowy environment, dramatic shadows"
    },
    "mysterious": {
        apiStyle: "<auto>",
        prompt: "Mysterious hooded figure in a misty forest, glowing ancient runes, fog, ethereal lighting, sense of wonder and secret"
    },
    "action": {
        apiStyle: "<auto>",
        prompt: "High-octane action scene, explosion in background, motion blur, dynamic camera angle, intense energy, debris flying"
    },
    "comedic": {
        apiStyle: "<auto>",
        prompt: "Lighthearted comedic scene, bright colors, funny character expression, slapstick elements, cheerful sunny environment"
    },
    "educational": {
        apiStyle: "<auto>",
        prompt: "Professional documentary style, interview setup with soft box lighting, high-end camera, scholarly environment, clean composition"
    }
};

// Load .env manually
const envPath = path.resolve(__dirname, '../.env');
let apiKey = process.env.VITE_QWEN_API_KEY || '';

if (!apiKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_QWEN_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    throw new Error('No API key found. Set VITE_QWEN_API_KEY in .env');
}

const VISUAL_OUTPUT_DIR = path.resolve(__dirname, '../public/assets/series/styles');
const SCRIPT_OUTPUT_DIR = path.resolve(__dirname, '../public/assets/series/scripts');

[VISUAL_OUTPUT_DIR, SCRIPT_OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

async function generateImage(styleName: string, config: { apiStyle: string; prompt: string }): Promise<string> {
    console.log(`Generating: ${styleName}...`);

    const submitResponse = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
            model: 'qwen-image-plus',
            input: {
                prompt: config.prompt,
            },
            parameters: {
                style: config.apiStyle,
                size: '1024*1024',
                n: 1,
            },
        }),
    });

    if (!submitResponse.ok) {
        throw new Error(`Submit failed: ${await submitResponse.text()}`);
    }

    const submitData = await submitResponse.json();
    const taskId = submitData.output.task_id;
    console.log(`  Task ID: ${taskId}`);

    // Poll for result
    let attempts = 0;
    while (attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (!statusResponse.ok) {
            throw new Error(`Status check failed: ${await statusResponse.text()}`);
        }

        const statusData = await statusResponse.json();
        const taskStatus = statusData.output.task_status;

        if (taskStatus === 'SUCCEEDED') {
            console.log(`  ✅ Done`);
            return statusData.output.results[0].url;
        } else if (taskStatus === 'FAILED') {
            throw new Error(`Task failed: ${JSON.stringify(statusData.output)}`);
        }

        process.stdout.write('.');
        attempts++;
    }

    throw new Error('Timeout waiting for image generation');
}

async function downloadImage(url: string, destPath: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
    console.log(`  💾 Saved: ${path.basename(destPath)}`);
}

async function processStyles(styles: Record<string, any>, outputDir: string, type: 'visual' | 'script') {
    const entries = Object.entries(styles);
    console.log(`Checking ${entries.length} ${type} styles → ${outputDir}\n`);

    for (const [name, config] of entries) {
        const filename = `${name}.jpg`;
        const filePath = path.join(outputDir, filename);

        if (fs.existsSync(filePath)) {
            console.log(`⏭️  Skipping ${name} (already exists)`);
            continue;
        }

        try {
            console.log(`\n🎨 Creating ${type} asset: ${name}`);
            const imageUrl = await generateImage(name, config);
            await downloadImage(imageUrl, filePath);
        } catch (error) {
            console.error(`❌ Error generating ${name}:`, error);
        }
    }
}

async function main() {
    await processStyles(VISUAL_STYLES, VISUAL_OUTPUT_DIR, 'visual');
    console.log('\n----------------------------------------\n');
    await processStyles(SCRIPT_STYLES, SCRIPT_OUTPUT_DIR, 'script');

    console.log('\n✨ All Done!');
}

main().catch(console.error);
