// migrateSeriesCharacters.ts
// Script to migrate JSONB characters to the new character table with AI enrichment
// HEAVILY DEBUGGED VERSION
import { supabase } from '../lib/supabase';
import { buildDetailedVisualPrompt, extractDistinctiveFeatures } from '../helpers/visualPromptBuilder';
import type {
    Character,
    CreateCharacterRequest,
    PhysicalTraits,
    CharacterRole
} from '../types/character';

const SERIES_ID = '9074fd69-df21-4bc9-a6ba-8014058a2c52';
const QWEN_API_URL = '/api/qwen/chat/completions';

interface JSONBCharacter {
    name: string;
    role: string;
    description: string;
    characterArc?: string;
}

interface EnrichedCharacterData {
    age_range: string;
    physical_traits: PhysicalTraits;
    distinctive_features: string[];
    clothing_style: string;
    visual_keywords: string[];
}

/**
 * Main migration function
 */
export async function migrateCharactersForSeries(
    seriesId: string = SERIES_ID,
    generatePosters: boolean = true
): Promise<{
    success: boolean;
    createdCharacters: Character[];
    errors: string[];
}> {
    const errors: string[] = [];
    const createdCharacters: Character[] = [];

    try {
        console.log(`🚀 Starting character migration for series: ${seriesId}`);

        // Step 1: Fetch the series with JSONB characters
        console.log('📡 Fetching series data from Supabase...');
        const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('*')
            .eq('id', seriesId)
            .single();

        if (seriesError) {
            console.error('❌ Series fetch error:', seriesError);
            throw new Error(`Failed to fetch series: ${seriesError.message}`);
        }

        console.log('✅ Series data fetched successfully');
        console.log('📊 Series info:', {
            id: series.id,
            title: series.title,
            visual_style: series.visual_style,
            setting_length: series.setting?.length || 0,
            lore_length: series.full_lore?.length || 0
        });

        if (!series.main_characters || !Array.isArray(series.main_characters)) {
            console.error('❌ No main_characters array found');
            console.log('Series object keys:', Object.keys(series));
            throw new Error('No characters found in series.main_characters');
        }

        console.log(`📋 Found ${series.main_characters.length} characters to migrate`);
        console.log('Characters:', series.main_characters.map((c: any) => c.name));

        // Step 2: Process each character
        for (let i = 0; i < series.main_characters.length; i++) {
            const jsonbChar = series.main_characters[i] as JSONBCharacter;
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🔄 Processing character ${i + 1}/${series.main_characters.length}: ${jsonbChar.name}`);
            console.log(`${'='.repeat(60)}`);
            console.log('📝 Character data:', {
                name: jsonbChar.name,
                role: jsonbChar.role,
                description_length: jsonbChar.description?.length || 0,
                has_character_arc: !!jsonbChar.characterArc
            });

            try {
                let enrichedData: EnrichedCharacterData | null = null;
                let visualPrompt: string = '';
                let useAI = true;

                // Step 2a: Try to enrich character with AI
                console.log('\n🤖 STEP 2A: AI Enrichment');
                console.log('─'.repeat(40));
                try {
                    console.log(`  🔄 Attempting AI enrichment...`);
                    console.log(`  📡 API URL: ${QWEN_API_URL}`);

                    enrichedData = await enrichCharacterWithAI(
                        jsonbChar,
                        series.visual_style,
                        series.setting,
                        series.full_lore
                    );

                    console.log(`  ✅ AI enrichment successful`);
                    console.log(`  📊 Enriched data received:`, {
                        age_range: enrichedData.age_range,
                        has_physical_traits: !!enrichedData.physical_traits,
                        distinctive_features_count: enrichedData.distinctive_features?.length || 0,
                        clothing_style_length: enrichedData.clothing_style?.length || 0,
                        visual_keywords_count: enrichedData.visual_keywords?.length || 0
                    });
                } catch (aiError: any) {
                    console.warn(`  ⚠️  AI enrichment failed: ${aiError.message}`);
                    console.error('  🔍 AI Error details:', aiError);
                    console.log(`  🔄 Falling back to basic enrichment...`);
                    useAI = false;
                }

                // Step 2b: Build visual prompt (AI or fallback)
                console.log('\n📝 STEP 2B: Visual Prompt Building');
                console.log('─'.repeat(40));
                console.log(`  Strategy: ${useAI && enrichedData ? 'AI-enriched' : 'Fallback'}`);

                if (enrichedData && useAI) {
                    console.log('  🤖 Building prompt from AI-enriched data...');
                    visualPrompt = buildVisualPromptFromEnriched(
                        jsonbChar.name,
                        jsonbChar.description,
                        enrichedData,
                        series.visual_style,
                        series.setting
                    );
                    console.log(`  ✅ AI-enriched prompt built (length: ${visualPrompt.length})`);
                } else {
                    console.log('  🔧 Using fallback helper functions...');

                    // Use the fallback helper
                    const basicCharData = {
                        name: jsonbChar.name,
                        role: jsonbChar.role as CharacterRole,
                        description: jsonbChar.description,
                        distinctive_features: extractDistinctiveFeatures(jsonbChar.description)
                    };

                    console.log('  📊 Basic character data prepared:', {
                        name: basicCharData.name,
                        role: basicCharData.role,
                        description_length: basicCharData.description.length,
                        distinctive_features_count: basicCharData.distinctive_features.length
                    });

                    const seriesContext = {
                        visual_style: series.visual_style,
                        setting: series.setting,
                        full_lore: series.full_lore
                    };

                    console.log('  📊 Series context prepared:', {
                        visual_style: seriesContext.visual_style,
                        has_setting: !!seriesContext.setting,
                        has_lore: !!seriesContext.full_lore
                    });

                    console.log('  🔨 Calling buildDetailedVisualPrompt...');
                    visualPrompt = buildDetailedVisualPrompt(basicCharData, seriesContext);
                    console.log(`  ✅ Fallback prompt built (length: ${visualPrompt.length})`);

                    // Build fallback enriched data
                    console.log('  🔨 Building fallback enriched data...');
                    enrichedData = buildFallbackEnrichedData(jsonbChar);
                    console.log(`  ✅ Fallback enriched data built`);
                }

                console.log(`  📏 Visual prompt length BEFORE validation: ${visualPrompt?.length || 0}`);
                console.log(`  🔍 Visual prompt is null? ${visualPrompt === null}`);
                console.log(`  🔍 Visual prompt is undefined? ${visualPrompt === undefined}`);
                console.log(`  🔍 Visual prompt is empty string? ${visualPrompt === ''}`);
                console.log(`  🔍 Visual prompt type: ${typeof visualPrompt}`);

                // Step 2c: Ensure visual_prompt is valid
                console.log('\n✔️ STEP 2C: Visual Prompt Validation');
                console.log('─'.repeat(40));

                if (!visualPrompt || visualPrompt.trim().length === 0) {
                    console.warn('  ⚠️  Visual prompt is null or empty, applying emergency fallback...');
                    visualPrompt = `Retrato cinematográfico de ${jsonbChar.name}. ${jsonbChar.description.substring(0, 200)}. Estilo visual: ${series.visual_style || 'cinematográfico'}. Iluminación dramática, composición profesional, alta calidad.`;
                    console.log(`  🆘 Emergency fallback prompt created (length: ${visualPrompt.length})`);
                } else {
                    console.log(`  ✅ Visual prompt is valid (length: ${visualPrompt.length})`);
                }

                console.log(`  📏 FINAL Visual prompt length: ${visualPrompt.length}`);
                console.log(`  📄 First 100 chars: "${visualPrompt.substring(0, 100)}..."`);

                // Step 2d: Extract visual keywords
                console.log('\n🏷️ STEP 2D: Visual Keywords Extraction');
                console.log('─'.repeat(40));

                console.log('  🔨 Extracting visual keywords...');
                const visualKeywords = extractVisualKeywords(
                    jsonbChar.description,
                    enrichedData?.distinctive_features || []
                );
                console.log(`  ✅ Extracted ${visualKeywords.length} keywords:`, visualKeywords.slice(0, 5));

                // Step 2e: Generate color palette
                console.log('\n🎨 STEP 2E: Color Palette Generation');
                console.log('─'.repeat(40));

                console.log(`  🔨 Generating palette for role: ${jsonbChar.role}`);
                const colorPalette = generateColorPalette(jsonbChar.role as CharacterRole);
                console.log(`  ✅ Generated palette:`, colorPalette);

                // Step 2f: Create character request
                console.log('\n📦 STEP 2F: Building Character Data Object');
                console.log('─'.repeat(40));

                const characterData: CreateCharacterRequest = {
                    series_id: seriesId,
                    name: jsonbChar.name,
                    role: jsonbChar.role as CharacterRole,
                    description: jsonbChar.description,
                    character_arc: jsonbChar.characterArc,
                    age_range: enrichedData?.age_range || 'young adult',
                    physical_traits: enrichedData?.physical_traits || {
                        height: 'average',
                        build: 'average',
                        hair: 'cabello oscuro',
                        eyes: 'ojos oscuros',
                        skin: 'piel morena',
                        scars: [],
                        tattoos: [],
                        cybernetics: []
                    },
                    distinctive_features: enrichedData?.distinctive_features || ['Características distintivas'],
                    clothing_style: enrichedData?.clothing_style || 'Ropa urbana moderna',
                    visual_prompt: visualPrompt, // GUARANTEED to be non-null and non-empty
                    visual_keywords: visualKeywords,
                    color_palette: colorPalette,
                    importance_level: getImportanceLevel(jsonbChar.role as CharacterRole)
                };

                console.log('  📊 Character data object created:');
                console.log('    - series_id:', characterData.series_id);
                console.log('    - name:', characterData.name);
                console.log('    - role:', characterData.role);
                console.log('    - age_range:', characterData.age_range);
                console.log('    - clothing_style:', characterData.clothing_style);
                console.log('    - visual_prompt length:', characterData.visual_prompt?.length || 0);
                console.log('    - visual_prompt is null?', characterData.visual_prompt === null);
                console.log('    - visual_prompt is undefined?', characterData.visual_prompt === undefined);
                console.log('    - visual_keywords count:', characterData.visual_keywords?.length || 0);
                console.log('    - color_palette count:', characterData.color_palette?.length || 0);
                console.log('    - importance_level:', characterData.importance_level);

                // Step 2g: Save to database
                console.log('\n💾 STEP 2G: Database Insert');
                console.log('─'.repeat(40));
                console.log(`  💾 Preparing to save to database...`);
                console.log(`  📝 Visual prompt check - Length: ${visualPrompt.length} chars`);
                console.log(`  🔍 Visual prompt value check:`, {
                    isNull: visualPrompt === null,
                    isUndefined: visualPrompt === undefined,
                    isEmpty: visualPrompt === '',
                    length: visualPrompt?.length,
                    type: typeof visualPrompt
                });

                const insertPayload = {
                    ...characterData,
                    // Ensure all required fields are present
                    poster_status: 'pending',
                    current_status: 'active',
                    is_recurring: true,
                    main_episodes: [],
                    visual_prompt: visualPrompt
                };

                console.log('  📦 Complete insert payload keys:', Object.keys(insertPayload));
                console.log('  🔍 Insert payload visual_prompt:', {
                    exists: 'visual_prompt' in insertPayload,
                    value: insertPayload.visual_prompt?.substring(0, 50) + '...',
                    length: insertPayload.visual_prompt?.length,
                    type: typeof insertPayload.visual_prompt
                });

                console.log('  📡 Executing Supabase insert...');
                const { data: character, error: createError } = await supabase
                    .from('characters')
                    .insert([insertPayload])
                    .select()
                    .single();

                if (createError) {
                    console.error('  ❌ Database insert error:', createError);
                    console.error('  🔍 Error details:', {
                        code: createError.code,
                        message: createError.message,
                        details: createError.details,
                        hint: createError.hint
                    });
                    throw new Error(`Database error: ${createError.message}`);
                }

                console.log(`  ✅ Created character successfully!`);
                console.log(`  🆔 Character ID: ${character.id}`);
                console.log(`  📊 Returned character data:`, {
                    id: character.id,
                    name: character.name,
                    role: character.role,
                    has_visual_prompt: !!character.visual_prompt,
                    visual_prompt_length: character.visual_prompt?.length
                });

                createdCharacters.push(character);

                // Step 2h: Optionally generate poster
                if (generatePosters && (jsonbChar.role === 'protagonist' || jsonbChar.role === 'antagonist')) {
                    console.log('\n🎨 STEP 2H: Poster Generation');
                    console.log('─'.repeat(40));
                    console.log(`  🎨 Initiating poster generation...`);
                    console.log(`  📝 Using visual prompt (length ${visualPrompt.length})`);

                    try {
                        await generateCharacterPoster(character.id, visualPrompt, series.visual_style);
                        console.log(`  ✅ Poster generation queued successfully`);
                    } catch (posterError: any) {
                        console.warn(`  ⚠️  Poster generation failed: ${posterError.message}`);
                        console.error('  🔍 Poster error details:', posterError);
                        errors.push(`Poster generation failed for ${jsonbChar.name}: ${posterError.message}`);
                    }
                }

                console.log(`\n✅ CHARACTER MIGRATION COMPLETE: ${jsonbChar.name}`);
                console.log(`${'='.repeat(60)}\n`);

            } catch (charError: any) {
                const errorMsg = `Failed to migrate ${jsonbChar.name}: ${charError.message}`;
                console.error(`\n❌ CHARACTER MIGRATION FAILED: ${jsonbChar.name}`);
                console.error(`  Error message: ${charError.message}`);
                console.error(`  Error stack:`, charError.stack);
                errors.push(errorMsg);
                console.log(`${'='.repeat(60)}\n`);
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✨ MIGRATION COMPLETE!`);
        console.log(`${'='.repeat(60)}`);
        console.log(`   ✅ Created: ${createdCharacters.length} characters`);
        console.log(`   ❌ Errors: ${errors.length}`);

        return {
            success: createdCharacters.length > 0,
            createdCharacters,
            errors
        };

    } catch (error: any) {
        console.error(`\n❌ MIGRATION FAILED - FATAL ERROR`);
        console.error(`${'='.repeat(60)}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack:`, error.stack);
        console.error(`${'='.repeat(60)}`);

        return {
            success: false,
            createdCharacters,
            errors: [...errors, error.message]
        };
    }
}

/**
 * Build fallback enriched data when AI is unavailable
 */
function buildFallbackEnrichedData(character: JSONBCharacter): EnrichedCharacterData {
    console.log('    🔧 buildFallbackEnrichedData called');
    console.log('    📝 Input character:', {
        name: character.name,
        description_length: character.description?.length || 0
    });

    const description = character.description.toLowerCase();

    // Extract age
    let age_range: string = 'young adult';
    if (description.includes('diecinueve') || description.includes('adolescent') || description.includes('teen')) {
        age_range = 'late teens';
        console.log('    🎂 Detected age: late teens');
    } else if (description.includes('setenta') || description.includes('anciano') || description.includes('elderly')) {
        age_range = 'elderly';
        console.log('    🎂 Detected age: elderly');
    } else if (description.includes('cuarenta') || description.includes('cincuenta') || description.includes('middle')) {
        age_range = 'middle aged';
        console.log('    🎂 Detected age: middle aged');
    } else {
        console.log('    🎂 Default age: young adult');
    }

    // Extract physical traits from description
    const physical_traits: PhysicalTraits = {
        height: 'average',
        build: 'average',
        hair: 'cabello oscuro',
        eyes: 'ojos oscuros',
        skin: 'piel morena',
        scars: [],
        tattoos: [],
        cybernetics: []
    };

    // Look for specific physical descriptors
    if (description.includes('cicatriz')) {
        const scarMatch = character.description.match(/cicatriz[^.;]*/i);
        if (scarMatch) {
            physical_traits.scars = [scarMatch[0].trim()];
            console.log('    🩹 Found scar:', scarMatch[0].trim().substring(0, 50));
        }
    }

    if (description.includes('implante') || description.includes('cibernético') || description.includes('cybernetic')) {
        const cyberMatch = character.description.match(/(implante|cibernético)[^.;]*/i);
        if (cyberMatch) {
            physical_traits.cybernetics = [cyberMatch[0].trim()];
            console.log('    🤖 Found cybernetics:', cyberMatch[0].trim().substring(0, 50));
        }
    }

    if (description.includes('tatuaje')) {
        const tattooMatch = character.description.match(/tatuaje[^.;]*/i);
        if (tattooMatch) {
            physical_traits.tattoos = [tattooMatch[0].trim()];
            console.log('    🎨 Found tattoo:', tattooMatch[0].trim().substring(0, 50));
        }
    }

    // Extract distinctive features
    console.log('    🔍 Extracting distinctive features...');
    const distinctive_features = extractDistinctiveFeatures(character.description);
    console.log('    ✅ Extracted features:', distinctive_features);

    // Determine clothing style based on description and role
    let clothing_style = 'Ropa urbana moderna';
    if (description.includes('hacker') || description.includes('tecnológico')) {
        clothing_style = 'Vestimenta urbana tecnológica con elementos ciberpunk';
        console.log('    👕 Clothing style: cyberpunk tech');
    } else if (description.includes('profesional') || description.includes('ejecutivo')) {
        clothing_style = 'Vestimenta profesional ejecutiva';
        console.log('    👕 Clothing style: professional');
    } else if (description.includes('militar') || description.includes('seguridad')) {
        clothing_style = 'Vestimenta táctica y funcional';
        console.log('    👕 Clothing style: tactical');
    } else {
        console.log('    👕 Clothing style: default urban');
    }

    // Extract visual keywords
    const visual_keywords: string[] = [];
    const keywords = character.description.match(/\b(\w{4,})\b/g) || [];
    keywords.slice(0, 10).forEach(k => visual_keywords.push(k.toLowerCase()));
    console.log('    🏷️  Visual keywords extracted:', visual_keywords.length);

    const result = {
        age_range,
        physical_traits,
        distinctive_features,
        clothing_style,
        visual_keywords
    };

    console.log('    ✅ buildFallbackEnrichedData complete');
    return result;
}

/**
 * Use AI to enrich character with missing fields
 */
async function enrichCharacterWithAI(
    character: JSONBCharacter,
    visualStyle: string,
    setting: string,
    lore: string
): Promise<EnrichedCharacterData> {
    console.log('    🤖 enrichCharacterWithAI called');

    const systemPrompt = `You are a character designer enriching character profiles for AI image generation.

CRITICAL INSTRUCTIONS:
1. **LANGUAGE**: All text MUST be in **Mexican Spanish** (Español de México)
2. **SPECIFICITY**: Be very specific and visual in descriptions
3. **CONSISTENCY**: Match the visual style and setting provided
4. Respond ONLY with valid JSON (no markdown, no code blocks)

Return EXACTLY this structure:
{
  "age_range": "late teens" | "young adult" | "middle aged" | "elderly",
  "physical_traits": {
    "height": "very short" | "short" | "average" | "tall" | "very tall",
    "build": "slim" | "athletic" | "average" | "muscular" | "heavy",
    "hair": "detailed description in Spanish",
    "eyes": "detailed description in Spanish",
    "skin": "description in Spanish",
    "facial_hair": "description in Spanish (if applicable)",
    "scars": ["scar description 1", "scar description 2"],
    "tattoos": ["tattoo description 1"],
    "cybernetics": ["cybernetic implant description"]
  },
  "distinctive_features": [
    "visual feature 1 in Spanish",
    "visual feature 2 in Spanish",
    "visual feature 3 in Spanish"
  ],
  "clothing_style": "detailed clothing description in Spanish",
  "visual_keywords": [
    "keyword1", "keyword2", "keyword3"
  ]
}`;

    const userPrompt = `Enrich this character profile:

CHARACTER NAME: ${character.name}
ROLE: ${character.role}
DESCRIPTION: ${character.description}
CHARACTER ARC: ${character.characterArc || 'Not specified'}

SERIES CONTEXT:
Visual Style: ${visualStyle}
Setting: ${setting}
Lore: ${lore.substring(0, 500)}...

Based on the character description and series context, provide:
1. Age range that fits their description
2. Detailed physical traits (height, build, hair, eyes, skin, facial features)
3. Array of 3-5 distinctive visual features for image generation
4. Detailed clothing style description
5. Array of visual keywords for prompting

REMEMBER: All Spanish text must be in Mexican Spanish!`;

    console.log('    📤 Preparing API request...');
    console.log('    📡 Target URL:', QWEN_API_URL);

    try {
        const requestBody = {
            model: 'Qwen/Qwen2.5-VL-7B-Instruct',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        };

        console.log('    📦 Request body prepared (message count: 2)');

        const response = await fetch(QWEN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        console.log('    📥 Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('    ❌ API error response:', errorText);
            throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('    📊 Response data structure:', {
            hasChoices: !!data.choices,
            choicesLength: data.choices?.length,
            hasMessage: !!data.choices?.[0]?.message,
            hasContent: !!data.choices?.[0]?.message?.content
        });

        let content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('    ❌ No content in API response');
            console.error('    📊 Full response:', JSON.stringify(data, null, 2));
            throw new Error('No content received from Qwen API');
        }

        console.log('    📝 Raw content received (length: ' + content.length + ')');
        console.log('    📄 First 200 chars:', content.substring(0, 200));

        content = content.replace(/```json|```/g, '').trim();
        console.log('    🧹 Cleaned content (length: ' + content.length + ')');

        const enrichedData: EnrichedCharacterData = JSON.parse(content);
        console.log('    ✅ JSON parsed successfully');

        // Validate required fields
        if (!enrichedData.age_range || !enrichedData.physical_traits || !enrichedData.distinctive_features) {
            console.error('    ❌ Invalid AI response structure');
            console.error('    🔍 Missing fields:', {
                hasAgeRange: !!enrichedData.age_range,
                hasPhysicalTraits: !!enrichedData.physical_traits,
                hasDistinctiveFeatures: !!enrichedData.distinctive_features
            });
            throw new Error('Invalid AI response structure');
        }

        console.log('    ✅ Validation passed');
        console.log('    📊 Enriched data summary:', {
            age_range: enrichedData.age_range,
            distinctive_features_count: enrichedData.distinctive_features.length,
            clothing_style: enrichedData.clothing_style?.substring(0, 50)
        });

        return enrichedData;

    } catch (error: any) {
        console.error('    ❌ AI enrichment error:', error.message);
        console.error('    🔍 Error type:', error.constructor.name);
        throw error; // Re-throw to trigger fallback
    }
}

/**
 * Build comprehensive visual prompt from AI-enriched data
 */
function buildVisualPromptFromEnriched(
    name: string,
    description: string,
    enrichedData: EnrichedCharacterData,
    visualStyle: string,
    setting: string
): string {
    console.log('    🔨 buildVisualPromptFromEnriched called');

    const traits = enrichedData.physical_traits;

    const parts = [
        `Retrato cinematográfico de ${name}.`,
        `${enrichedData.age_range}.`,
        `${traits.build}, ${traits.height}.`,
        `${traits.hair}, ${traits.eyes}, ${traits.skin}.`,
    ];

    if (traits.facial_hair) {
        parts.push(`${traits.facial_hair}.`);
        console.log('    ✅ Added facial hair');
    }

    if (traits.scars && traits.scars.length > 0) {
        parts.push(`Cicatrices: ${traits.scars.join(', ')}.`);
        console.log('    ✅ Added scars:', traits.scars.length);
    }

    if (traits.tattoos && traits.tattoos.length > 0) {
        parts.push(`Tatuajes: ${traits.tattoos.join(', ')}.`);
        console.log('    ✅ Added tattoos:', traits.tattoos.length);
    }

    if (traits.cybernetics && traits.cybernetics.length > 0) {
        parts.push(`Implantes cibernéticos: ${traits.cybernetics.join(', ')}.`);
        console.log('    ✅ Added cybernetics:', traits.cybernetics.length);
    }

    parts.push(`${enrichedData.clothing_style}.`);
    parts.push(`Rasgos distintivos: ${enrichedData.distinctive_features.join(', ')}.`);
    parts.push(`Contexto: ${description.substring(0, 200)}.`);
    parts.push(`Ambientación: ${setting}.`);
    parts.push(`Estilo visual: ${visualStyle}.`);
    parts.push(`Iluminación dramática, composición profesional, alta calidad, render detallado.`);

    const result = parts.join(' ');
    console.log('    ✅ Prompt built, total parts:', parts.length, 'length:', result.length);

    return result;
}

/**
 * Extract visual keywords from text
 */
function extractVisualKeywords(
    description: string,
    distinctiveFeatures: string[]
): string[] {
    // Extract from description
    const descWords = description
        .toLowerCase()
        .match(/\b(\w{4,})\b/g) || [];

    const keywords = new Set<string>();
    descWords.forEach(word => keywords.add(word));

    // Extract from distinctive features
    distinctiveFeatures.forEach(feature => {
        const featureWords = feature
            .toLowerCase()
            .match(/\b(\w{3,})\b/g) || [];
        featureWords.forEach(word => keywords.add(word));
    });

    return Array.from(keywords).slice(0, 15);
}

/**
 * Generate color palette based on character role
 */
function generateColorPalette(role: CharacterRole): string[] {
    const palettes: Record<string, string[]> = {
        protagonist: ['#3b82f6', '#60a5fa', '#1e40af', '#dbeafe'],
        antagonist: ['#ef4444', '#f87171', '#991b1b', '#fee2e2'],
        aliado: ['#10b981', '#34d399', '#065f46', '#d1fae5'],
        supporting: ['#6b7280', '#9ca3af', '#374151', '#f3f4f6'],
        minor: ['#9ca3af', '#d1d5db', '#4b5563', '#f9fafb']
    };

    return palettes[role] || palettes.minor;
}

/**
 * Get importance level based on role
 */
function getImportanceLevel(role: CharacterRole): number {
    const levels: Record<string, number> = {
        protagonist: 10,
        antagonist: 9,
        aliado: 7,
        supporting: 5,
        minor: 3
    };

    return levels[role] || 5;
}

/**
 * Generate character poster using your image generation API
 */
async function generateCharacterPoster(
    characterId: string,
    visualPrompt: string,
    visualStyle: string
): Promise<void> {
    console.log('    🎨 generateCharacterPoster called');
    console.log('    🆔 Character ID:', characterId);
    console.log('    📝 Prompt length:', visualPrompt.length);

    try {
        console.log('    📡 Calling image generation API...');

        // Call your image generation API
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: visualPrompt,
                visual_style: visualStyle,
                width: 768,
                height: 1024,
                steps: 4,
                guidance: 7.5
            })
        });

        console.log('    📥 Image API response:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error('Image generation request failed');
        }

        const { job_id } = await response.json();
        console.log('    ✅ Job created:', job_id);

        // Track generation in database
        console.log('    💾 Saving generation record to DB...');
        await supabase
            .from('character_visual_generations')
            .insert([{
                character_id: characterId,
                prompt: visualPrompt,
                visual_style: visualStyle,
                generation_type: 'poster',
                status: 'generating',
                job_id
            }]);

        // Update character status
        console.log('    💾 Updating character status...');
        await supabase
            .from('characters')
            .update({
                poster_status: 'generating',
                poster_job_id: job_id,
                poster_prompt: visualPrompt
            })
            .eq('id', characterId);

        console.log('    ✅ Poster generation tracking complete');

    } catch (error: any) {
        console.error('    ❌ Poster generation error:', error);
        throw error;
    }
}

/**
 * Main execution
 */
if (require.main === module) {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 CHARACTER MIGRATION SCRIPT STARTED');
    console.log('='.repeat(60) + '\n');

    migrateCharactersForSeries(SERIES_ID, true)
        .then(result => {
            console.log('\n' + '='.repeat(60));
            console.log('📊 MIGRATION RESULTS:');
            console.log('='.repeat(60));
            console.log(`Success: ${result.success}`);
            console.log(`Characters created: ${result.createdCharacters.length}`);

            if (result.createdCharacters.length > 0) {
                console.log('\n✅ Created characters:');
                result.createdCharacters.forEach(char => {
                    console.log(`  - ${char.name} (${char.role}) - ID: ${char.id}`);
                });
            }

            if (result.errors.length > 0) {
                console.log('\n⚠️  Errors:');
                result.errors.forEach(err => {
                    console.log(`  - ${err}`);
                });
            }

            console.log('\n' + '='.repeat(60));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n' + '='.repeat(60));
            console.error('❌ FATAL ERROR:');
            console.error('='.repeat(60));
            console.error(error);
            console.error('='.repeat(60) + '\n');
            process.exit(1);
        });
}

export default migrateCharactersForSeries;