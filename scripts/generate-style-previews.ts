import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── style definitions: each one has a locked API style + a prompt tailored
//     to visually *scream* that style ──────────────────────────────────────────
const STYLES: Record<string, { apiStyle: string; prompt: string }> = {
    "comic-book": {
        apiStyle: "<auto>",
        prompt:
            "Bold comic book panel, a mysterious hooded figure standing in a dark alley at night, " +
            "thick black ink outlines, halftone dot shading, vibrant saturated colors, speech bubble, " +
            "dramatic lighting, Marvel manga crossover style, high contrast",
    },
    "creepy-comic": {
        apiStyle: "<auto>",
        prompt:
            "Creepy indie comic illustration, a gaunt pale figure standing in a doorway with unnatural shadows, " +
            "wobbly hand-drawn ink lines, muted sickly greens and browns, unsettling expressions, " +
            "horror comic book style, eerie atmosphere, disturbing details",
    },
    "cinematic-realistic": {
        apiStyle: "<auto>",
        prompt:
            "Cinematic photorealistic scene, a lone soldier standing on a war-torn bridge at golden hour, " +
            "volumetric fog, dramatic directional lighting, shallow depth of field, " +
            "movie still quality, 4K, RAW photo, anamorphic lens flare",
    },
    "anime": {
        apiStyle: "<auto>",
        prompt:
            "Anime illustration, a beautiful warrior girl with long flowing silver hair standing on a mountaintop, " +
            "large expressive eyes, vibrant cel-shaded colors, dynamic pose, cherry blossom petals, " +
            "studio Ghibli meets Demon Slayer art style, detailed backgrounds",
    },
    "oil-painting": {
        apiStyle: "<auto>",
        prompt:
            "Classical oil painting on canvas, a grand European nobleman in 18th century dress seated in a velvet chair, " +
            "visible thick brushstrokes, rich deep colors, dramatic chiaroscuro lighting, " +
            "Rembrandt style, museum quality, crackled paint texture, gold frame worthy",
    },
    "3d-render": {
        apiStyle: "<auto>",
        prompt:
            "Stylized 3D render, a futuristic robot standing in a sleek minimalist white room, " +
            "ray-traced reflections, subsurface scattering on translucent parts, " +
            "perfect studio lighting, Blender Cycles quality, glossy materials, sharp edges",
    },
    "watercolor": {
        apiStyle: "<auto>",
        prompt:
            "Watercolor painting on textured paper, a serene countryside cottage surrounded by wildflowers and mist, " +
            "soft bleeding color edges, visible paper texture, translucent washes of pastel colors, " +
            "loose impressionist brushwork, dreamy and ethereal atmosphere",
    },
    "cyberpunk": {
        apiStyle: "<auto>",
        prompt:
            "Cyberpunk city street at night, a street samurai with neon tattoos and chrome implants, " +
            "neon signs in Japanese and English, rain-slicked ground reflecting purple and blue lights, " +
            "holographic advertisements, dense urban environment, high contrast, moody atmosphere",
    },
    "steampunk": {
        apiStyle: "<auto>",
        prompt:
            "Steampunk mechanical scene, an inventor in goggles and leather coat tinkering with a massive brass clockwork machine, " +
            "exposed gears and copper pipes, steam billowing, warm amber and bronze tones, " +
            "Victorian era industrial aesthetic, intricate mechanical details, dark workshop",
    },
    "gothic": {
        apiStyle: "<auto>",
        prompt:
            "Dark gothic illustration, a cloaked figure standing before a crumbling cathedral in a stormy night, " +
            "gargoyles perched on the rooftop, lightning in the background, " +
            "deep black and grey palette, medieval horror, ink wash style",
    },
    "scary-cartoon": {
        apiStyle: "<auto>",
        prompt:
            "Illustrated comic book style animation, historical scene set in 1957, " +
            "professional office interior with vintage furniture and period-accurate details, " +
            "multiple characters in business attire with semi-realistic proportions, " +
            "dramatic cinematic lighting with deep shadows and highlights",
    }
};

// ─── script definitions: visual metaphors for each tone ──────────────────
const SCRIPT_STYLES: Record<string, { apiStyle: string; prompt: string }> = {
    "scary-horror": {
        apiStyle: "<auto>",
        prompt:
            "Cinematic horror movie still, a dark haunted house on a hill with lightning striking, " +
            "shadowy figure in the window, blue moonlight, fog, scary atmosphere, " +
            "detailed texture, 8k resolution, ominous mood",
    },
    "funny-comedy": {
        apiStyle: "<auto>",
        prompt:
            "Bright colorful cartoon scene, a clumsy clown slipping on a banana peel at a circus, " +
            "confetti in the air, laughing audience, vibrant primary colors, " +
            "exaggerated expressions, fun and joyful atmosphere, 3D style",
    },
    "educational-documentary": {
        apiStyle: "<auto>",
        prompt:
            "Professional documentary style shot, a magnifying glass hovering over an ancient map, " +
            "warm library lighting, dust motes dancing in light beams, " +
            "high detail, realistic texture, national geographic style, intellectual vibe",
    },
    "dramatic-telenovela": {
        apiStyle: "<auto>",
        prompt:
            "Dramatic soap opera close-up, a tearful woman looking out a rainy window, " +
            "intense emotional expression, dramatic lighting, soft focus background, " +
            "telenovela aesthetic, high contrast, moody colors",
    },
    "inspirational-motivational": {
        apiStyle: "<auto>",
        prompt:
            "Inspirational sunrise scene, a silhouette of a person standing on a mountain peak with arms raised, " +
            "golden hour sunlight, sea of clouds below, breathtaking view, " +
            "uplifting atmosphere, lens flare, cinematic composition",
    },
    "action-thriller": {
        apiStyle: "<auto>",
        prompt:
            "High octane action movie scene, a sports car drifting around a corner with smoke and sparks, " +
            "explosion in the background, motion blur, dynamic camera angle, " +
            "neon city lights reflecting on wet pavement, intense energy",
    },
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

const VISUAL_OUTPUT_DIR = path.resolve(__dirname, '../public/assets/styles');
const SCRIPT_OUTPUT_DIR = path.resolve(__dirname, '../public/assets/scripts');

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
    await processStyles(STYLES, VISUAL_OUTPUT_DIR, 'visual');
    console.log('\n----------------------------------------\n');
    await processStyles(SCRIPT_STYLES, SCRIPT_OUTPUT_DIR, 'script');

    console.log('\n✨ All Done!');
}

main().catch(console.error);