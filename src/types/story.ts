export interface StorySegment {
    duration_seconds: number;
    text: string;
    visual_prompt: string;
    image_url?: string;
}

export interface Story {
    story_title: string;
    segments: StorySegment[];
}

// API Response Types
export interface QwenChatResponse {
    choices: {
        message: {
            content: string;
            role: string;
        };
        finish_reason: string;
        index: number;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface QwenImageResponse {
    output: {
        task_status: string;
        task_id: string;
    };
    request_id: string;
}

export interface QwenImageResult {
    output: {
        task_status: string;
        results: {
            url: string;
        }[];
    };
    request_id: string;
}

// Audio API Response Types
export interface QwenAudioResponse {
    output: {
        task_status: string;
        task_id: string;
    };
    request_id: string;
}

export interface QwenAudioResult {
    output: {
        task_status: string;
        audio?: {
            url: string;
        };
    };
    request_id: string;
}
