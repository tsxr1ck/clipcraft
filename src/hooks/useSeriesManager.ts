import { useState, useEffect, useCallback } from 'react';
import { SeriesService } from '../services/seriesService';
import { SeriesAIService } from '../services/seriesAiService';
import { CharacterService } from '../services/characterService';
import { useAuth } from '../contexts/AuthContext';
import type {
    Series,
    SeriesWithEpisodes,
    EpisodeWithSegments,
    CreateSeriesRequest,
    EpisodeStatus
} from '../types/series';

export type SeriesView = 'list' | 'create' | 'detail' | 'production';

export function useSeriesManager() {
    const { user } = useAuth();
    const [view, setView] = useState<SeriesView>('list');
    const [series, setSeries] = useState<Series[]>([]);
    const [activeSeries, setActiveSeries] = useState<SeriesWithEpisodes | null>(null);
    const [activeEpisode, setActiveEpisode] = useState<EpisodeWithSegments | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all series
    const fetchSeries = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await SeriesService.getAllSeries();
            setSeries(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch series');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSeries();
    }, [fetchSeries]);

    // Navigation
    const goToList = () => {
        setView('list');
        setActiveSeries(null);
        setActiveEpisode(null);
        fetchSeries();
    };

    const goToCreate = () => {
        setView('create');
        setError(null);
    };

    const goToDetail = async (seriesId: string) => {
        setIsLoading(true);
        try {
            const data = await SeriesService.getSeriesWithEpisodes(seriesId);
            setActiveSeries(data);
            setView('detail');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load series details');
        } finally {
            setIsLoading(false);
        }
    };

    const goToProduction = async (episodeId: string) => {
        setIsLoading(true);
        try {
            const data = await SeriesService.getEpisodeWithSegments(episodeId);
            setActiveEpisode(data);
            setView('production');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load episode');
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh active series (useful after character migration)
    const refreshActiveSeries = async () => {
        if (!activeSeries) return;
        try {
            const data = await SeriesService.getSeriesWithEpisodes(activeSeries.id);
            setActiveSeries(data);
        } catch (err) {
            console.error('Failed to refresh series:', err);
        }
    };

    // Actions
    const createSeries = async (request: CreateSeriesRequest) => {
        console.log('Generating serie')
        if (!user) return;
        setIsGenerating(true);
        setError(null);
        try {
            // 1. Generate Lore via AI (includes character details)
            const { seriesData } = await SeriesAIService.generateSeriesLore(request);

            // 2. Save series to DB
            const newSeries = await SeriesService.createSeries({
                user_id: user.id,
                title: seriesData.title,
                tagline: seriesData.tagline,
                base_concept: request.base_concept,
                full_lore: seriesData.full_lore,
                genre: seriesData.genre,
                themes: seriesData.themes,
                setting: seriesData.setting,
                planned_seasons: request.planned_seasons || 1,
                episodes_per_season: request.episodes_per_season || 6,
                visual_style: request.visual_style || 'cinematic',
                script_style: request.script_style || 'dramatic',
                target_duration_per_episode: request.target_duration_per_episode || 180,
                status: 'draft',
                main_characters: seriesData.main_characters, // Keep for backward compatibility
                current_season: 1,
                narrative_style: seriesData.narrative_style,
                is_public: false
            });

            // 3. Create characters in database
            try {
                await SeriesAIService.createCharactersForSeries(
                    newSeries.id,
                    seriesData.main_characters,
                    newSeries.visual_style || 'cinematic',
                    newSeries.setting || ''
                );
            } catch (charError) {
                console.error('Failed to create characters:', charError);
                // Don't fail series creation if character creation fails
            }

            // 4. Optionally generate series poster (fire and forget)
            CharacterService.generateSeriesPoster(newSeries.id)
                .catch(err => console.error('Series poster generation failed:', err));

            // 5. Navigate to detail
            await goToDetail(newSeries.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate series');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateSeasonEpisodes = async (seasonNumber: number) => {
        if (!activeSeries) return;
        setIsGenerating(true);
        setError(null);
        try {
            // Find the outline for this season
            const generated = await SeriesAIService.generateEpisodes({
                series_id: activeSeries.id,
                season_number: seasonNumber
            }, {
                title: activeSeries.title,
                full_lore: activeSeries.full_lore,
                main_characters: activeSeries.main_characters,
                season_outline: {
                    theme: `Season ${seasonNumber} Theme`, // Typically from lore but simplified
                    arc: `Season ${seasonNumber} Arc`,
                    episode_summaries: activeSeries.episodes_per_season // Mocked for now, should come from series lore if available
                }
            });

            // Save episodes to DB
            const episodesToCreate = generated.episodes.map(ep => ({
                series_id: activeSeries.id,
                season_number: seasonNumber,
                episode_number: ep.episode_number,
                title: ep.title,
                synopsis: ep.synopsis,
                story_beats: ep.story_beats,
                featured_characters: ep.featured_characters,
                target_duration: activeSeries.target_duration_per_episode,
                status: 'draft' as EpisodeStatus,
                is_finale: ep.episode_number === activeSeries.episodes_per_season,
                is_premiere: ep.episode_number === 1
            }));

            await SeriesService.createEpisodes(episodesToCreate);

            // Refresh detail view
            await goToDetail(activeSeries.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate episodes');
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteSeries = async (id: string) => {
        try {
            await SeriesService.deleteSeries(id);
            goToList();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete series');
        }
    };

    return {
        view,
        series,
        activeSeries,
        activeEpisode,
        isLoading,
        isGenerating,
        error,
        goToList,
        goToCreate,
        goToDetail,
        goToProduction,
        createSeries,
        generateSeasonEpisodes,
        deleteSeries,
        refreshSeries: fetchSeries,
        refreshActiveSeries // New: for refreshing after character migration
    };
}