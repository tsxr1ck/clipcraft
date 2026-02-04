import { useState, useCallback } from 'react';
import { ImageService } from '../services/imageService';
import { SupabaseService } from '../services/supabaseService';
import type { DbSegment, StoryWithSegments } from '../types/database';

interface ImageGenerationProgress {
    total: number;
    completed: number;
    currentIndex: number;
}

interface SegmentError {
    index: number;
    message: string;
}

interface UseImageGeneratorReturn {
    isGenerating: boolean;
    progress: ImageGenerationProgress | null;
    errors: SegmentError[];
    generateAllImages: (story: StoryWithSegments, onSegmentUpdate?: (segment: DbSegment) => void) => Promise<void>;
    regenerateImage: (segment: DbSegment, onUpdate?: (segment: DbSegment) => void) => Promise<string | null>;
    clearErrors: () => void;
}

export function useImageGenerator(): UseImageGeneratorReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState<ImageGenerationProgress | null>(null);
    const [errors, setErrors] = useState<SegmentError[]>([]);

    const generateAllImages = useCallback(async (
        story: StoryWithSegments,
        onSegmentUpdate?: (segment: DbSegment) => void
    ): Promise<void> => {
        setIsGenerating(true);
        setErrors([]);
        setProgress({ total: story.segments.length, completed: 0, currentIndex: 0 });

        const newErrors: SegmentError[] = [];

        for (let i = 0; i < story.segments.length; i++) {
            const segment = story.segments[i];

            // Skip if already has an image
            if (segment.image_url) {
                setProgress(prev => prev ? { ...prev, completed: prev.completed + 1, currentIndex: i + 1 } : null);
                continue;
            }

            setProgress(prev => prev ? { ...prev, currentIndex: i } : null);

            try {
                console.log(`Generating image for segment ${i}: ${segment.visual_prompt.substring(0, 50)}...`);

                // Generate image - returns temporary URL from DashScope
                const tempImageUrl = await ImageService.generateImage(segment.visual_prompt);
                console.log(`Image generated: ${tempImageUrl}`);

                // Try to download and re-upload to Supabase
                let finalUrl = tempImageUrl;
                try {
                    const imageBuffer = await ImageService.fetchImageAsBuffer(tempImageUrl);
                    console.log(`Downloaded image buffer: ${imageBuffer.byteLength} bytes`);

                    finalUrl = await SupabaseService.uploadImage(imageBuffer, story.id, i);
                    console.log(`Uploaded to Supabase: ${finalUrl}`);
                } catch (uploadError) {
                    console.warn('Could not re-upload to Supabase, using temporary URL:', uploadError);
                    // Fall back to the temporary URL if re-upload fails
                }

                // Update database with image URL
                const updatedSegment = await SupabaseService.updateSegmentImageUrl(segment.id, finalUrl);
                console.log(`Segment ${i} updated with image URL`);

                // Callback to update UI
                if (onSegmentUpdate) {
                    onSegmentUpdate(updatedSegment);
                }

                setProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Image generation failed';
                newErrors.push({ index: i, message: errorMessage });
                console.error(`Failed to generate image for segment ${i}:`, err);
            }
        }

        setErrors(newErrors);
        setIsGenerating(false);
        setProgress(null);
    }, []);

    const regenerateImage = useCallback(async (
        segment: DbSegment,
        onUpdate?: (segment: DbSegment) => void
    ): Promise<string | null> => {
        try {
            console.log(`Regenerating image for segment ${segment.segment_index}`);

            // Generate new image
            const tempImageUrl = await ImageService.generateImage(segment.visual_prompt);

            // Try to upload to Supabase
            let finalUrl = tempImageUrl;
            try {
                const imageBuffer = await ImageService.fetchImageAsBuffer(tempImageUrl);
                finalUrl = await SupabaseService.uploadImage(imageBuffer, segment.story_id, segment.segment_index);
            } catch (uploadError) {
                console.warn('Could not re-upload to Supabase:', uploadError);
            }

            // Update database
            const updatedSegment = await SupabaseService.updateSegmentImageUrl(segment.id, finalUrl);

            // Clear any existing error for this segment
            setErrors(prev => prev.filter(e => e.index !== segment.segment_index));

            if (onUpdate) {
                onUpdate(updatedSegment);
            }

            return finalUrl;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Image regeneration failed';
            setErrors(prev => [...prev.filter(e => e.index !== segment.segment_index), { index: segment.segment_index, message: errorMessage }]);
            console.error(`Failed to regenerate image for segment ${segment.segment_index}:`, err);
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
        generateAllImages,
        regenerateImage,
        clearErrors,
    };
}
