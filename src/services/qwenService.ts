import type { Story, QwenChatResponse } from '../types/story';
import {
    VisualStyleKey,
    VisualStyleLabel,
    ScriptStyleKey,
    ScriptStyleLabel,
    getVisualStyleMetadata,
    getScriptStyleMetadata,
    visualStyleLabelToKey,
    scriptStyleLabelToKey,
    isVisualStyleKey,
    isScriptStyleKey
} from '../types/styles';
import { supabase } from '../lib/supabase';
import type { InsertGeneration } from '../types/database';
import type { Episode, EpisodeSegment } from '../types/series';
import type { Character } from '../types/character';
import { TokenUsageService } from './tokenUsageService';

const QWEN_API_URL = '/api/qwen/chat/completions';

const SYSTEM_PROMPT_TEMPLATE = (
    duration: number,
    segmentCount: number,
    visualStyleLabel: string,
    visualStyleDesc: string,
    scriptStyleLabel: string,
    scriptStyleDesc: string
) => `
You are a video script generator.
Transform the user's idea into a structured ${duration}-second sci-fi story.

CRITICAL INSTRUCTIONS:
1. **LANGUAGE**: All narration text MUST be in **Mexican Spanish** (Español de México). Use appropriate local expressions and slang if it fits the tone.
2. **SCRIPT TONE**: Write the narration in a **"${scriptStyleLabel}"** style. Description: ${scriptStyleDesc}. Ensure the dialogue and pacing reflect this specific tone.
3. **VISUAL STYLE**: The visual prompts must describe scenes in the style of **"${visualStyleLabel}"**. Visual Reference: ${visualStyleDesc}. Focus on lighting, texture, and composition matching this style.
4. **NUMBERS**: ALWAYS convert numbers to their written form in Spanish (e.g., "treinta y dos" instead of "32", "dos mil treinta y dos" instead of "2032") to optimize for TTS.
5. Respond ONLY with a valid JSON object.
6. Do not include any introductory text or markdown code blocks (e.g., no \`\`\`json).
7. Create exactly ${segmentCount} segments.
8. Format:
{
  "story_title": "string (in Spanish)",
  "segments": [
    {
      "duration_seconds": number, // aiming for ~10s per segment
      "text": "The narration text for this part (in Mexican Spanish)",
      "visual_prompt": "A detailed, cinematic image generation prompt for Midjourney/DALL-E describing the scene in ${visualStyleLabel} style: ${visualStyleDesc}"
    }
  ]
}
`;

const EPISODE_SEGMENTS_PROMPT_TEMPLATE = (
    segmentCount: number,
    visualStyleLabel: string,
    visualStyleDesc: string,
    scriptStyleLabel: string,
    scriptStyleDesc: string
) => `
You are breaking down a serialized episode into cinematic video segments for production.

CRITICAL INSTRUCTIONS:
1. **LANGUAGE**: All narration text MUST be in **Mexican Spanish** (Español de México)
2. **SCRIPT TONE**: Use **"${scriptStyleLabel}"** style - ${scriptStyleDesc}
3. **VISUAL STYLE**: Describe scenes in **"${visualStyleLabel}"** style - ${visualStyleDesc}
4. **NUMBERS**: Convert ALL numbers to written Spanish (e.g., "treinta y dos" not "32")
5. **SEGMENT COUNT**: Generate EXACTLY ${segmentCount} segments
6. **FORMAT**: Return ONLY valid JSON, no markdown, no code blocks

REQUIRED JSON STRUCTURE:
{
  "segments": [
    {
      "segment_index": 0,
      "segment_type": "intro" | "main" | "cliffhanger",
      "character_focus": "Character Name (optional)",
      "text": "15-30 words of dramatic narration in Mexican Spanish",
      "visual_prompt": "Detailed cinematic scene description in ${visualStyleLabel} style: lighting, composition, mood, angle",
      "duration_seconds": 10-20
    }
  ]
}

SEGMENT TYPES:
- First segment: "intro" (establish setting/mood)
- Middle segments: "main" (advance story)
- Last segment: "cliffhanger" (dramatic ending)

Make it CINEMATIC and DRAMATIC!
`;

const CONTINUITY_PROMPT_TEMPLATE = (
    scriptStyleLabel: string,
    scriptStyleDesc: string
) => `
You are analyzing a TV episode to generate continuity context for the next episode.

CRITICAL INSTRUCTIONS:
1. **LANGUAGE**: All text MUST be in **Mexican Spanish** (Español de México)
2. **SCRIPT TONE**: Maintain **"${scriptStyleLabel}"** style - ${scriptStyleDesc}
3. **FORMAT**: Return ONLY valid JSON, no markdown, no code blocks

Your task:
- Analyze the episode's segments to identify key story developments
- Extract the cliffhanger or dramatic ending (if present)
- Create a brief recap (2-3 sentences) for the "Previously on..." segment
- Suggest a teaser for what might happen next

REQUIRED JSON STRUCTURE:
{
  "previous_episode_recap": "2-3 sentences summarizing the most important events in Mexican Spanish",
  "cliffhanger": "Description of how the episode ended dramatically (if applicable, in Mexican Spanish)",
  "next_episode_tease": "1-2 sentences hinting at what could happen next (in Mexican Spanish)"
}
`;

export class QwenService {
    /**
     * Generate a story structure from a base idea
     */
    static async generateStory(
        baseIdea: string,
        duration: number = 30,
        visualStyle: VisualStyleKey | VisualStyleLabel = VisualStyleKey.CinematicRealistic,
        scriptStyle: ScriptStyleKey | ScriptStyleLabel = ScriptStyleKey.DramaticTelenovela
    ): Promise<Story> {
        const startTime = new Date();
        let generationId: string | null = null;

        // Resolve metadata
        const vKey = isVisualStyleKey(visualStyle) ? visualStyle : visualStyleLabelToKey(visualStyle as VisualStyleLabel);
        const sKey = isScriptStyleKey(scriptStyle) ? scriptStyle : scriptStyleLabelToKey(scriptStyle as ScriptStyleLabel);

        const vMetadata = getVisualStyleMetadata(vKey);
        const sMetadata = getScriptStyleMetadata(sKey);

        try {
            // 1. Create initial generation record
            const newGeneration: InsertGeneration = {
                type: 'story',
                status: 'pending',
                provider: 'qwen',
                metadata: {
                    base_idea: baseIdea,
                    duration_target: duration,
                    visual_style: visualStyle,
                    script_style: scriptStyle
                }
            };

            const { data: genData, error: genError } = await (supabase
                .from('generations') as any)
                .insert(newGeneration)
                .select()
                .single();

            if (!genError && genData) {
                generationId = genData.id;
            } else {
                console.warn('Failed to create generation record:', genError);
            }

            // Calculate target segments (approx 10s per segment)
            const targetSegments = Math.max(3, Math.round(duration / 10));

            const response = await fetch(QWEN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen-plus',
                    messages: [
                        {
                            role: 'system',
                            content: SYSTEM_PROMPT_TEMPLATE(
                                duration,
                                targetSegments,
                                vMetadata.label,
                                vMetadata.description,
                                sMetadata.label,
                                sMetadata.description
                            )
                        },
                        { role: 'user', content: `Base Idea: ${baseIdea}` },
                    ],
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
            }

            const data: QwenChatResponse = await response.json();
            let content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('No content received from Qwen API');
            }

            // Sanitize content in case the AI added markdown blocks
            content = content.replace(/```json|```/g, '').trim();

            let parsedStory: Story;
            try {
                parsedStory = JSON.parse(content);
            } catch (error) {
                throw new Error(`Failed to parse story JSON: ${error}`);
            }

            // 2. Update generation record on success
            if (generationId) {
                const endTime = new Date();
                const durationMs = endTime.getTime() - startTime.getTime();

                await (supabase
                    .from('generations') as any)
                    .update({
                        status: 'completed',
                        end_time: endTime.toISOString(),
                        duration_ms: durationMs,
                        metadata: {
                            ...genData?.metadata,
                            segment_count: parsedStory.segments.length,
                            story_title: parsedStory.story_title
                        }
                    })
                    .eq('id', generationId);
            }

            // 3. Record token usage if available
            if (data.usage) {
                await TokenUsageService.recordTextUsage({
                    usage: data.usage,
                    model: 'qwen-plus',
                    contextType: 'story_generation',
                    storyId: undefined, // Story ID not available yet at this point
                    generationId: generationId || undefined,
                    metadata: {
                        base_idea: baseIdea,
                        duration_target: duration,
                        visual_style: visualStyle,
                        script_style: scriptStyle
                    }
                });
            }

            return parsedStory;

        } catch (error: any) {
            // 3. Update generation record on failure
            if (generationId) {
                const endTime = new Date();
                const durationMs = endTime.getTime() - startTime.getTime();

                await (supabase
                    .from('generations') as any)
                    .update({
                        status: 'failed',
                        end_time: endTime.toISOString(),
                        duration_ms: durationMs,
                        metadata: {
                            error: error.message || 'Unknown error'
                        }
                    })
                    .eq('id', generationId);
            }
            throw error;
        }
    }

    /**
     * Generate continuity context from previous episode
     */
    static async generateContinuity(
        previousEpisode: Episode,
        previousSegments: EpisodeSegment[],
        seriesContext: {
            title: string;
            script_style: string;
        }
    ): Promise<{
        previous_episode_recap: string;
        cliffhanger?: string;
        next_episode_tease?: string;
    }> {
        try {
            console.log(`Generating continuity from episode: ${previousEpisode.title}`);

            // Resolve script style
            const scriptStyle = seriesContext.script_style as ScriptStyleKey;
            const sKey = isScriptStyleKey(scriptStyle) ? scriptStyle : ScriptStyleKey.DramaticTelenovela;
            const sMetadata = getScriptStyleMetadata(sKey);

            // Build segments summary
            const segmentsSummary = previousSegments
                .sort((a, b) => a.segment_index - b.segment_index)
                .map((seg, idx) => `Segmento ${idx + 1} (${seg.segment_type}): ${seg.text}`)
                .join('\n');

            const systemPrompt = CONTINUITY_PROMPT_TEMPLATE(
                sMetadata.label,
                sMetadata.description
            );

            const userPrompt = `Analyze this episode to generate continuity for the next episode:

SERIE: ${seriesContext.title}
EPISODIO ANTERIOR: ${previousEpisode.title}

SINOPSIS:
${previousEpisode.synopsis}

SEGMENTOS DEL EPISODIO:
${segmentsSummary}

${previousEpisode.story_beats ? `
MOMENTOS CLAVE:
${previousEpisode.story_beats.map((beat, i) => `${i + 1}. ${beat}`).join('\n')}
` : ''}

Based on this, generate:
1. A recap (2-3 sentences) of the most important events
2. The cliffhanger/dramatic ending (if the last segment had one)
3. A teaser for what might happen in the next episode

Remember: ALL text must be in Mexican Spanish with the ${sMetadata.label} tone.`;

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
                    max_tokens: 1000
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Qwen API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data: QwenChatResponse = await response.json();
            let content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('No content received from Qwen API');
            }

            // Clean the response
            content = content.trim();
            content = content.replace(/```json|```/g, '');

            // Extract JSON
            const jsonStart = content.indexOf('{');
            if (jsonStart > 0) {
                content = content.substring(jsonStart);
            }
            const jsonEnd = content.lastIndexOf('}');
            if (jsonEnd < content.length - 1) {
                content = content.substring(0, jsonEnd + 1);
            }

            let parsedData: {
                previous_episode_recap: string;
                cliffhanger?: string;
                next_episode_tease?: string;
            };

            try {
                parsedData = JSON.parse(content.trim());
            } catch (error) {
                console.error('Failed to parse continuity JSON:', content);
                throw new Error(`Failed to parse continuity JSON: ${error}`);
            }

            if (!parsedData.previous_episode_recap) {
                throw new Error('Response does not contain previous_episode_recap');
            }

            console.log('✓ Generated continuity context');

            // Record token usage if available
            if (data.usage) {
                await TokenUsageService.recordTextUsage({
                    usage: data.usage,
                    model: 'qwen-plus',
                    contextType: 'episode_continuity',
                    episodeId: previousEpisode.id,
                    metadata: {
                        series_title: seriesContext.title,
                        previous_episode_title: previousEpisode.title
                    }
                });
            }

            return parsedData;

        } catch (error: any) {
            console.error('Continuity generation error:', error);
            throw error;
        }
    }

    /**
     * Generate segments for a serialized episode
     * Creates a story record first to satisfy foreign key constraint
     */
    static async generateSegments(
        episode: Episode,
        seriesContext: {
            title: string;
            full_lore: string;
            visual_style: string;
            script_style: string;
            main_characters: Character[];
        }
    ): Promise<EpisodeSegment[]> {
        const startTime = new Date();
        let generationId: string | null = null;
        let storyId: string | null = null;

        // Resolve visual and script styles
        const visualStyle = seriesContext.visual_style as VisualStyleKey;
        const scriptStyle = seriesContext.script_style as ScriptStyleKey;

        const vKey = isVisualStyleKey(visualStyle) ? visualStyle : VisualStyleKey.CinematicRealistic;
        const sKey = isScriptStyleKey(scriptStyle) ? scriptStyle : ScriptStyleKey.DramaticTelenovela;

        const vMetadata = getVisualStyleMetadata(vKey);
        const sMetadata = getScriptStyleMetadata(sKey);

        try {
            // 1. First, create a story record for this episode to satisfy FK constraint
            const { data: storyData, error: storyError } = await (supabase
                .from('stories') as any)
                .insert({
                    base_idea: episode.synopsis,
                    story_title: episode.title,
                    visual_style: seriesContext.visual_style,
                    script_tone: seriesContext.script_style,
                    profile_id: null, // or get from episode/series if available
                    video_status: 'idle'
                })
                .select()
                .single();

            if (storyError) {
                console.error('Failed to create story record:', storyError);
                throw new Error(`Failed to create story record: ${storyError.message}`);
            }

            storyId = storyData.id;
            console.log(`Created story record ${storyId} for episode ${episode.id}`);

            // 2. Create generation record
            const newGeneration: InsertGeneration = {
                type: 'story',
                status: 'pending',
                provider: 'qwen',
                story_id: storyId,
                metadata: {
                    episode_id: episode.id,
                    episode_title: episode.title,
                    series_title: seriesContext.title,
                    target_duration: episode.target_duration || 180,
                    generation_purpose: 'episode_segments'
                }
            };

            const { data: genData, error: genError } = await (supabase
                .from('generations') as any)
                .insert(newGeneration)
                .select()
                .single();

            if (!genError && genData) {
                generationId = genData.id;
            } else {
                console.warn('Failed to create generation record:', genError);
            }

            // 3. Calculate segment count based on target duration
            const targetDuration = episode.target_duration || 180;
            const segmentCount = Math.max(6, Math.ceil(targetDuration / 15));

            console.log(`Generating ${segmentCount} segments for episode: ${episode.title}`);

            // Build character list
            const charactersList = seriesContext.main_characters
                .map(c => `${c.name} (${c.role}): ${c.description}`)
                .join('\n');

            // Build featured characters list
            const featuredCharacters = episode.featured_characters
                ? episode.featured_characters.map((fc: any) => `${fc.name} (${fc.focus})`).join(', ')
                : 'Main characters';

            const systemPrompt = EPISODE_SEGMENTS_PROMPT_TEMPLATE(
                segmentCount,
                vMetadata.label,
                vMetadata.description,
                sMetadata.label,
                sMetadata.description
            );

            // Build continuity context if available
            let continuityContext = '';
            if (episode.previous_episode_recap) {
                continuityContext = `
CONTINUIDAD DEL EPISODIO ANTERIOR:
${episode.previous_episode_recap}
${episode.cliffhanger ? `\nÚLTIMA ESCENA DRAMÁTICA: ${episode.cliffhanger}` : ''}
`;
            }

            const userPrompt = `Break down this episode into ${segmentCount} cinematic segments:

SERIES: ${seriesContext.title}
EPISODE: ${episode.title}

SERIES LORE:
${seriesContext.full_lore}
${continuityContext}

EPISODE SYNOPSIS:
${episode.synopsis}

STORY BEATS:
${episode.story_beats ? episode.story_beats.map((beat, i) => `${i + 1}. ${beat}`).join('\n') : 'Follow the synopsis'}

AVAILABLE CHARACTERS:
${charactersList}

FEATURED IN THIS EPISODE:
${featuredCharacters}

${episode.next_episode_tease ? `TEASER PARA ESTE EPISODIO: ${episode.next_episode_tease}` : ''}

Generate ${segmentCount} segments (~${Math.floor(targetDuration / segmentCount)}s each):
- First segment: "intro" type (establish scene/mood${episode.previous_episode_recap ? ', can reference previous events briefly' : ''})
- Middle segments: "main" type (advance story, character moments)
- Last segment: "cliffhanger" type (dramatic ending)

Each segment needs:
- segment_index (0 to ${segmentCount - 1})
- segment_type
- character_focus (if a specific character is featured)
- text (15-30 words dramatic Spanish narration)
- visual_prompt (detailed scene: lighting, mood, composition, camera angle)
- duration_seconds (10-20s, total ~${targetDuration}s)`;

            // 4. Call AI to generate segments
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
                    max_tokens: 4000
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Qwen API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data: QwenChatResponse = await response.json();
            console.log('Segments API response:', data);

            let content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('No content received from Qwen API');
            }

            // Clean the response
            content = content.trim();
            content = content.replace(/```json|```/g, '');

            // Remove leading/trailing text
            const jsonStart = content.indexOf('{');
            if (jsonStart > 0) {
                content = content.substring(jsonStart);
            }
            const jsonEnd = content.lastIndexOf('}');
            if (jsonEnd < content.length - 1) {
                content = content.substring(0, jsonEnd + 1);
            }

            content = content.trim();

            let parsedData: { segments: any[] };
            try {
                parsedData = JSON.parse(content);
            } catch (error) {
                console.error('Failed to parse segments JSON:', content);
                throw new Error(`Failed to parse segments JSON: ${error}`);
            }

            if (!parsedData.segments || !Array.isArray(parsedData.segments)) {
                throw new Error('Response does not contain segments array');
            }

            if (parsedData.segments.length === 0) {
                throw new Error('Segments array is empty');
            }

            // 5. Save segments to database
            const segments: EpisodeSegment[] = [];

            for (const segment of parsedData.segments) {
                // Insert segment with story_id (now valid FK)
                const { data: segmentData, error: segmentError } = await (supabase
                    .from('segments') as any)
                    .insert({
                        story_id: storyId,  // Valid FK to stories table
                        episode_id: episode.id, // Link to episode
                        segment_index: segment.segment_index,
                        segment_type: segment.segment_type || 'main',
                        character_focus: segment.character_focus || null,
                        text: segment.text,
                        visual_prompt: segment.visual_prompt,
                        duration_seconds: segment.duration_seconds || 15,
                        image_url: null,
                        audio_url: null
                    })
                    .select()
                    .single();

                if (segmentError) {
                    console.error('Failed to insert segment:', segmentError);
                    throw new Error(`Failed to save segment: ${segmentError.message}`);
                }

                segments.push(segmentData);
            }

            // 6. Update generation record on success
            if (generationId) {
                const endTime = new Date();
                const durationMs = endTime.getTime() - startTime.getTime();

                await (supabase
                    .from('generations') as any)
                    .update({
                        status: 'completed',
                        end_time: endTime.toISOString(),
                        duration_ms: durationMs,
                        metadata: {
                            ...genData?.metadata,
                            segment_count: segments.length,
                            story_id: storyId
                        }
                    })
                    .eq('id', generationId);
            }

            console.log(`✓ Successfully generated ${segments.length} segments`);

            // 7. Record token usage if available
            if (data.usage) {
                await TokenUsageService.recordTextUsage({
                    usage: data.usage,
                    model: 'qwen-plus',
                    contextType: 'episode_segments',
                    episodeId: episode.id,
                    storyId: storyId || undefined,
                    generationId: generationId || undefined,
                    metadata: {
                        series_title: seriesContext.title,
                        episode_title: episode.title,
                        segment_count: segments.length
                    }
                });
            }

            return segments;

        } catch (error: any) {
            // Update generation record on failure
            if (generationId) {
                const endTime = new Date();
                const durationMs = endTime.getTime() - startTime.getTime();

                await (supabase
                    .from('generations') as any)
                    .update({
                        status: 'failed',
                        end_time: endTime.toISOString(),
                        duration_ms: durationMs,
                        metadata: {
                            error: error.message || 'Unknown error',
                            story_id: storyId
                        }
                    })
                    .eq('id', generationId);
            }

            console.error('Segment generation error:', error);
            throw error;
        }
    }

}