import { supabase } from '../../../lib/supabase';
import { WanService } from './wanService';
// import { AudioService } from '../../../services/audioService'; // Disabled for now

// We use 'any' casting for now as the types are dynamic
// interface WanStorySegment ... defined in DB but accessed via any

export class WanOrchestrator {

    /**
     * Process a Single Segment (Video Only)
     * Operates on wan_story_segments
     */
    static async processSegment(segmentId: string): Promise<any> {
        const { data: segment, error } = await (supabase as any)
            .from('wan_story_segments')
            .select('*')
            .eq('id', segmentId)
            .single();

        if (error || !segment) throw new Error('Segment not found');

        const wanSegment = segment;

        // A. Generate Audio - SKIPPED per user request. 
        // We proceed directly to video generation using the model's native capabilities.

        // B. Generate Video
        // Proceed if we haven't submitted a task and don't have a result
        if (!wanSegment.dashscope_task_id && !wanSegment.video_url) {
            try {
                // Default to 15s per user request
                const estimatedDuration = 15;

                // Pass null for audioUrl logic
                // Append text_content to prompt so the model attempts to generate matching audio/lip-sync if capable
                const fullPrompt = `${wanSegment.visual_prompt}. ${wanSegment.text_content}`;

                const taskId = await WanService.generateVideo(
                    fullPrompt,
                    null,
                    { duration: estimatedDuration as 5 | 10 | 15 }
                );

                const { data: updated } = await (supabase as any)
                    .from('wan_story_segments')
                    .update({
                        dashscope_task_id: taskId,
                        status: 'generating_video',
                        audio_url: null // Explicitly null
                    })
                    .eq('id', segmentId)
                    .select()
                    .single();

                return updated;
            } catch (err) {
                console.error("Video submission failed", err);
                await (supabase as any).from('wan_story_segments').update({ status: 'failed', error_message: 'Video Submit Failed' }).eq('id', segmentId);
                throw err;
            }
        }

        // C. Poll Video Status if generating
        if (wanSegment.status === 'generating_video' && wanSegment.dashscope_task_id) {
            try {
                const result = await WanService.getTaskStatus(wanSegment.dashscope_task_id);

                if (result.status === 'completed' && result.video_url) {
                    const { data: updated } = await (supabase as any)
                        .from('wan_story_segments')
                        .update({
                            video_url: result.video_url,
                            status: 'video_ready'
                        })
                        .eq('id', segmentId)
                        .select()
                        .single();
                    return updated;

                } else if (result.status === 'failed') {
                    await (supabase as any).from('wan_story_segments').update({ status: 'failed', error_message: result.error }).eq('id', segmentId);
                }
            } catch (err) {
                console.error("Polling failed", err);
            }
        }

        return wanSegment;
    }
}
