import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { QwenService } from '../services/qwenService';
import { SupabaseService } from '../services/supabaseService';
import type { Story } from '../types/story';
import type { StoryWithSegments } from '../types/database';
import {
    VisualStyleKey,
    VisualStyleLabel,
    ScriptStyleKey,
    ScriptStyleLabel
} from '../types/styles';

interface UseStoryGeneratorReturn {
    isGenerating: boolean;
    error: string | null;
    currentStory: StoryWithSegments | null;
    generateStory: (
        baseIdea: string,
        segmentCount?: number,
        visualStyle?: VisualStyleKey | VisualStyleLabel,
        scriptStyle?: ScriptStyleKey | ScriptStyleLabel
    ) => Promise<StoryWithSegments | null>;
    setCurrentStory: (story: StoryWithSegments | null) => void;
    clearError: () => void;
}

export function useStoryGenerator(): UseStoryGeneratorReturn {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStory, setCurrentStory] = useState<StoryWithSegments | null>(null);

    const generateStory = useCallback(async (
        baseIdea: string,
        segmentCount: number = 3,
        visualStyle: VisualStyleKey | VisualStyleLabel = VisualStyleKey.CinematicRealistic,
        scriptStyle: ScriptStyleKey | ScriptStyleLabel = ScriptStyleKey.DramaticTelenovela
    ): Promise<StoryWithSegments | null> => {
        if (!baseIdea.trim()) {
            setError('Please enter a base idea');
            return null;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Generate story using Qwen
            const story: Story = await QwenService.generateStory(baseIdea, segmentCount, visualStyle, scriptStyle);
            console.log('Story generated:', story);

            // Save to Supabase (returns story with segments)
            const savedStory = await SupabaseService.saveStory(
                story,
                baseIdea,
                visualStyle,
                scriptStyle,
                user?.id
            );
            console.log('Story saved:', savedStory);

            setCurrentStory(savedStory);
            return savedStory;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate story';
            setError(errorMessage);
            console.error('Story generation error:', err);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, [user]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isGenerating,
        error,
        currentStory,
        generateStory,
        setCurrentStory,
        clearError,
    };
}
