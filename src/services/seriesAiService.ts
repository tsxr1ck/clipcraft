// services/seriesAIService.ts - V2 WITH AGGRESSIVE FIXES
import type {
    CreateSeriesRequest,
    GeneratedSeries,
    GenerateEpisodesRequest,
    GeneratedEpisodes,
    FeaturedCharacter
} from '../types/series';
import type { Character, CreateCharacterRequest } from '../types/character';
import { CharacterService } from './characterService';
import { buildDetailedVisualPrompt } from '../helpers/visualPromptBuilder';
import { TokenUsageService } from './tokenUsageService';

const QWEN_API_URL = '/api/qwen/chat/completions';

export class SeriesAIService {
    // ============================================================================
    // GENERATE SERIES LORE WITH CHARACTER CREATION
    // ============================================================================

    /**
     * Generate complete series lore from a base concept
     * Now also creates characters in the database
     */
    static async generateSeriesLore(request: CreateSeriesRequest): Promise<{
        seriesData: GeneratedSeries;
        characterIds: string[];
    }> {
        const {
            base_concept,
            planned_seasons = 1,
            episodes_per_season = 6,
            visual_style = 'cinematic',
            script_style = 'dramatic'
        } = request;

        const systemPrompt = `You are a master storyteller creating a serialized video series in Mexican Spanish.

CRITICAL INSTRUCTIONS:
1. **LANGUAGE**: All text content MUST be in **Mexican Spanish** (Español de México)
2. **NUMBERS**: Convert all numbers to written form in Spanish
3. **TONE**: Use "${script_style}" style for all descriptions
4. **STYLE**: Visual descriptions should reflect "${visual_style}" aesthetic
5. Respond ONLY with valid JSON (no markdown, no code blocks)

Generate a complete series bible with this EXACT structure:
{
  "title": "Series Title (Spanish)",
  "tagline": "One-line hook (Spanish)",
  "full_lore": "500-800 word world-building in Spanish",
  "genre": ["genre1", "genre2"],
  "themes": ["theme1", "theme2", "theme3"],
  "setting": "Detailed setting description (Spanish)",
  "narrative_style": "continuous",
  "main_characters": [
    {
      "name": "Character Name",
      "role": "protagonist",
      "description": "Character details in Spanish",
      "characterArc": "How they change (Spanish)",
      "age_range": "late teens" | "young adult" | "middle aged" | "elderly",
      "distinctive_features": ["feature1", "feature2", "feature3"],
      "clothing_style": "description of typical clothing"
    }
  ],
  "season_outlines": [
    {
      "season_number": 1,
      "theme": "Season theme (Spanish)",
      "arc": "Main season arc (Spanish)",
      "episode_summaries": ["Episode 1 summary", "Episode 2 summary"]
    }
  ]
}`;

        const userPrompt = `Create a serialized video series based on this concept:

BASE CONCEPT: ${base_concept}

PARAMETERS:
- Seasons: ${planned_seasons}
- Episodes per Season: ${episodes_per_season}
- Visual Style: ${visual_style}
- Script Style: ${script_style}
- Duration: ~3 minutes per episode

Include:
1. Catchy Spanish title & tagline
2. Rich 500-800 word lore (world-building, history, central conflict)
3. 2-4 genres and 3-5 themes
4. Detailed setting description
5. 3-5 main characters with:
   - names, roles (protagonist/antagonist/aliado/supporting)
   - descriptions and character arcs
   - age_range
   - 3-5 distinctive_features (visual traits for AI image generation)
   - clothing_style description
6. ${planned_seasons} season outline(s) with theme, arc, and ${episodes_per_season} episode summaries each`;

        try {
            const response = await fetch(QWEN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen-plus',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.8,
                }),
            });

            if (!response.ok) {
                throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('No content received from Qwen API');
            }

            content = content.replace(/```json|```/g, '').trim();
            const seriesData: GeneratedSeries = JSON.parse(content);

            // Record token usage for series lore generation
            if (data.usage) {
                await TokenUsageService.recordTextUsage({
                    usage: data.usage,
                    model: 'qwen-plus',
                    contextType: 'series_lore_generation',
                    metadata: {
                        base_concept: base_concept,
                        planned_seasons,
                        episodes_per_season,
                        visual_style,
                        script_style
                    }
                });
            }

            return {
                seriesData,
                characterIds: [] // Will be populated after series is created
            };
        } catch (error) {
            console.error('Series lore generation error:', error);
            throw error;
        }
    }

    /**
     * Create characters in database from generated series data
     */
    static async createCharactersForSeries(
        seriesId: string,
        characters: Character[],
        seriesVisualStyle: string,
        seriesSetting: string
    ): Promise<string[]> {
        const characterIds: string[] = [];

        for (const char of characters) {
            try {
                // Extract visual keywords from description
                const visualKeywords = this.extractVisualKeywords(
                    char.description,
                    char.distinctive_features || []
                );

                // Generate color palette based on role
                const colorPalette = this.generateColorPalette(char.role);

                // Build visual prompt
                const visualPrompt = buildDetailedVisualPrompt(
                    {
                        name: char.name,
                        role: char.role as any,
                        description: char.description,
                        distinctive_features: char.distinctive_features
                    },
                    {
                        visual_style: seriesVisualStyle,
                        setting: seriesSetting
                    }
                );

                const characterData: CreateCharacterRequest = {
                    series_id: seriesId,
                    name: char.name,
                    role: char.role as any,
                    description: char.description,
                    visual_prompt: visualPrompt,
                    character_arc: char.character_arc,
                    age_range: char.age_range,
                    distinctive_features: char.distinctive_features || ['No specific features defined'],
                    clothing_style: char.clothing_style,
                    visual_keywords: visualKeywords,
                    color_palette: colorPalette,
                    importance_level: char.role === 'protagonist' ? 10 :
                        char.role === 'antagonist' ? 9 :
                            char.role === 'aliado' ? 7 : 5
                };

                const createdCharacter = await CharacterService.createCharacter(characterData);
                characterIds.push(createdCharacter.id);

                // Optionally: Auto-generate poster for main characters
                if (char.role === 'protagonist' || char.role === 'antagonist') {
                    // Fire and forget - don't wait for poster generation
                    CharacterService.generateCharacterPoster(createdCharacter.id)
                        .catch(err => console.error('Poster generation failed:', err));
                }
            } catch (error) {
                console.error(`Failed to create character ${char.name}:`, error);
                // Continue with other characters even if one fails
            }
        }

        return characterIds;
    }

    // ============================================================================
    // GENERATE EPISODES FOR A SEASON - V2 AGGRESSIVE FIX
    // ============================================================================

    /**
     * Generate detailed episodes for a specific season with retry logic
     */
    static async generateEpisodes(
        request: GenerateEpisodesRequest,
        seriesData: {
            title: string;
            full_lore: string;
            main_characters: Character[];
            season_outline: {
                theme: string;
                arc: string;
                episode_summaries: string[] | number; // Can be array of summaries or just a count
            };
        },
        targetDuration: number = 180
    ): Promise<GeneratedEpisodes> {
        const { season_number } = request;
        // Handle both array and number for episode_summaries
        const episodeCount = Array.isArray(seriesData.season_outline.episode_summaries)
            ? seriesData.season_outline.episode_summaries.length
            : seriesData.season_outline.episode_summaries;

        // Try up to 3 times with different temperature settings
        const attempts = [
            { temperature: 0.9, maxTokens: 6000 },
            { temperature: 0.7, maxTokens: 8000 },
            { temperature: 0.5, maxTokens: 10000 }
        ];

        let lastError: Error | null = null;

        for (let i = 0; i < attempts.length; i++) {
            const { temperature, maxTokens } = attempts[i];
            console.log(`\n=== Episode generation attempt ${i + 1}/${attempts.length} ===`);
            console.log(`Temperature: ${temperature}, Max Tokens: ${maxTokens}`);

            try {
                const result = await this.attemptEpisodeGeneration(
                    season_number,
                    episodeCount,
                    seriesData,
                    targetDuration,
                    temperature,
                    maxTokens
                );

                // If successful, return immediately
                if (result.episodes && result.episodes.length > 0) {
                    console.log(`✓ Success on attempt ${i + 1}!`);
                    return result;
                }
            } catch (error) {
                console.error(`✗ Attempt ${i + 1} failed:`, error.message);
                lastError = error;

                // Wait a bit before retrying
                if (i < attempts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        // All attempts failed - throw the last error
        throw lastError || new Error('All episode generation attempts failed');
    }

    /**
     * Single attempt at episode generation
     */
    private static async attemptEpisodeGeneration(
        season_number: number,
        episodeCount: number,
        seriesData: any,
        targetDuration: number,
        temperature: number,
        maxTokens: number
    ): Promise<GeneratedEpisodes> {

        // EXTREMELY EXPLICIT SYSTEM PROMPT
        const systemPrompt = `You are an AI that generates episode data. You MUST generate ${episodeCount} episodes.

ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:
1. The response MUST start with: {"episodes":[
2. You MUST generate EXACTLY ${episodeCount} episode objects
3. Each episode MUST have these fields: episode_number, title, synopsis, story_beats, featured_characters, is_premiere, is_finale
4. DO NOT return an empty episodes array []
5. DO NOT return {"episodes":[]}
6. Return ONLY JSON - no explanations, no markdown, no code blocks

EXACT OUTPUT FORMAT YOU MUST USE:

{"episodes":[{"episode_number":1,"title":"Título en Español","synopsis":"Mínimo 100 palabras en español describiendo la trama del episodio, los personajes involucrados, y los eventos principales que ocurren. Este debe ser detallado y envolvente.","story_beats":["Primer evento importante","Segundo evento","Tercer evento","Cuarto evento"],"featured_characters":[{"name":"Personaje 1","focus":"protagonist"},{"name":"Personaje 2","focus":"supporting"}],"cliffhanger":"Final dramático del episodio","is_premiere":true,"is_finale":false},{"episode_number":2,"title":"Segundo Episodio","synopsis":"Otro resumen detallado de al menos 100 palabras...","story_beats":["Beat 1","Beat 2","Beat 3","Beat 4"],"featured_characters":[{"name":"Personaje","focus":"protagonist"}],"cliffhanger":"Suspenso","is_premiere":false,"is_finale":false}]}

YOU MUST GENERATE ${episodeCount} EPISODES LIKE THE EXAMPLE ABOVE.
EMPTY ARRAYS ARE NOT ACCEPTABLE.
START YOUR RESPONSE WITH: {"episodes":[`;

        const charactersList = seriesData.main_characters
            .map(c => `${c.name} (${c.role})`)
            .join(', ');

        // SIMPLER, MORE DIRECT USER PROMPT
        const userPrompt = `Generate ${episodeCount} episodes for:

Series: ${seriesData.title}
Season ${season_number}: ${seriesData.season_outline.theme}
Characters: ${charactersList}

Episode summaries to expand:
${Array.isArray(seriesData.season_outline.episode_summaries)
                ? seriesData.season_outline.episode_summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')
                : Array.from({ length: episodeCount }, (_, i) => `${i + 1}. Episode ${i + 1}`).join('\n')}

For each of the ${episodeCount} episodes, provide:
- episode_number: ${Array.from({ length: episodeCount }, (_, i) => i + 1).join(', ')}
- title: Spanish title
- synopsis: 100+ word detailed Spanish description
- story_beats: Array of 4-6 story moments
- featured_characters: Array of 2-4 characters with focus
- cliffhanger: Dramatic ending (omit for last episode)
- is_premiere: true for episode 1 only
- is_finale: true for episode ${episodeCount} only

GENERATE ALL ${episodeCount} EPISODES NOW.`;

        console.log('Sending request to Qwen API...');
        console.log('Episode count:', episodeCount);

        const response = await fetch(QWEN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen-plus',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                top_p: 0.95,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Qwen API HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Log the raw response for debugging
        console.log('\n=== RAW API RESPONSE ===');
        console.log('Finish reason:', data.choices?.[0]?.finish_reason);
        console.log('Content length:', data.choices?.[0]?.message?.content?.length || 0);
        console.log('First 500 chars:', data.choices?.[0]?.message?.content?.substring(0, 500));

        let content = data.choices?.[0]?.message?.content;

        if (!content || content.trim().length === 0) {
            throw new Error('API returned empty content');
        }

        // Aggressive cleaning
        content = content.trim();

        // Remove any markdown
        content = content.replace(/```json/gi, '');
        content = content.replace(/```/g, '');

        // Remove any leading text before the JSON
        const jsonStart = content.indexOf('{');
        if (jsonStart > 0) {
            console.log('⚠ Removed leading text before JSON');
            content = content.substring(jsonStart);
        }

        // Remove any trailing text after the JSON
        const jsonEnd = content.lastIndexOf('}');
        if (jsonEnd < content.length - 1) {
            console.log('⚠ Removed trailing text after JSON');
            content = content.substring(0, jsonEnd + 1);
        }

        content = content.trim();

        console.log('\n=== CLEANED CONTENT ===');
        console.log('Length:', content.length);
        console.log('First 200 chars:', content.substring(0, 200));
        console.log('Last 200 chars:', content.substring(content.length - 200));

        // Try to parse
        let episodesData: GeneratedEpisodes;
        try {
            episodesData = JSON.parse(content);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Content that failed:', content);
            throw new Error(`JSON parse failed: ${parseError.message}`);
        }

        // Validate structure
        if (!episodesData || typeof episodesData !== 'object') {
            throw new Error('Parsed data is not an object');
        }

        if (!episodesData.episodes) {
            console.error('Response object:', episodesData);
            throw new Error('Response missing "episodes" field');
        }

        if (!Array.isArray(episodesData.episodes)) {
            throw new Error('episodes field is not an array');
        }

        if (episodesData.episodes.length === 0) {
            throw new Error('Episodes array is empty - AI did not generate episodes');
        }

        // Validate each episode
        for (let i = 0; i < episodesData.episodes.length; i++) {
            const ep = episodesData.episodes[i];
            const missing: string[] = [];

            if (!ep.title) missing.push('title');
            if (!ep.synopsis) missing.push('synopsis');
            if (!ep.story_beats) missing.push('story_beats');
            if (!ep.featured_characters) missing.push('featured_characters');
            if (ep.episode_number === undefined) missing.push('episode_number');

            if (missing.length > 0) {
                throw new Error(`Episode ${i + 1} missing fields: ${missing.join(', ')}`);
            }
        }

        console.log(`✓ Successfully generated ${episodesData.episodes.length} valid episodes`);

        // Record token usage for episode generation
        if (data.usage) {
            await TokenUsageService.recordTextUsage({
                usage: data.usage,
                model: 'qwen-plus',
                contextType: 'episode_batch_generation',
                metadata: {
                    season_number,
                    episode_count: episodesData.episodes.length,
                    series_title: seriesData.title
                }
            });
        }

        return episodesData;
    }

    // ============================================================================
    // GENERATE SEGMENTS FOR AN EPISODE
    // ============================================================================

    /**
     * Break an episode into segments for video production
     */
    static async generateSegments(
        episode: {
            title: string;
            synopsis: string;
            story_beats: string[];
            featured_characters: FeaturedCharacter[];
        },
        seriesContext: {
            title: string;
            full_lore: string;
            visual_style: string;
            script_style: string;
            main_characters: Character[];
        },
        targetDuration: number = 180
    ): Promise<{
        segments: Array<{
            segment_index: number;
            segment_type: 'intro' | 'main' | 'cliffhanger';
            character_focus?: string;
            text: string;
            visual_prompt: string;
            duration_seconds: number;
        }>;
    }> {
        const segmentCount = Math.ceil(targetDuration / 15);

        const systemPrompt = `You are breaking an episode into cinematic video segments.

CRITICAL INSTRUCTIONS:
1. **LANGUAGE**: All narration text MUST be in **Mexican Spanish** (Español de México)
2. **NUMBERS**: ALWAYS write numbers in Spanish words (e.g., "treinta y dos" not "32")
3. **TONE**: Use "${seriesContext.script_style}" style for narration
4. **VISUALS**: Describe scenes in "${seriesContext.visual_style}" style
5. Respond ONLY with valid JSON (no markdown, no code blocks)

Return EXACTLY this structure:
{
  "segments": [
    {
      "segment_index": 0,
      "segment_type": "intro",
      "character_focus": "Character Name",
      "text": "15-30 words narration in Mexican Spanish",
      "visual_prompt": "Detailed scene for image generation in ${seriesContext.visual_style} style",
      "duration_seconds": 15
    }
  ]
}`;

        const userPrompt = `Break this episode into ${segmentCount} segments:

SERIES: ${seriesContext.title}
EPISODE: ${episode.title}

CONTEXT:
${seriesContext.full_lore}

EPISODE SYNOPSIS:
${episode.synopsis}

BEATS: ${episode.story_beats.join(', ')}

CHARACTERS:
${episode.featured_characters.map(c => `- ${c.name} (${c.focus})`).join('\n')}

Create ${segmentCount} segments (~${Math.floor(targetDuration / segmentCount)}s each):

SEGMENT TYPES:
- First: "intro" (sets the scene)
- Middle: "main" (advances story)
- Last: "cliffhanger" (dramatic ending)

For each segment:
- segment_index (0 to ${segmentCount - 1})
- segment_type
- character_focus (if applicable)
- text (15-30 words dramatic Spanish narration for TTS)
- visual_prompt (detailed scene: mood, lighting, composition, angle)
- duration_seconds (10-20s, total ~${targetDuration}s)

Make it DRAMATIC and CINEMATIC!`;

        try {
            const response = await fetch(QWEN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen-plus',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('No content received from Qwen API');
            }

            content = content.replace(/```json|```/g, '').trim();
            return JSON.parse(content);
        } catch (error) {
            console.error('Segment generation error:', error);
            throw error;
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private static extractVisualKeywords(
        description: string,
        distinctiveFeatures: string[]
    ): string[] {
        const keywords = new Set<string>();

        // Extract from description
        const descWords = description
            .toLowerCase()
            .match(/\b(\w{4,})\b/g) || [];
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