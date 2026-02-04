// Fix for the UI component making the migration call
// This should be imported and used in your Characters.tsx or similar component

import { supabase } from '../lib/supabase';
import { buildDetailedVisualPrompt, extractDistinctiveFeatures } from '../helpers/visualPromptBuilder';
import type { CharacterRole } from '../types/character';

interface MigrationCharacter {
    series_id: string;
    name: string;
    role: CharacterRole;
    description: string;
    character_arc?: string;
    distinctive_features?: string[];
    visual_keywords?: string[];
    color_palette?: string[];
    importance_level?: number;
}

/**
 * CRITICAL FIX: This function ensures visual_prompt is ALWAYS generated
 * Use this instead of directly calling supabase.from('characters').insert()
 */
export async function insertCharacterWithPrompt(
    character: MigrationCharacter,
    seriesData: {
        visual_style?: string;
        setting?: string;
        full_lore?: string;
    }
) {
    console.log('🔧 insertCharacterWithPrompt called for:', character.name);

    // STEP 1: Ensure we have distinctive features
    const distinctive_features = character.distinctive_features && character.distinctive_features.length > 0
        ? character.distinctive_features
        : extractDistinctiveFeatures(character.description);

    console.log('✅ Distinctive features:', distinctive_features.length);

    // STEP 2: Build visual prompt using the helper
    const basicCharData = {
        name: character.name,
        role: character.role,
        description: character.description,
        distinctive_features
    };

    const seriesContext = {
        visual_style: seriesData.visual_style,
        setting: seriesData.setting,
        full_lore: seriesData.full_lore
    };

    let visual_prompt = buildDetailedVisualPrompt(basicCharData, seriesContext);

    console.log('📝 Visual prompt generated, length:', visual_prompt.length);

    // STEP 3: Emergency fallback (should never happen, but just in case)
    if (!visual_prompt || visual_prompt.trim().length === 0) {
        console.warn('⚠️  Visual prompt was empty, using emergency fallback');
        visual_prompt = `Retrato cinematográfico de ${character.name}. ${character.description.substring(0, 200)}. Estilo visual: ${seriesData.visual_style || 'cinematográfico'}. Iluminación dramática, composición profesional, alta calidad.`;
    }

    // STEP 4: Prepare the complete payload
    const insertPayload = {
        series_id: character.series_id,
        name: character.name,
        role: character.role,
        description: character.description,
        character_arc: character.character_arc || null,
        distinctive_features,
        visual_prompt, // GUARANTEED NON-NULL
        visual_keywords: character.visual_keywords || [],
        color_palette: character.color_palette || generateDefaultColorPalette(character.role),
        importance_level: character.importance_level || getDefaultImportanceLevel(character.role),
        // Required fields
        poster_status: 'pending',
        current_status: 'active',
        is_recurring: true,
        main_episodes: []
    };

    console.log('📦 Insert payload prepared:', {
        name: insertPayload.name,
        has_visual_prompt: !!insertPayload.visual_prompt,
        visual_prompt_length: insertPayload.visual_prompt?.length || 0
    });

    // STEP 5: Insert into database
    console.log('💾 Inserting into database...');
    const { data, error } = await supabase
        .from('characters')
        .insert([insertPayload])
        .select()
        .single();

    if (error) {
        console.error('❌ Insert error:', error);
        throw error;
    }

    console.log('✅ Character inserted successfully:', data.id);
    return data;
}

/**
 * Batch migrate multiple characters
 */
export async function migrateMultipleCharacters(
    characters: MigrationCharacter[],
    seriesData: {
        visual_style?: string;
        setting?: string;
        full_lore?: string;
    }
) {
    console.log(`🚀 Starting batch migration of ${characters.length} characters`);

    const results = [];
    const errors = [];

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        console.log(`\n[${i + 1}/${characters.length}] Migrating: ${char.name}`);

        try {
            const result = await insertCharacterWithPrompt(char, seriesData);
            results.push(result);
            console.log(`✅ Success: ${char.name}`);
        } catch (error: any) {
            console.error(`❌ Failed: ${char.name}`, error);
            errors.push({
                character: char.name,
                error: error.message
            });
        }
    }

    console.log(`\n✨ Batch migration complete!`);
    console.log(`   Created: ${results.length}`);
    console.log(`   Failed: ${errors.length}`);

    return { results, errors };
}

// Helper functions
function generateDefaultColorPalette(role: CharacterRole): string[] {
    const palettes: Record<string, string[]> = {
        protagonist: ['#3b82f6', '#60a5fa', '#1e40af', '#dbeafe'],
        antagonist: ['#ef4444', '#f87171', '#991b1b', '#fee2e2'],
        aliado: ['#10b981', '#34d399', '#065f46', '#d1fae5'],
        supporting: ['#6b7280', '#9ca3af', '#374151', '#f3f4f6'],
        minor: ['#9ca3af', '#d1d5db', '#4b5563', '#f9fafb']
    };
    return palettes[role] || palettes.minor;
}

function getDefaultImportanceLevel(role: CharacterRole): number {
    const levels: Record<string, number> = {
        protagonist: 10,
        antagonist: 9,
        aliado: 7,
        supporting: 5,
        minor: 3
    };
    return levels[role] || 5;
}