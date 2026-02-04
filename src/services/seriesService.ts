// services/seriesService.ts
import { supabase } from '../lib/supabase';
import type {
    Series,
    Episode,
    SeriesWithEpisodes,
    EpisodeWithSegments,
    EpisodeSegment,
    SeriesAnalytics
} from '../types/series';

export class SeriesService {
    // ============================================================================
    // SERIES CRUD
    // ============================================================================

    /**
     * Create a new series
     */
    static async createSeries(seriesData: Partial<Series>): Promise<Series> {
        const { data, error } = await supabase
            .from('series')
            .insert([seriesData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get all series for current user
     */
    static async getAllSeries(): Promise<Series[]> {
        const { data, error } = await supabase
            .from('series')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get a single series by ID
     */
    static async getSeries(seriesId: string): Promise<Series> {
        const { data, error } = await supabase
            .from('series')
            .select('*')
            .eq('id', seriesId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get series with all episodes
     */
    static async getSeriesWithEpisodes(seriesId: string): Promise<SeriesWithEpisodes> {
        const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('*')
            .eq('id', seriesId)
            .single();

        if (seriesError) throw seriesError;

        const { data: episodes, error: episodesError } = await supabase
            .from('episodes')
            .select('*')
            .eq('series_id', seriesId)
            .order('season_number', { ascending: true })
            .order('episode_number', { ascending: true });

        if (episodesError) throw episodesError;

        return {
            ...series,
            episodes: episodes || [],
            total_episodes: episodes?.length || 0,
            completed_episodes: episodes?.filter(e => e.status === 'published').length || 0
        };
    }

    /**
     * Update series
     */
    static async updateSeries(seriesId: string, updates: Partial<Series>): Promise<Series> {
        const { data, error } = await supabase
            .from('series')
            .update(updates)
            .eq('id', seriesId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete series (cascades to episodes and segments)
     */
    static async deleteSeries(seriesId: string): Promise<void> {
        const { error } = await supabase
            .from('series')
            .delete()
            .eq('id', seriesId);

        if (error) throw error;
    }

    // ============================================================================
    // EPISODE CRUD
    // ============================================================================

    /**
     * Create a new episode
     */
    static async createEpisode(episodeData: Partial<Episode>): Promise<Episode> {
        const { data, error } = await supabase
            .from('episodes')
            .insert([episodeData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Batch create episodes
     */
    static async createEpisodes(episodesData: Partial<Episode>[]): Promise<Episode[]> {
        const { data, error } = await supabase
            .from('episodes')
            .insert(episodesData)
            .select();

        if (error) throw error;
        return data || [];
    }

    /**
     * Get episodes for a series/season
     */
    static async getEpisodes(
        seriesId: string,
        seasonNumber?: number
    ): Promise<Episode[]> {
        let query = supabase
            .from('episodes')
            .select('*')
            .eq('series_id', seriesId);

        if (seasonNumber !== undefined) {
            query = query.eq('season_number', seasonNumber);
        }

        const { data, error } = await query
            .order('season_number', { ascending: true })
            .order('episode_number', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get single episode by ID
     */
    static async getEpisode(episodeId: string): Promise<Episode> {
        const { data, error } = await supabase
            .from('episodes')
            .select('*')
            .eq('id', episodeId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get episode with segments and series data
     */
    static async getEpisodeWithSegments(episodeId: string): Promise<EpisodeWithSegments> {
        const { data: episode, error: episodeError } = await supabase
            .from('episodes')
            .select('*, series(*)')
            .eq('id', episodeId)
            .single();

        if (episodeError) throw episodeError;

        const { data: segments, error: segmentsError } = await supabase
            .from('segments')
            .select('*')
            .eq('episode_id', episodeId)
            .order('segment_index', { ascending: true });

        if (segmentsError) throw segmentsError;

        return {
            ...episode,
            segments: segments || [],
            series: episode.series
        };
    }

    /**
     * Update episode
     */
    static async updateEpisode(episodeId: string, updates: Partial<Episode>): Promise<Episode> {
        const { data, error } = await supabase
            .from('episodes')
            .update(updates)
            .eq('id', episodeId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update episode video info
     */
    static async updateEpisodeVideo(
        episodeId: string,
        videoUrl: string | null,
        status: 'generating' | 'completed' | 'failed',
        jobId?: string
    ): Promise<void> {
        const updates: Partial<Episode> = {
            video_url: videoUrl,
            video_status: status,
            video_job_id: jobId
        };

        const { error } = await supabase
            .from('episodes')
            .update(updates)
            .eq('id', episodeId);

        if (error) throw error;
    }

    /**
     * Delete episode
     */
    static async deleteEpisode(episodeId: string): Promise<void> {
        const { error } = await supabase
            .from('episodes')
            .delete()
            .eq('id', episodeId);

        if (error) throw error;
    }

    // ============================================================================
    // SEGMENTS CRUD
    // ============================================================================

    /**
     * Create segments for an episode
     */
    static async createSegments(segmentsData: Partial<EpisodeSegment>[]): Promise<EpisodeSegment[]> {
        const { data, error } = await supabase
            .from('segments')
            .insert(segmentsData)
            .select();

        if (error) throw error;
        return data || [];
    }

    /**
     * Get segments for an episode
     */
    static async getSegments(episodeId: string): Promise<EpisodeSegment[]> {
        const { data, error } = await supabase
            .from('segments')
            .select('*')
            .eq('episode_id', episodeId)
            .order('segment_index', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Update segment
     */
    static async updateSegment(
        segmentId: string,
        updates: Partial<EpisodeSegment>
    ): Promise<EpisodeSegment> {
        const { data, error } = await supabase
            .from('segments')
            .update(updates)
            .eq('id', segmentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================================================
    // ANALYTICS & HELPERS
    // ============================================================================

    /**
     * Get analytics for a series
     */
    static async getSeriesAnalytics(seriesId: string): Promise<SeriesAnalytics> {
        const { data: episodes, error } = await supabase
            .from('episodes')
            .select('status, actual_duration')
            .eq('series_id', seriesId);

        if (error) throw error;

        const total = episodes?.length || 0;
        const completed = episodes?.filter(e => e.status === 'published').length || 0;
        const totalRuntime = episodes?.reduce((sum, e) => sum + (e.actual_duration || 0), 0) || 0;

        const statusCounts = episodes?.reduce((acc, e) => {
            acc[e.status] = (acc[e.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>) || {};

        return {
            series_id: seriesId,
            total_episodes: total,
            completed_episodes: completed,
            total_runtime: totalRuntime,
            completion_percentage: total > 0 ? (completed / total) * 100 : 0,
            episodes_by_status: statusCounts as any,
            average_episode_duration: total > 0 ? totalRuntime / total : 0
        };
    }

    /**
     * Get next episode number for a season
     */
    static async getNextEpisodeNumber(seriesId: string, seasonNumber: number): Promise<number> {
        const { data, error } = await supabase
            .from('episodes')
            .select('episode_number')
            .eq('series_id', seriesId)
            .eq('season_number', seasonNumber)
            .order('episode_number', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) return 1;
        return data[0].episode_number + 1;
    }

    /**
     * Check if episode exists
     */
    static async episodeExists(
        seriesId: string,
        seasonNumber: number,
        episodeNumber: number
    ): Promise<boolean> {
        const { data, error } = await supabase
            .from('episodes')
            .select('id')
            .eq('series_id', seriesId)
            .eq('season_number', seasonNumber)
            .eq('episode_number', episodeNumber)
            .single();

        return !!data && !error;
    }
}