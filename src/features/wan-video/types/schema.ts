export interface WanGeneration {
    id: string;
    episode_id: string;
    status: 'pending' | 'audio_processing' | 'video_processing' | 'assembling' | 'completed' | 'failed';
    progress: number;
    final_video_url: string | null;
    subtitle_url: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface WanSegment {
    id: string;
    wan_generation_id: string;
    original_segment_id: string | null;
    segment_index: number;
    text_content: string;
    visual_prompt: string;
    audio_url: string | null;
    video_url: string | null;
    status: 'pending' | 'audio_ready' | 'generating_video' | 'video_ready' | 'failed';
    dashscope_task_id: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

// Database helper types
export type Tables = {
    wan_generations: WanGeneration;
    wan_segments: WanSegment;
}
