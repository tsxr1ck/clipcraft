// services/characterService.ts
import { supabase } from '../lib/supabase';
import { ImageService } from './imageService';
import type {
    Character,
    CreateCharacterRequest,
    UpdateCharacterRequest,
    CharacterWithVisuals,
    GeneratePosterRequest,
    GeneratePosterResponse
} from '../types/character';

export class CharacterService {
    // ============================================================================
    // CHARACTER CRUD
    // ============================================================================

    /**
     * Create a new character
     */
    static async createCharacter(
        data: CreateCharacterRequest
    ): Promise<Character> {

        const safeData = {
            ...data,
            visual_prompt:
                data.visual_prompt ??
                `Cinematic character portrait. Role: ${data.role}. Highly detailed, realistic lighting, professional photography, dramatic mood.`
        };

        const { data: character, error } = await supabase
            .from('characters')
            .insert([safeData])
            .select()
            .single();

        if (error) throw error;
        return character;
    }

    /**
     * Get all characters for a series
     */
    static async getSeriesCharacters(seriesId: string): Promise<Character[]> {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('series_id', seriesId)
            .eq('current_status', 'active')
            .order('importance_level', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get a single character by ID
     */
    static async getCharacter(characterId: string): Promise<Character> {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get character with all visual generations
     */
    static async getCharacterWithVisuals(characterId: string): Promise<CharacterWithVisuals> {
        const { data: character, error: charError } = await supabase
            .from('characters')
            .select('*, series(title, visual_style, setting)')
            .eq('id', characterId)
            .single();

        if (charError) throw charError;

        const { data: visuals, error: visualsError } = await supabase
            .from('character_visual_generations')
            .select('*')
            .eq('character_id', characterId)
            .order('created_at', { ascending: false });

        if (visualsError) throw visualsError;

        return {
            ...character,
            visual_generations: visuals || [],
            series: character.series
        };
    }

    /**
     * Update character
     */
    static async updateCharacter(
        characterId: string,
        updates: UpdateCharacterRequest
    ): Promise<Character> {
        const { data, error } = await supabase
            .from('characters')
            .update(updates)
            .eq('id', characterId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete character
     */
    static async deleteCharacter(characterId: string): Promise<void> {
        const { error } = await supabase
            .from('characters')
            .delete()
            .eq('id', characterId);

        if (error) throw error;
    }

    // ============================================================================
    // POSTER GENERATION
    // ============================================================================

    /**
     * Generate character poster
     */
    static async generateCharacterPoster(
        characterId: string,
        request?: Partial<GeneratePosterRequest>
    ): Promise<GeneratePosterResponse> {

        // Get character with series data to access visual_style
        const { data: character, error: charError } = await supabase
            .from('characters')
            .select('*, series(visual_style, setting, title)')
            .eq('id', characterId)
            .single();

        if (charError) throw charError;

        // Get the series visual style (e.g., 'cinematic', 'anime', etc.)
        const seriesVisualStyle = character.series?.visual_style || 'cinematic';

        // Build a prompt that incorporates the series style and enforces consistency
        const prompt = request?.custom_prompt ?? this.buildCharacterPosterPrompt(character, seriesVisualStyle);

        // Use the series visual style for image generation
        const style = request?.visual_style ?? seriesVisualStyle;

        console.log(`🎨 Generating poster for ${character.name} in style: ${style}`);

        // 1️⃣ Generate image using shared service
        const imageUrl = await ImageService.generateImage(prompt, style);

        // 2️⃣ Store generation
        const { data: generation, error } = await supabase
            .from('character_visual_generations')
            .insert([{
                character_id: characterId,
                prompt,
                visual_style: style,
                generation_type: 'poster',
                status: 'completed',
                image_url: imageUrl,
                is_selected: true
            }])
            .select()
            .single();

        if (error) throw error;

        // 3️⃣ Update character
        await supabase
            .from('characters')
            .update({
                poster_url: imageUrl,
                poster_status: 'completed',
                poster_prompt: prompt
            })
            .eq('id', characterId);

        return {
            job_id: generation.id, // semantic ID now
            generation_id: generation.id,
            status: 'completed',
            estimated_time_seconds: 0
        };
    }

    /**
     * Build a detailed character poster prompt that enforces series visual style
     */
    private static buildCharacterPosterPrompt(character: any, visualStyle: string): string {
        const features = character.distinctive_features?.join(', ') || '';
        const seriesTitle = character.series?.title || '';
        const setting = character.series?.setting || '';

        // Build a prompt that strongly emphasizes the visual style
        return `Character portrait for "${seriesTitle}". ${character.name}, ${character.role}. ${character.description}. Distinctive features: ${features}. ${setting ? `Setting: ${setting}.` : ''} IMPORTANT: Generate in ${visualStyle} visual style. The character MUST match the ${visualStyle} aesthetic of the series. High quality, detailed, dramatic lighting, cinematic composition.`;
    }



    /**
     * Generate series poster
     */
    static async generateSeriesPoster(
        seriesId: string,
        request?: Partial<GeneratePosterRequest>
    ): Promise<GeneratePosterResponse> {
        // Get series data
        const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('*')
            .eq('id', seriesId)
            .single();

        if (seriesError) throw seriesError;

        // Build poster prompt
        const prompt = request?.custom_prompt || this.buildSeriesPosterPrompt(series);
        const style = request?.visual_style || series.visual_style || 'cinematic';

        // 1️⃣ Generate image using shared service
        const imageUrl = await ImageService.generateImage(prompt, style as any);

        // 2️⃣ Store generation
        const { data: generation, error } = await supabase
            .from('series_poster_generations')
            .insert([{
                series_id: seriesId,
                prompt,
                visual_style: style,
                status: 'completed',
                image_url: imageUrl,
                is_selected: true
            }])
            .select()
            .single();

        if (error) throw error;

        // 3️⃣ Update series
        await supabase
            .from('series')
            .update({
                series_poster_url: imageUrl,
                series_poster_status: 'completed',
                series_poster_prompt: prompt
            })
            .eq('id', seriesId);

        return {
            job_id: generation.id,
            generation_id: generation.id,
            status: 'completed',
            estimated_time_seconds: 0
        };
    }

    /**
     * Handle image generation webhook completion
     */
    static async handleImageGenerationComplete(
        jobId: string,
        imageUrl: string,
        status: 'completed' | 'failed',
        errorMessage?: string
    ): Promise<void> {
        // Check if it's a character poster
        const { data: charGen } = await supabase
            .from('character_visual_generations')
            .select('*, characters(*)')
            .eq('job_id', jobId)
            .single();

        if (charGen) {
            // Update generation record
            await supabase
                .from('character_visual_generations')
                .update({
                    image_url: imageUrl,
                    status,
                    error_message: errorMessage,
                    is_selected: true // Mark as selected if it's the first/only one
                })
                .eq('id', charGen.id);

            // Update character
            await supabase
                .from('characters')
                .update({
                    poster_url: status === 'completed' ? imageUrl : null,
                    poster_status: status
                })
                .eq('id', charGen.character_id);

            return;
        }

        // Check if it's a series poster
        const { data: seriesGen } = await supabase
            .from('series_poster_generations')
            .select('*')
            .eq('job_id', jobId)
            .single();

        if (seriesGen) {
            // Update generation record
            await supabase
                .from('series_poster_generations')
                .update({
                    image_url: imageUrl,
                    status,
                    error_message: errorMessage,
                    is_selected: true
                })
                .eq('id', seriesGen.id);

            // Update series
            await supabase
                .from('series')
                .update({
                    series_poster_url: status === 'completed' ? imageUrl : null,
                    series_poster_status: status
                })
                .eq('id', seriesGen.series_id);
        }
    }

    // ============================================================================
    // MIGRATION HELPERS
    // ============================================================================

    /**
     * Migrate JSONB characters to characters table for a series
     */
    static async migrateSeriesCharacters(seriesId: string): Promise<Character[]> {
        // Get series with JSONB characters
        const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('*')
            .eq('id', seriesId)
            .single();

        if (seriesError) throw seriesError;

        if (!series.main_characters || !Array.isArray(series.main_characters)) {
            return [];
        }

        const characters: Character[] = [];

        for (const char of series.main_characters) {
            const characterData: CreateCharacterRequest = {
                series_id: seriesId,
                name: char.name,
                role: char.role,
                description: char.description || '',
                character_arc: char.characterArc,
                distinctive_features: char.traits || ['No distinctive features defined'],
                visual_keywords: this.extractVisualKeywords(char.description || ''),
                color_palette: this.generateColorPalette(char.role),
                importance_level: char.role === 'protagonist' ? 10 : char.role === 'antagonist' ? 9 : 5
            };

            const created = await this.createCharacter(characterData);
            characters.push(created);
        }

        return characters;
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private static buildSeriesPosterPrompt(series: any): string {
        return `Movie poster for "${series.title}" - ${series.tagline || series.base_concept}. ${series.full_lore.substring(0, 300)}. Setting: ${series.setting}. Genre: ${series.genre.join(', ')}. Themes: ${series.themes.join(', ')}. Visual style: ${series.visual_style}. Cinematic, dramatic, high-quality poster design with title treatment.`;
    }

    private static extractVisualKeywords(description: string): string[] {
        // Simple keyword extraction - you can enhance this
        const keywords = description
            .toLowerCase()
            .match(/\b(\w{4,})\b/g) || [];
        return [...new Set(keywords)].slice(0, 10);
    }

    private static generateColorPalette(role: string): string[] {
        const palettes: Record<string, string[]> = {
            protagonist: ['#3b82f6', '#60a5fa', '#1e40af', '#dbeafe'],
            antagonist: ['#ef4444', '#f87171', '#991b1b', '#fee2e2'],
            aliado: ['#10b981', '#34d399', '#065f46', '#d1fae5'],
            supporting: ['#6b7280', '#9ca3af', '#374151', '#f3f4f6'],
            minor: ['#9ca3af', '#d1d5db', '#4b5563', '#f9fafb']
        };

        return palettes[role] || palettes.minor;
    }
}