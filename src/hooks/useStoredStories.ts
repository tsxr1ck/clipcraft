import { useState, useEffect, useCallback } from 'react';
import { SupabaseService } from '../services/supabaseService';
import type { StoryWithSegments } from '../types/database';

interface UseStoredStoriesReturn {
    stories: StoryWithSegments[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    deleteStory: (id: string) => Promise<boolean>;
    getStoryById: (id: string) => Promise<StoryWithSegments | null>;
}

export function useStoredStories(): UseStoredStoriesReturn {
    const [stories, setStories] = useState<StoryWithSegments[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStories = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await SupabaseService.getAllStories();
            setStories(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stories';
            setError(errorMessage);
            console.error('Error fetching stories:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteStory = useCallback(async (id: string): Promise<boolean> => {
        try {
            await SupabaseService.deleteStory(id);
            // Optimistically remove from local state
            setStories(prev => prev.filter(story => story.id !== id));
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete story';
            setError(errorMessage);
            console.error('Error deleting story:', err);
            return false;
        }
    }, []);

    const getStoryById = useCallback(async (id: string): Promise<StoryWithSegments | null> => {
        try {
            return await SupabaseService.getStoryById(id);
        } catch (err) {
            console.error('Error fetching story by ID:', err);
            return null;
        }
    }, []);

    // Fetch stories on mount
    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    return {
        stories,
        isLoading,
        error,
        refresh: fetchStories,
        deleteStory,
        getStoryById,
    };
}
