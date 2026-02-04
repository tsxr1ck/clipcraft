// CORRECT endpoint for Qwen TTS based on DashScope API structure
// Pattern: /services/aigc/audio-generation/generation
const AUDIO_API_URL = '/api/qwen/services/aigc/multimodal-generation/generation';

import { TokenUsageService } from './tokenUsageService';

// Optional tracking context for recording usage
export interface AudioGenerationContext {
    segmentId?: string;
    episodeId?: string;
    seriesId?: string;
    storyId?: string;
    contextType?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class AudioService {
    /**
     * Generate audio from text using qwen3-tts-flash-realtime
     * Uses Spanish voice
     */
    static async generateAudio(text: string, context?: AudioGenerationContext): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                console.log(`Generating audio (attempt ${attempt + 1})...`);

                const response = await fetch(AUDIO_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'qwen3-tts-flash',
                        input: {
                            text: text,
                        },
                        parameters: {
                            voice: 'Lucia', // Spanish female voice - alternatives: 'Pablo' (male)
                            format: 'mp3',
                            sample_rate: 24000,
                            volume: 50,
                            rate: 1.0,
                            pitch: 1.0,
                        },
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Audio API HTTP error:', response.status, errorText);
                    throw new Error(`Audio API error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();

                // Log the full response for debugging
                console.log('Audio API Response:', data);

                // Check for error in response
                if (data.code && data.code !== '200' && data.code !== 200) {
                    throw new Error(`API returned error code: ${data.code} - ${data.message || 'Unknown error'}`);
                }

                // Extract audio URL from response
                // Structure: output.audio.url
                const audioUrl = data.output?.audio?.url || data.output?.audio_url || data.output?.url;

                if (!audioUrl) {
                    console.error('Unexpected API response structure:', data);
                    throw new Error('No audio URL in API response');
                }

                console.log('Audio generated successfully:', audioUrl);

                // Record audio generation usage
                await TokenUsageService.recordMediaUsage({
                    generationType: 'audio',
                    model: 'qwen3-tts-flash',
                    contextType: context?.contextType || 'audio_generation',
                    segmentId: context?.segmentId,
                    episodeId: context?.episodeId,
                    seriesId: context?.seriesId,
                    storyId: context?.storyId,
                    metadata: {
                        text_length: text.length,
                        voice: 'Lucia'
                    }
                });

                return audioUrl;

            } catch (error) {
                lastError = error as Error;
                console.warn(`Audio generation attempt ${attempt + 1} failed:`, error);

                if (attempt < MAX_RETRIES - 1) {
                    await this.delay(RETRY_DELAY_MS * Math.pow(2, attempt));
                }
            }
        }

        throw lastError || new Error('Audio generation failed after retries');
    }

    /**
     * Delay helper
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch audio as ArrayBuffer for re-uploading to Supabase
     */
    static async fetchAudioAsBuffer(url: string): Promise<ArrayBuffer> {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.arrayBuffer();
            }
            throw new Error(`Failed to fetch audio: ${response.status}`);
        } catch (e) {
            console.error('Audio fetch failed:', e);
            throw new Error('Failed to fetch audio - URL may have expired or be invalid');
        }
    }

    /**
     * Convert ArrayBuffer to Blob for Supabase upload
     */
    static arrayBufferToBlob(buffer: ArrayBuffer, mimeType: string = 'audio/mpeg'): Blob {
        return new Blob([buffer], { type: mimeType });
    }
}