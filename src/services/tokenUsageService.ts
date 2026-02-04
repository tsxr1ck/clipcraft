// services/tokenUsageService.ts
// Central service for recording and aggregating AI generation token usage

import { supabase } from '../lib/supabase';
import type { InsertTokenUsage, DbTokenUsage } from '../types/database';

// Token usage summary with aggregated metrics
export interface TokenUsageSummary {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    text_generations: number;
    image_generations: number;
    audio_generations: number;
    video_generations: number;
    total_generations: number;
    estimated_cost_usd: number | null;
    by_model: Record<string, { tokens: number; count: number }>;
    by_context: Record<string, { tokens: number; count: number }>;
}

// Parameters for recording text generation usage
export interface RecordTextUsageParams {
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    model: string;
    contextType: string;
    seriesId?: string;
    episodeId?: string;
    segmentId?: string;
    storyId?: string;
    characterId?: string;
    generationId?: string;
    metadata?: Record<string, any>;
}

// Parameters for recording media generation usage
export interface RecordMediaUsageParams {
    generationType: 'image' | 'audio' | 'video';
    model: string;
    contextType: string;
    seriesId?: string;
    episodeId?: string;
    segmentId?: string;
    storyId?: string;
    characterId?: string;
    generationId?: string;
    metadata?: Record<string, any>;
}

export class TokenUsageService {
    /**
     * Record token usage from a text generation (LLM call)
     */
    static async recordTextUsage(params: RecordTextUsageParams): Promise<DbTokenUsage | null> {
        try {
            const insertData: InsertTokenUsage = {
                generation_type: 'text',
                model_used: params.model,
                provider: 'qwen',
                prompt_tokens: params.usage.prompt_tokens,
                completion_tokens: params.usage.completion_tokens,
                total_tokens: params.usage.total_tokens,
                context_type: params.contextType,
                series_id: params.seriesId || null,
                episode_id: params.episodeId || null,
                segment_id: params.segmentId || null,
                story_id: params.storyId || null,
                character_id: params.characterId || null,
                generation_id: params.generationId || null,
                metadata: params.metadata || {},
            };

            const { data, error } = await (supabase
                .from('token_usage') as any)
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.warn('Failed to record token usage:', error);
                return null;
            }

            console.log(`📊 Recorded ${params.usage.total_tokens} tokens for ${params.contextType}`);
            return data;
        } catch (err) {
            console.error('Error recording token usage:', err);
            return null;
        }
    }

    /**
     * Record media generation usage (image, audio, video)
     * These don't have token counts but we track generation count
     */
    static async recordMediaUsage(params: RecordMediaUsageParams): Promise<DbTokenUsage | null> {
        try {
            const insertData: InsertTokenUsage = {
                generation_type: params.generationType,
                model_used: params.model,
                provider: 'qwen',
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
                context_type: params.contextType,
                series_id: params.seriesId || null,
                episode_id: params.episodeId || null,
                segment_id: params.segmentId || null,
                story_id: params.storyId || null,
                character_id: params.characterId || null,
                generation_id: params.generationId || null,
                metadata: params.metadata || {},
            };

            const { data, error } = await (supabase
                .from('token_usage') as any)
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.warn('Failed to record media usage:', error);
                return null;
            }

            console.log(`📊 Recorded ${params.generationType} generation for ${params.contextType}`);
            return data;
        } catch (err) {
            console.error('Error recording media usage:', err);
            return null;
        }
    }

    /**
     * Get aggregated token usage for a specific segment
     */
    static async getUsageBySegment(segmentId: string): Promise<TokenUsageSummary> {
        return this.aggregateUsage({ segment_id: segmentId });
    }

    /**
     * Get aggregated token usage for a specific episode
     */
    static async getUsageByEpisode(episodeId: string): Promise<TokenUsageSummary> {
        return this.aggregateUsage({ episode_id: episodeId });
    }

    /**
     * Get aggregated token usage for a specific season of a series
     */
    static async getUsageBySeason(seriesId: string, seasonNumber: number): Promise<TokenUsageSummary> {
        // Get all episodes for this season
        const { data: episodes } = await (supabase
            .from('episodes') as any)
            .select('id')
            .eq('series_id', seriesId)
            .eq('season_number', seasonNumber);

        if (!episodes || episodes.length === 0) {
            return this.emptyUsageSummary();
        }

        const episodeIds = episodes.map((e: any) => e.id);

        // Query usage for all episodes in this season
        const { data: usageData } = await (supabase
            .from('token_usage') as any)
            .select('*')
            .in('episode_id', episodeIds);

        // Also get direct series usage (like lore generation)
        const { data: seriesUsage } = await (supabase
            .from('token_usage') as any)
            .select('*')
            .eq('series_id', seriesId)
            .is('episode_id', null);

        const allUsage = [...(usageData || []), ...(seriesUsage || [])];
        return this.calculateSummary(allUsage);
    }

    /**
     * Get aggregated token usage for an entire series
     */
    static async getUsageBySeries(seriesId: string): Promise<TokenUsageSummary> {
        // Get all usage with this series_id OR linked to episodes/segments of this series
        const { data: episodeUsage } = await (supabase
            .from('token_usage') as any)
            .select('*, episodes!inner(series_id)')
            .eq('episodes.series_id', seriesId);

        const { data: directUsage } = await (supabase
            .from('token_usage') as any)
            .select('*')
            .eq('series_id', seriesId);

        // Combine and dedupe
        const usageMap = new Map<string, DbTokenUsage>();
        [...(episodeUsage || []), ...(directUsage || [])].forEach((u: DbTokenUsage) => {
            usageMap.set(u.id, u);
        });

        return this.calculateSummary(Array.from(usageMap.values()));
    }

    /**
     * Get usage for a specific story
     */
    static async getUsageByStory(storyId: string): Promise<TokenUsageSummary> {
        return this.aggregateUsage({ story_id: storyId });
    }

    /**
     * Get usage for a specific character
     */
    static async getUsageByCharacter(characterId: string): Promise<TokenUsageSummary> {
        return this.aggregateUsage({ character_id: characterId });
    }

    /**
     * Private helper to aggregate usage with a simple filter
     */
    private static async aggregateUsage(filter: Record<string, string>): Promise<TokenUsageSummary> {
        let query = supabase.from('token_usage').select('*') as any;

        for (const [key, value] of Object.entries(filter)) {
            query = query.eq(key, value);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching usage:', error);
            return this.emptyUsageSummary();
        }

        return this.calculateSummary(data || []);
    }

    /**
     * Calculate summary from array of usage records
     */
    private static calculateSummary(usage: DbTokenUsage[]): TokenUsageSummary {
        const summary: TokenUsageSummary = {
            total_tokens: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
            text_generations: 0,
            image_generations: 0,
            audio_generations: 0,
            video_generations: 0,
            total_generations: usage.length,
            estimated_cost_usd: null,
            by_model: {},
            by_context: {},
        };

        let totalCost = 0;
        let hasCost = false;

        for (const record of usage) {
            summary.total_tokens += record.total_tokens;
            summary.prompt_tokens += record.prompt_tokens;
            summary.completion_tokens += record.completion_tokens;

            // Count by type
            switch (record.generation_type) {
                case 'text':
                    summary.text_generations++;
                    break;
                case 'image':
                    summary.image_generations++;
                    break;
                case 'audio':
                    summary.audio_generations++;
                    break;
                case 'video':
                    summary.video_generations++;
                    break;
            }

            // Aggregate by model
            if (!summary.by_model[record.model_used]) {
                summary.by_model[record.model_used] = { tokens: 0, count: 0 };
            }
            summary.by_model[record.model_used].tokens += record.total_tokens;
            summary.by_model[record.model_used].count++;

            // Aggregate by context
            const context = record.context_type || 'unknown';
            if (!summary.by_context[context]) {
                summary.by_context[context] = { tokens: 0, count: 0 };
            }
            summary.by_context[context].tokens += record.total_tokens;
            summary.by_context[context].count++;

            // Sum costs if available
            if (record.estimated_cost_usd !== null) {
                totalCost += record.estimated_cost_usd;
                hasCost = true;
            }
        }

        if (hasCost) {
            summary.estimated_cost_usd = totalCost;
        }

        return summary;
    }

    /**
     * Empty summary for when no data exists
     */
    private static emptyUsageSummary(): TokenUsageSummary {
        return {
            total_tokens: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
            text_generations: 0,
            image_generations: 0,
            audio_generations: 0,
            video_generations: 0,
            total_generations: 0,
            estimated_cost_usd: null,
            by_model: {},
            by_context: {},
        };
    }
}
