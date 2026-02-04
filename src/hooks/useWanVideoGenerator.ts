import { useState, useCallback, useEffect, useRef } from 'react';
import { WanVideoService } from '../services/wanVideoService';
import type { DbSegment } from '../types/database';

interface UseWanVideoGeneratorReturn {
    generatingSegmentIds: Set<string>;
    generateSegmentVideo: (segment: DbSegment, onUpdate?: (segment: DbSegment) => void) => Promise<void>;
    generateAllVideos: (segments: DbSegment[], onUpdate?: (segment: DbSegment) => void) => Promise<void>;
}

export function useWanVideoGenerator(): UseWanVideoGeneratorReturn {
    // Track which segments are currently generating (submitted or polling)
    const [generatingSegmentIds, setGeneratingSegmentIds] = useState<Set<string>>(new Set());

    // Keep track of callbacks to invoke when a specific segment updates
    const callbacksRef = useRef<Record<string, (segment: DbSegment) => void>>({});

    // Poll active segments
    useEffect(() => {
        if (generatingSegmentIds.size === 0) return;

        const intervalId = setInterval(async () => {
            const activeIds = Array.from(generatingSegmentIds);

            for (const id of activeIds) {
                try {
                    // This service method checks status and updates DB if done
                    const updatedSegment = await WanVideoService.processSegment(id);

                    // Invoke callback if state changed or we just want to refresh
                    // processSegment returns the segment data (updated or not)
                    if (updatedSegment) {
                        const onUpdate = callbacksRef.current[id];
                        if (onUpdate) onUpdate(updatedSegment);

                        // If completed or failed, stop tracking
                        if (updatedSegment.video_status === 'completed' || updatedSegment.video_status === 'failed') {
                            setGeneratingSegmentIds(prev => {
                                const next = new Set(prev);
                                next.delete(id);
                                return next;
                            });
                            // Clean up callback
                            delete callbacksRef.current[id];
                        }
                    }
                } catch (e) {
                    console.error("Error polling segment video", id, e);
                    // Optionally remove from tracking if error is fatal? 
                    // For now keep trying until it fails properly or user reloads
                }
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(intervalId);
    }, [generatingSegmentIds]);

    const generateSegmentVideo = useCallback(async (
        segment: DbSegment,
        onUpdate?: (segment: DbSegment) => void
    ) => {
        if (generatingSegmentIds.has(segment.id)) return;

        try {
            // Register callback
            if (onUpdate) {
                callbacksRef.current[segment.id] = onUpdate;
            }

            // Start tracking
            setGeneratingSegmentIds(prev => new Set(prev).add(segment.id));

            // Initial call to submit task (if idle) or check status (if pending)
            const updated = await WanVideoService.processSegment(segment.id);

            if (onUpdate && updated) {
                onUpdate(updated);
            }
        } catch (e) {
            console.error("Failed to start video generation", e);
            setGeneratingSegmentIds(prev => {
                const next = new Set(prev);
                next.delete(segment.id);
                return next;
            });
        }
    }, [generatingSegmentIds]);

    const generateAllVideos = useCallback(async (
        segments: DbSegment[],
        onUpdate?: (segment: DbSegment) => void
    ) => {
        // Trigger generation for all eligible segments
        // We'll process them sequentially to avoid overwhelming the browser/network in the initial loop,
        // but the actual generation happens async on the backend.

        // Filter for segments that are not already completed or generating
        const eligibleSegments = segments.filter(
            s => s.video_status !== 'completed' && s.video_status !== 'generating' && !generatingSegmentIds.has(s.id)
        );

        for (const segment of eligibleSegments) {
            await generateSegmentVideo(segment, onUpdate);
            // Small delay between submissions
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }, [generateSegmentVideo, generatingSegmentIds]);

    return {
        generatingSegmentIds,
        generateSegmentVideo,
        generateAllVideos
    };
}
