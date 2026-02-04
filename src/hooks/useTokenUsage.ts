// hooks/useTokenUsage.ts
// Hook for fetching and displaying token usage at various levels

import { useState, useCallback, useEffect } from 'react';
import { TokenUsageService } from '../services/tokenUsageService';
import type { TokenUsageSummary } from '../services/tokenUsageService';

export interface UseTokenUsageOptions {
    autoFetch?: boolean;
    refreshInterval?: number; // in milliseconds
}

export interface UseTokenUsageReturn {
    usage: TokenUsageSummary | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook for fetching token usage by segment
 */
export function useSegmentTokenUsage(
    segmentId: string | undefined,
    options: UseTokenUsageOptions = {}
): UseTokenUsageReturn {
    const { autoFetch = true } = options;
    const [usage, setUsage] = useState<TokenUsageSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!segmentId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await TokenUsageService.getUsageBySegment(segmentId);
            setUsage(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch usage');
        } finally {
            setIsLoading(false);
        }
    }, [segmentId]);

    useEffect(() => {
        if (autoFetch && segmentId) {
            refresh();
        }
    }, [autoFetch, segmentId, refresh]);

    return { usage, isLoading, error, refresh };
}

/**
 * Hook for fetching token usage by episode
 */
export function useEpisodeTokenUsage(
    episodeId: string | undefined,
    options: UseTokenUsageOptions = {}
): UseTokenUsageReturn {
    const { autoFetch = true } = options;
    const [usage, setUsage] = useState<TokenUsageSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!episodeId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await TokenUsageService.getUsageByEpisode(episodeId);
            setUsage(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch usage');
        } finally {
            setIsLoading(false);
        }
    }, [episodeId]);

    useEffect(() => {
        if (autoFetch && episodeId) {
            refresh();
        }
    }, [autoFetch, episodeId, refresh]);

    return { usage, isLoading, error, refresh };
}

/**
 * Hook for fetching token usage by season
 */
export function useSeasonTokenUsage(
    seriesId: string | undefined,
    seasonNumber: number,
    options: UseTokenUsageOptions = {}
): UseTokenUsageReturn {
    const { autoFetch = true } = options;
    const [usage, setUsage] = useState<TokenUsageSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!seriesId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await TokenUsageService.getUsageBySeason(seriesId, seasonNumber);
            setUsage(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch usage');
        } finally {
            setIsLoading(false);
        }
    }, [seriesId, seasonNumber]);

    useEffect(() => {
        if (autoFetch && seriesId) {
            refresh();
        }
    }, [autoFetch, seriesId, refresh]);

    return { usage, isLoading, error, refresh };
}

/**
 * Hook for fetching token usage by series
 */
export function useSeriesTokenUsage(
    seriesId: string | undefined,
    options: UseTokenUsageOptions = {}
): UseTokenUsageReturn {
    const { autoFetch = true } = options;
    const [usage, setUsage] = useState<TokenUsageSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!seriesId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await TokenUsageService.getUsageBySeries(seriesId);
            setUsage(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch usage');
        } finally {
            setIsLoading(false);
        }
    }, [seriesId]);

    useEffect(() => {
        if (autoFetch && seriesId) {
            refresh();
        }
    }, [autoFetch, seriesId, refresh]);

    return { usage, isLoading, error, refresh };
}

/**
 * Hook for fetching token usage by story
 */
export function useStoryTokenUsage(
    storyId: string | undefined,
    options: UseTokenUsageOptions = {}
): UseTokenUsageReturn {
    const { autoFetch = true } = options;
    const [usage, setUsage] = useState<TokenUsageSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!storyId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await TokenUsageService.getUsageByStory(storyId);
            setUsage(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch usage');
        } finally {
            setIsLoading(false);
        }
    }, [storyId]);

    useEffect(() => {
        if (autoFetch && storyId) {
            refresh();
        }
    }, [autoFetch, storyId, refresh]);

    return { usage, isLoading, error, refresh };
}
