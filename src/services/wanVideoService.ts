import { supabase } from '../lib/supabase';
import { WanService } from '../features/wan-video/services/wanService';

export class WanVideoService {

    /**
     * Process a single segment for video generation
     * Handles submission and polling loop logic would live in a hook or separate orchestrator
     * This method advances the state one step
     */
    static async processSegment(segmentId: string): Promise<any> {
        const { data: segment, error } = await (supabase as any)
            .from('segments')
            .select('*')
            .eq('id', segmentId)
            .single();

        if (error || !segment) throw new Error('Segment not found');

        // Check if already completed
        if (segment.video_status === 'completed' && segment.video_url) {
            return segment;
        }

        // Check if failed, maybe retry? 
        // For now, if failed, we allow re-submission if called again explicitly, 
        // but normally we might want to check retry counts.

        // If generating, check status
        if (segment.video_status === 'generating' && segment.video_asset_id) {
            try {
                const result = await WanService.getTaskStatus(segment.video_asset_id);

                if (result.status === 'completed' && result.video_url) {
                    const { data: updated } = await (supabase as any)
                        .from('segments')
                        .update({
                            video_url: result.video_url,
                            video_status: 'completed'
                        })
                        .eq('id', segmentId)
                        .select()
                        .single();
                    return updated;
                } else if (result.status === 'failed') {
                    const { data: updated } = await (supabase as any)
                        .from('segments')
                        .update({
                            video_status: 'failed',
                            // potentially store error message in metadata if we had a column
                        })
                        .eq('id', segmentId)
                        .select()
                        .single();
                    return updated;
                }

                // Still pending/running
                return segment;
            } catch (err) {
                console.error("Polling failed for segment", segmentId, err);
                return segment; // Return unchanged on polling error
            }
        }

        // If idle (or failed and retrying), submit new task
        if (segment.video_status === 'idle' || segment.video_status === 'failed') {
            try {
                // Construct prompt
                // Append text content for context, though Wan2.6 is mostly visual unless we use specific audio modes.
                // The prompt should be primarily the visual prompt.
                // Append narrative text for context (in Spanish as requested)
                const fullPrompt = `Visual: ${segment.visual_prompt} \n\nContext/Narration: ${segment.text}`;

                const taskId = await WanService.generateVideo(
                    fullPrompt,
                    null, // No audio URL for now, let it generate silenced or we handle audio separately
                    {
                        duration: 15,
                        resolution: '720*1280'
                    }
                );

                const { data: updated } = await (supabase as any)
                    .from('segments')
                    .update({
                        video_asset_id: taskId,
                        video_status: 'generating',
                        video_url: null
                    })
                    .eq('id', segmentId)
                    .select()
                    .single();

                return updated;
            } catch (err) {
                console.error("Video submission failed", err);
                await (supabase as any)
                    .from('segments')
                    .update({ video_status: 'failed' })
                    .eq('id', segmentId);
                throw err;
            }
        }

        return segment;
    }
}
