import { useState, useCallback, useRef, useEffect } from 'react';
import { ClipCraftService } from '../services/clipCraftService';
import { SupabaseService } from '../services/supabaseService';
import type { DbSegment } from '../types/database';

interface UseVideoGeneratorReturn {
    isGenerating: boolean;
    progress: number;
    progressMessage: string | null;  // NEW: Added progress message
    status: 'idle' | 'generating' | 'completed' | 'failed';
    videoUrl: string | null;
    error: string | null;
    generateVideo: (storyId: string, segments: DbSegment[]) => Promise<void>;
    resumePolling: (storyId: string, jobId: string) => void;
    resetVideoState: () => void;
}

export function useVideoGenerator(): UseVideoGeneratorReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState<string | null>(null);  // NEW
    const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pollInterval = useRef<any>(null);

    const cleanup = useCallback(() => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    const resetVideoState = useCallback(() => {
        cleanup();
        setIsGenerating(false);
        setProgress(0);
        setProgressMessage(null);  // NEW
        setStatus('idle');
        setVideoUrl(null);
        setError(null);
    }, [cleanup]);

    // NEW: Calculate progress percentage from progress message
    const calculateProgress = useCallback((progressMsg: string | null | undefined): number => {
        if (!progressMsg) return 0;

        // Phase 1: Rendering segments (0-25%)
        if (progressMsg.includes('Phase 1/4')) {
            const segmentMatch = progressMsg.match(/segment (\d+)\/(\d+)/);
            if (segmentMatch) {
                const current = parseInt(segmentMatch[1]);
                const total = parseInt(segmentMatch[2]);
                return Math.floor((current / total) * 25);
            }
            if (progressMsg.includes('opening card')) return 5;
            return 10;
        }

        // Phase 2: Transcribing (25-50%)
        if (progressMsg.includes('Phase 2/4')) {
            const segmentMatch = progressMsg.match(/segment (\d+)\/(\d+)/);
            if (segmentMatch) {
                const current = parseInt(segmentMatch[1]);
                const total = parseInt(segmentMatch[2]);
                return 25 + Math.floor((current / total) * 25);
            }
            return 35;
        }

        // Phase 3: Concatenating (50-75%)
        if (progressMsg.includes('Phase 3/4')) {
            if (progressMsg.includes('re-encoding')) return 70;
            return 60;
        }

        // Phase 4: Subtitles (75-95%)
        if (progressMsg.includes('Phase 4/4')) return 85;

        // Done (100%)
        if (progressMsg.includes('Done')) return 100;

        return 0;
    }, []);

    const startPolling = useCallback(async (jobId: string, storyId: string) => {
        cleanup(); // Clear any existing interval

        setIsGenerating(true);
        setStatus('generating');

        pollInterval.current = setInterval(async () => {
            try {
                const jobStatus = await ClipCraftService.getJobStatus(jobId);
                console.log('Video Poll:', jobStatus);

                // NEW: Set progress message and calculate percentage
                const message = jobStatus.progress?.toString() || null;
                setProgressMessage(message);

                // If API returns numeric progress, use it; otherwise calculate from message
                if (typeof jobStatus.progress === 'number') {
                    setProgress(jobStatus.progress);
                } else if (typeof jobStatus.progress === 'string') {
                    const calculatedProgress = calculateProgress(jobStatus.progress);
                    setProgress(calculatedProgress);
                }

                if (jobStatus.status === 'failed') {
                    cleanup();
                    setStatus('failed');
                    setError(jobStatus.error || 'Video generation failed');
                    await SupabaseService.updateStoryVideo(storyId, null, 'failed', jobId);
                } else if (jobStatus.status === 'completed' && jobStatus.output_url) {
                    cleanup();

                    try {
                        // Download and Upload
                        console.log('Downloading video...', jobStatus.output_url);
                        const videoBlob = await ClipCraftService.downloadVideo(jobStatus.output_url);

                        console.log('Video downloaded, uploading to Supabase...');
                        const publicUrl = await SupabaseService.uploadVideo(videoBlob, storyId);
                        console.log('Video uploaded to Supabase:', publicUrl);

                        // Update DB
                        await SupabaseService.updateStoryVideo(storyId, publicUrl, 'completed', jobId);

                        setVideoUrl(publicUrl);
                        setProgress(100);
                        setProgressMessage('Done!');
                        setStatus('completed');
                        setIsGenerating(false);
                    } catch (uploadError) {
                        console.error('Failed to download/upload video:', uploadError);
                        setError(`Failed to save video: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
                        setStatus('failed');
                        setIsGenerating(false);
                        // Likely keep the job marked as completed remotely, but failed locally or update DB to failed?
                        // Let's update DB to failed for now so user can retry
                        await SupabaseService.updateStoryVideo(storyId, null, 'failed', jobId);
                    }
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 3000);
    }, [cleanup, calculateProgress]);

    const resumePolling = useCallback((storyId: string, jobId: string) => {
        if (!jobId || !storyId) return;
        // Resume polling immediately
        startPolling(jobId, storyId);
    }, [startPolling]);

    const generateVideo = useCallback(async (storyId: string, segments: DbSegment[]) => {
        if (!storyId || segments.length === 0) return;

        setIsGenerating(true);
        setStatus('generating');
        setProgress(0);
        setProgressMessage('Initializing...');  // NEW
        setError(null);
        setVideoUrl(null);

        try {
            // Start Job
            const jobId = await ClipCraftService.generateVideo(segments);
            console.log(`Video job started: ${jobId}`);

            // Update DB status
            await SupabaseService.updateStoryVideo(storyId, null, 'generating', jobId);

            // Start Polling
            startPolling(jobId, storyId);

        } catch (err) {
            cleanup();
            setIsGenerating(false);
            setStatus('failed');
            const msg = err instanceof Error ? err.message : 'Unknown error starting video generation';
            setError(msg);
            await SupabaseService.updateStoryVideo(storyId, null, 'failed', null).catch(console.error);
        }
    }, [cleanup, startPolling]);

    return {
        isGenerating,
        progress,
        progressMessage,  // NEW: Export progress message
        status,
        videoUrl,
        error,
        generateVideo,
        resumePolling,
        resetVideoState
    };
}