import type { QwenImageResponse, QwenImageResult } from '../types/story';
import {
    VisualStyleKey,
    VisualStyleLabel,
    getVisualStyleMetadata,
    visualStyleLabelToKey,
    isVisualStyleKey
} from '../types/styles';
import { TokenUsageService } from './tokenUsageService';

// Optional tracking context for recording usage
export interface ImageGenerationContext {
    segmentId?: string;
    episodeId?: string;
    seriesId?: string;
    storyId?: string;
    characterId?: string;
    contextType?: string;
}

const IMAGE_API_URL = '/api/qwen/services/aigc/text2image/image-synthesis';
const TASK_API_URL = '/api/qwen/tasks';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60; // Increased for slower generation

export class ImageService {
    /**
     * Generate an image from a visual prompt using qwen-image-plus
     * Returns the image URL from DashScope (temporary URL)
     */
    static async generateImage(
        visualPrompt: string,
        style: VisualStyleKey | VisualStyleLabel | string,
        context?: ImageGenerationContext
    ): Promise<string> {
        let lastError: Error | null = null;

        // Resolve metadata to get the descriptive prompt
        let description = '';
        try {
            const key = isVisualStyleKey(style) ? style : visualStyleLabelToKey(style as VisualStyleLabel);
            const metadata = getVisualStyleMetadata(key);
            description = metadata.description;
        } catch (e) {
            console.warn('Could not find metadata for style:', style, e);
            description = typeof style === 'string' ? style : '';
        }

        // Append style description to prompt for better adherence
        const styledPrompt = `${visualPrompt}. Style: ${description}. High quality, detailed cinematic render.`;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                // Submit image generation task
                const taskResponse = await fetch(IMAGE_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-DashScope-Async': 'enable',
                    },
                    body: JSON.stringify({
                        model: 'qwen-image-plus',
                        input: {
                            prompt: styledPrompt,
                        },
                        parameters: {
                            style: '<auto>', // Keeping auto here, relying on prompt engineering
                            size: '928*1664', // 16:9 aspect ratio for video
                            n: 1,
                        },
                    }),
                });

                if (!taskResponse.ok) {
                    const errorText = await taskResponse.text();
                    throw new Error(`Image API error: ${taskResponse.status} - ${errorText}`);
                }

                const taskData: QwenImageResponse = await taskResponse.json();
                const taskId = taskData.output?.task_id;

                if (!taskId) {
                    throw new Error('No task ID received from image API');
                }

                console.log(`Image task submitted: ${taskId}`);

                // Poll for task completion
                const imageUrl = await this.pollForResult(taskId);

                // Record image generation usage
                await TokenUsageService.recordMediaUsage({
                    generationType: 'image',
                    model: 'qwen-image-plus',
                    contextType: context?.contextType || 'image_generation',
                    segmentId: context?.segmentId,
                    episodeId: context?.episodeId,
                    seriesId: context?.seriesId,
                    storyId: context?.storyId,
                    characterId: context?.characterId,
                    metadata: {
                        prompt_length: styledPrompt.length,
                        style: typeof style === 'string' ? style : undefined
                    }
                });

                return imageUrl;
            } catch (error) {
                lastError = error as Error;
                console.warn(`Image generation attempt ${attempt + 1} failed:`, error);

                if (attempt < MAX_RETRIES - 1) {
                    await this.delay(RETRY_DELAY_MS * Math.pow(2, attempt));
                }
            }
        }

        throw lastError || new Error('Image generation failed after retries');
    }

    /**
     * Poll for image generation result
     */
    private static async pollForResult(taskId: string): Promise<string> {
        for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
            await this.delay(POLL_INTERVAL_MS);

            const response = await fetch(`${TASK_API_URL}/${taskId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Task status API error: ${response.status}`);
            }

            const result: QwenImageResult = await response.json();
            console.log(`Task ${taskId} status: ${result.output.task_status}`);

            if (result.output.task_status === 'SUCCEEDED') {
                const imageUrl = result.output.results?.[0]?.url;
                if (!imageUrl) {
                    throw new Error('No image URL in successful response');
                }
                return imageUrl;
            }

            if (result.output.task_status === 'FAILED') {
                throw new Error('Image generation task failed');
            }
        }

        throw new Error('Image generation timed out');
    }

    /**
     * Delay helper
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch image as ArrayBuffer (works better for re-uploading)
     * Uses a CORS proxy approach via the backend
     */
    static async fetchImageAsBuffer(url: string): Promise<ArrayBuffer> {
        // Try direct fetch first
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.arrayBuffer();
            }
        } catch (e) {
            console.warn('Direct fetch failed, URL may have CORS restrictions:', e);
        }

        // If direct fails, the URL might have expired or have CORS issues
        throw new Error('Failed to fetch image - URL may have expired or CORS blocked');
    }

    /**
     * Convert base64 string to ArrayBuffer
     */
    static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
