import { useState, useCallback } from 'react';
import { AudioService } from '../services/audioService';
import { SupabaseService } from '../services/supabaseService';
import type { DbSegment, StoryWithSegments } from '../types/database';

interface AudioGenerationProgress {
    total: number;
    completed: number;
    currentIndex: number;
}

interface SegmentError {
    index: number;
    message: string;
}

interface UseAudioGeneratorReturn {
    isGenerating: boolean;
    progress: AudioGenerationProgress | null;
    errors: SegmentError[];
    generateAllAudios: (story: StoryWithSegments, onSegmentUpdate?: (segment: DbSegment) => void) => Promise<void>;
    regenerateAudio: (segment: DbSegment, onUpdate?: (segment: DbSegment) => void) => Promise<string | null>;
    clearErrors: () => void;
}

export function useAudioGenerator(): UseAudioGeneratorReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState<AudioGenerationProgress | null>(null);
    const [errors, setErrors] = useState<SegmentError[]>([]);

    const generateAllAudios = useCallback(async (
        story: StoryWithSegments,
        onSegmentUpdate?: (segment: DbSegment) => void
    ): Promise<void> => {
        setIsGenerating(true);
        setErrors([]);
        setProgress({ total: story.segments.length, completed: 0, currentIndex: 0 });

        const newErrors: SegmentError[] = [];

        for (let i = 0; i < story.segments.length; i++) {
            const segment = story.segments[i];

            // Skip if already has audio
            if (segment.audio_url) {
                setProgress(prev => prev ? { ...prev, completed: prev.completed + 1, currentIndex: i + 1 } : null);
                continue;
            }

            setProgress(prev => prev ? { ...prev, currentIndex: i } : null);

            try {
                console.log(`Generating audio for segment ${i}: ${segment.text.substring(0, 50)}...`);

                // Generate audio - returns temporary URL from DashScope
                const tempAudioUrl = await AudioService.generateAudio(segment.text);
                console.log(`Audio generated: ${tempAudioUrl}`);

                // Try to download and re-upload to Supabase
                let finalUrl = tempAudioUrl;
                try {
                    const audioBuffer = await AudioService.fetchAudioAsBuffer(tempAudioUrl);
                    console.log(`Downloaded audio buffer: ${audioBuffer.byteLength} bytes`);

                    const audioBlob = AudioService.arrayBufferToBlob(audioBuffer);
                    finalUrl = await SupabaseService.uploadAudio(audioBlob, story.id, i);
                    console.log(`Uploaded to Supabase: ${finalUrl}`);
                } catch (uploadError) {
                    console.warn('Could not re-upload audio to Supabase, using temporary URL:', uploadError);
                }

                // Update database with audio URL
                const updatedSegment = await SupabaseService.updateSegmentAudioUrl(segment.id, finalUrl);
                console.log(`Segment ${i} updated with audio URL`);

                // Callback to update UI
                if (onSegmentUpdate) {
                    onSegmentUpdate(updatedSegment);
                }

                setProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Audio generation failed';
                newErrors.push({ index: i, message: errorMessage });
                console.error(`Failed to generate audio for segment ${i}:`, err);
            }
        }

        setErrors(newErrors);
        setIsGenerating(false);
        setProgress(null);
    }, []);

    const regenerateAudio = useCallback(async (
        segment: DbSegment,
        onUpdate?: (segment: DbSegment) => void
    ): Promise<string | null> => {
        try {
            console.log(`Regenerating audio for segment ${segment.segment_index}`);

            // Generate new audio
            const tempAudioUrl = await AudioService.generateAudio(segment.text);

            // Try to upload to Supabase
            let finalUrl = tempAudioUrl;
            try {
                const audioBuffer = await AudioService.fetchAudioAsBuffer(tempAudioUrl);
                const audioBlob = AudioService.arrayBufferToBlob(audioBuffer);
                finalUrl = await SupabaseService.uploadAudio(audioBlob, segment.story_id, segment.segment_index);
            } catch (uploadError) {
                console.warn('Could not re-upload audio to Supabase:', uploadError);
            }

            // Update database
            const updatedSegment = await SupabaseService.updateSegmentAudioUrl(segment.id, finalUrl);

            // Clear any existing error for this segment
            setErrors(prev => prev.filter(e => e.index !== segment.segment_index));

            if (onUpdate) {
                onUpdate(updatedSegment);
            }

            return finalUrl;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Audio regeneration failed';
            setErrors(prev => [...prev.filter(e => e.index !== segment.segment_index), { index: segment.segment_index, message: errorMessage }]);
            console.error(`Failed to regenerate audio for segment ${segment.segment_index}:`, err);
            return null;
        }
    }, []);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    return {
        isGenerating,
        progress,
        errors,
        generateAllAudios,
        regenerateAudio,
        clearErrors,
    };
}
