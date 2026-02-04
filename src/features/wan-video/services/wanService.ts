import { SupabaseService } from '../../../services/supabaseService';

// Constants
// Use the proxy path defined in vite.config.ts
const DASHSCOPE_API_URL = '/api/wan/services/aigc/video-generation/video-synthesis';
// Using the model requested by user
// const MODEL_NAME = 'wan2.6-t2v';
const MODEL_NAME = 'wan2.5-t2v-preview';

export interface WanVideoOptions {
    resolution?: '1280*720' | '1920*1080' | '720*1280' | '1080*1920';
    duration?: 5 | 10 | 15; // Wan2.x supports these options.
    ratio?: '16:9' | '9:16';
}

export interface WanTaskResponse {
    output: {
        task_id: string;
        task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';
        video_url?: string; // Succeeded result
        code?: string;      // Error code
        message?: string;   // Error message
    };
    request_id: string;
}

export class WanService {

    /**
     * Submit a video generation task
     */
    static async generateVideo(
        prompt: string,
        audioUrl: string | null,
        options: WanVideoOptions = {}
    ): Promise<string> {
        // We rely on Vite Proxy to inject Authorization
        // Note: This requires VITE_DASHSCOPE_API_KEY to be set in .env

        const payload = {
            model: MODEL_NAME,
            input: {
                prompt: prompt,
                // Only include audio_url if provided. 
                ...(audioUrl ? { audio_url: audioUrl } : {})
            },
            parameters: {
                duration: options.duration || 5,
                size: options.resolution || '720*1280',
                prompt_extend: true,
                audio: true,
            }
        };

        const response = await fetch(DASHSCOPE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': handled by vite proxy
                // 'X-DashScope-Async': handled by vite proxy
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Wan2.6 API Error: ${response.status} ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        if (data.output?.task_id) {
            return data.output.task_id;
        } else {
            throw new Error(`Wan2.6 API Unexpected Response: ${JSON.stringify(data)}`);
        }
    }

    /**
     * Poll for generic task result
     */
    static async getTaskStatus(taskId: string): Promise<{ status: string; video_url?: string; error?: string }> {
        // Task status endpoint via proxy
        const url = `/api/wan/tasks/${taskId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // Authorization handled by proxy
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to check task status: ${response.statusText}`);
        }

        const data = await response.json();

        const status = data.output.task_status; // PENDING, RUNNING, SUCCEEDED, FAILED

        if (status === 'SUCCEEDED') {
            return {
                status: 'completed',
                video_url: data.output.video_url
            };
        } else if (status === 'FAILED') {
            return {
                status: 'failed',
                error: data.output.message || 'Unknown error'
            };
        } else {
            return { status: 'pending' }; // Covers PENDING, RUNNING
        }
    }
}
