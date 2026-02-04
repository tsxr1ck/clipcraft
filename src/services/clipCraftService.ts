import type { DbSegment } from '../types/database';

const API_BASE_URL = "https://apiclipcraft.sonorodigital.com.mx";

interface VideoOptions {
    storyBeats?: string | null;
    addOpeningCard?: boolean;
    openingText?: string;
    showProgress?: boolean;
    enableKaraoke?: boolean;
    subtitleStyle?: string;
    language?: string;
}

interface JobStatus {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number | string;  // Can be numeric percentage or text message from API
    output_url?: string;
    error?: string;
}

export class ClipCraftService {
    /**
     * Start a video generation job
     */
    static async generateVideo(segments: DbSegment[], options: VideoOptions = {}): Promise<string> {
        // Transform DbSegments to the format expected by ClipCraft if needed
        // Assuming DbSegment structure is compatible or we map it here
        // The API likely expects an array of objects with text/image/audio fields.
        // Let's assume we pass the segments as-is for now, but ensure images are full URLs.

        const payload = {
            segments: segments.map(s => ({
                id: s.id,
                story_id: s.story_id,
                segment_index: s.segment_index,
                text: s.text,
                image_url: s.image_url,
                audio_url: s.audio_url,
                duration_seconds: s.duration_seconds,
                visual_prompt: s.visual_prompt,
            })),
            story_beats: options.storyBeats ?? null,
            add_opening_card: options.addOpeningCard ?? true,
            opening_text: options.openingText ?? "😱 WAIT FOR IT...",
            show_progress: options.showProgress ?? true,
            enable_karaoke_subs: options.enableKaraoke ?? true,
            subtitle_style: options.subtitleStyle ?? "bold",
            language: options.language ?? "es",
        };

        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to start video generation: ${errorText}`);
        }

        const data = await response.json();
        return data.job_id;
    }

    /**
     * Check the status of a job
     */
    static async getJobStatus(jobId: string): Promise<JobStatus> {
        const response = await fetch(`${API_BASE_URL}/status/${jobId}`);

        if (!response.ok) {
            throw new Error(`Failed to check job status: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Download the video file from the given URL
     */
    static async downloadVideo(url: string): Promise<Blob> {
        // The URL returned by the API might be relative or absolute.
        // If relative, prepend API_BASE_URL.
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        return await response.blob();
    }
}