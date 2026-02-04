// types/series.ts
// ============================================================================
// TYPE DEFINITIONS FOR SERIES SYSTEM
// ============================================================================

import type { Character } from "./character";



export interface FeaturedCharacter {
    name: string;
    focus: 'protagonist' | 'supporting' | 'antagonist' | 'cameo';
    screenTime?: number; // percentage of episode
}

export type NarrativeStyle = 'anthology' | 'continuous' | 'episodic' | 'hybrid';
export type SeriesStatus = 'draft' | 'in_production' | 'completed' | 'cancelled';
export type EpisodeStatus = 'draft' | 'scripted' | 'segments_ready' | 'video_generating' | 'video_ready' | 'published';
export type SegmentType = 'intro' | 'main' | 'recap' | 'cliffhanger' | 'credits';

// ============================================================================
// SERIES
// ============================================================================
export interface Series {
    id: string;
    created_at: string;
    updated_at: string;

    // Basic Info
    title: string;
    tagline?: string;
    base_concept: string;

    // AI-Generated Lore
    full_lore: string;
    genre: string[];
    themes: string[];
    setting?: string;

    // Series Structure
    planned_seasons: number;
    current_season: number;
    episodes_per_season: number;

    // Storytelling
    narrative_style: NarrativeStyle;
    target_duration_per_episode: number;

    // Visual & Audio Style
    visual_style: string;
    script_style: string;

    // Characters (DEPRECATED - use characters table)
    main_characters: Character[];

    // Poster (NEW)
    series_poster_url?: string;
    series_poster_status: 'pending' | 'generating' | 'completed' | 'failed';
    series_poster_job_id?: string;
    series_poster_prompt?: string;
    series_visual_keywords?: string[];

    // Production Status
    status: SeriesStatus;

    // Metadata
    user_id: string;
    is_public: boolean;
    tags?: string[];
}

// ============================================================================
// EPISODE
// ============================================================================
export interface Episode {
    id: string;
    created_at: string;
    updated_at: string;

    // Series Reference
    series_id: string;

    // Episode Info
    season_number: number;
    episode_number: number;
    title: string;

    // Story Content
    synopsis: string;
    full_script?: string;
    story_beats: string[];

    // Characters
    featured_characters: FeaturedCharacter[];

    // Duration
    target_duration: number;
    actual_duration?: number;

    // Continuity
    previous_episode_recap?: string;
    continuity_summary?: string;
    cliffhanger?: string;
    next_episode_tease?: string;

    // Production
    status: EpisodeStatus;

    // Video Output
    video_url?: string;
    video_status?: 'generating' | 'completed' | 'failed';
    video_job_id?: string;
    thumbnail_url?: string;

    // Metadata
    is_finale: boolean;
    is_premiere: boolean;
}

// ============================================================================
// SERIES WITH EPISODES (for queries)
// ============================================================================
export interface SeriesWithEpisodes extends Series {
    episodes: Episode[];
    total_episodes?: number;
    completed_episodes?: number;
}

// ============================================================================
// EPISODE WITH SEGMENTS (for queries)
// ============================================================================
export interface EpisodeWithSegments extends Episode {
    segments: EpisodeSegment[];
    series?: Series; // Optional series data
}

// ============================================================================
// ENHANCED SEGMENT (extends your existing DbSegment)
// ============================================================================
export interface EpisodeSegment {
    id: string;
    created_at: string;

    // Episode Reference (new)
    episode_id?: string;

    // Story Reference (existing - for backward compatibility)
    story_id?: string;

    // Segment Info
    segment_index: number;
    segment_type: SegmentType;
    character_focus?: string;

    // Content
    text: string;
    visual_prompt: string;
    duration_seconds: number;

    // Generated Assets
    image_url?: string;
    audio_url?: string;
}

// ============================================================================
// SERIES ARC
// ============================================================================
export interface SeriesArc {
    id: string;
    created_at: string;

    series_id: string;

    arc_name: string;
    arc_description?: string;

    // Episode Range
    start_season: number;
    start_episode: number;
    end_season?: number;
    end_episode?: number;

    // Story Elements
    main_conflict?: string;
    resolution?: string;
    key_revelations?: string[];
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

// Request to create a new series
export interface CreateSeriesRequest {
    base_concept: string;
    planned_seasons?: number;
    episodes_per_season?: number;
    visual_style?: string;
    script_style?: string;
    target_duration_per_episode?: number;
}

// AI-generated series response
export interface GeneratedSeries {
    title: string;
    tagline: string;
    full_lore: string;
    genre: string[];
    themes: string[];
    setting: string;
    narrative_style: NarrativeStyle;
    main_characters: Character[];
    season_outlines: SeasonOutline[];
}

export interface SeasonOutline {
    season_number: number;
    theme: string;
    arc: string;
    episode_summaries: string[];
}

// Request to generate episodes for a season
export interface GenerateEpisodesRequest {
    series_id: string;
    season_number: number;
    num_episodes?: number; // Override episodes_per_season if needed
}

// AI-generated episodes response
export interface GeneratedEpisodes {
    episodes: {
        episode_number: number;
        title: string;
        synopsis: string;
        story_beats: string[];
        featured_characters: FeaturedCharacter[];
        cliffhanger?: string;
    }[];
}

// Request to break episode into segments
export interface GenerateSegmentsRequest {
    episode_id: string;
    target_duration?: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface SeriesFormData {
    base_concept: string;
    planned_seasons: number;
    episodes_per_season: number;
    visual_style: string;
    script_style: string;
    target_duration_per_episode: number;
}

export interface EpisodeProgress {
    episode_id: string;
    status: EpisodeStatus;
    segments_generated: number;
    total_segments: number;
    images_generated: number;
    audios_generated: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface SeriesAnalytics {
    series_id: string;
    total_episodes: number;
    completed_episodes: number;
    total_runtime: number; // seconds
    completion_percentage: number;
    episodes_by_status: {
        [key in EpisodeStatus]: number;
    };
    average_episode_duration: number;
}