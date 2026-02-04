import { supabase } from '../../../lib/supabase';

// Qwen Endpoints via Proxy
const QWEN_API_URL = '/api/qwen/chat/completions';

export interface GeneratedWanStory {
    title: string;
    visual_style: string;
    segments: {
        text: string;
        visual_prompt: string;
    }[];
}

export class WanStoryService {

    /**
     * Generate a full story structure + segments from a simple premise
     */
    static async generateStoryFromPremise(premise: string, visualStyle: string = 'Cinematic', segmentCount: number = 3): Promise<string> {

        const systemPrompt = `You are an expert short-form video director.
        Create a compelling video script based on the user's premise.
        
        CRITICAL RULES:
        1. LANGUAGE: All "text" content MUST be in Mexican Spanish.
        2. STRUCTURE: Generate EXACTLY ${segmentCount} segments (Intro, Middle, Climax/End).
        3. DURATION: Each segment represents about 5 seconds of video.
        4. STYLE: Visual style must be "${visualStyle}".

        Structure the response as strictly valid JSON:
        {
            "title": "Catchy Title (Spanish)",
            "visual_style": "${visualStyle}",
            "segments": [
                {
                    "text": "Voiceover/Narration text in Spanish",
                    "visual_prompt": "Detailed visual description for AI video generation (Wan2.6 model). details on lighting, camera angle, action."
                }
            ]
        }
        
        The segments should flow logically.
        Keep visual prompts descriptive but focused on the action.`;

        const userPrompt = `Premise: ${premise}`;

        try {
            const response = await fetch(QWEN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization handled by Vite Proxy
                    // 'Authorization': `Bearer ${process.env.VITE_QWEN_API_KEY}` 
                },
                body: JSON.stringify({
                    model: 'qwen-plus', // or qwen-turbo
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`AI Generation Failed: ${err}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Clean markdown if present
            const cleanJson = content.replace(/```json\n?|```/g, '').trim();
            const storyData: GeneratedWanStory = JSON.parse(cleanJson);

            return await this.saveStoryToDb(storyData, premise);

        } catch (error) {
            console.error('Story Generation Error:', error);
            throw error;
        }
    }

    private static async saveStoryToDb(data: GeneratedWanStory, originalPremise: string): Promise<string> {
        // 1. Create Story
        const { data: story, error: storyError } = await (supabase as any)
            .from('wan_stories')
            .insert([{
                title: data.title,
                premise: originalPremise,
                visual_style: data.visual_style,
                status: 'draft'
            }])
            .select()
            .single();

        if (storyError) throw storyError;
        const storyId = story.id;

        // 2. Create Segments
        const segmentsToInsert = data.segments.map((seg, index) => ({
            wan_story_id: storyId,
            segment_index: index + 1,
            text_content: seg.text,
            visual_prompt: seg.visual_prompt,
            status: 'pending'
        }));

        const { error: segError } = await (supabase as any)
            .from('wan_story_segments')
            .insert(segmentsToInsert);

        if (segError) throw segError;

        return storyId;
    }

    /**
     * Get a story with its segments
     */
    static async getStory(storyId: string) {
        const { data: story, error: storyError } = await (supabase as any)
            .from('wan_stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (storyError) throw storyError;

        const { data: segments, error: segError } = await (supabase as any)
            .from('wan_story_segments')
            .select('*')
            .eq('wan_story_id', storyId)
            .order('segment_index', { ascending: true });

        if (segError) throw segError;

        return { story, segments };
    }
}
