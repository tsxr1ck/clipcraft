// =============================================
// Database Types - Normalized Schema
// =============================================

export interface Database {
    public: {
        Tables: {
            stories: {
                Row: {
                    id: string;
                    profile_id: string | null;
                    base_idea: string;
                    story_title: string;
                    visual_style: string | null;
                    script_tone: string | null;
                    video_url: string | null;
                    video_status: string;
                    video_job_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    profile_id?: string | null;
                    base_idea: string;
                    story_title: string;
                    visual_style?: string | null;
                    script_tone?: string | null;
                    video_url?: string | null;
                    video_status?: string;
                    video_job_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    profile_id?: string | null;
                    base_idea?: string;
                    story_title?: string;
                    visual_style?: string | null;
                    script_tone?: string | null;
                    video_url?: string | null;
                    video_status?: string;
                    video_job_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "stories_profile_id_fkey";
                        columns: ["profile_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
            };
            segments: {
                Row: {
                    id: string;
                    story_id: string;
                    segment_index: number;
                    duration_seconds: number;
                    text: string;
                    visual_prompt: string;
                    image_url: string | null;
                    audio_url: string | null;
                    video_url: string | null;      // Added
                    video_status: string;          // Added (default 'idle')
                    video_asset_id: string | null; // Added
                    created_at: string;
                    updated_at: string;
                    episode_id: string | null;
                    segment_type: string | null;
                    character_focus: string | null;
                };
                Insert: {
                    id?: string;
                    story_id: string;
                    segment_index: number;
                    duration_seconds?: number;
                    text: string;
                    visual_prompt: string;
                    image_url?: string | null;
                    audio_url?: string | null;
                    video_url?: string | null;      // Added
                    video_status?: string;          // Added
                    video_asset_id?: string | null; // Added
                    created_at?: string;
                    updated_at?: string;
                    episode_id?: string | null;
                    segment_type?: string | null;
                    character_focus?: string | null;
                };
                Update: {
                    id?: string;
                    story_id?: string;
                    segment_index?: number;
                    duration_seconds?: number;
                    text?: string;
                    visual_prompt?: string;
                    image_url?: string | null;
                    audio_url?: string | null;
                    video_url?: string | null;      // Added
                    video_status?: string;          // Added
                    video_asset_id?: string | null; // Added
                    created_at?: string;
                    updated_at?: string;
                    episode_id?: string | null;
                    segment_type?: string | null;
                    character_focus?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "segments_story_id_fkey";
                        columns: ["story_id"];
                        isOneToOne: false;
                        referencedRelation: "stories";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "segments_episode_id_fkey";
                        columns: ["episode_id"];
                        isOneToOne: false;
                        referencedRelation: "episodes";
                        referencedColumns: ["id"];
                    }
                ];
            };
            generations: {
                Row: {
                    id: string;
                    story_id: string | null;
                    type: string;
                    status: string;
                    start_time: string;
                    end_time: string | null;
                    duration_ms: number | null;
                    provider: string | null;
                    metadata: any | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    story_id?: string | null;
                    type: string;
                    status?: string;
                    start_time?: string;
                    end_time?: string | null;
                    duration_ms?: number | null;
                    provider?: string | null;
                    metadata?: any | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    story_id?: string | null;
                    type?: string;
                    status?: string;
                    start_time?: string;
                    end_time?: string | null;
                    duration_ms?: number | null;
                    provider?: string | null;
                    metadata?: any | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "generations_story_id_fkey";
                        columns: ["story_id"];
                        isOneToOne: false;
                        referencedRelation: "stories";
                        referencedColumns: ["id"];
                    }
                ];
            };
            profiles: {
                Row: {
                    id: string;
                    email: string | null;
                    full_name: string | null;
                    avatar_url: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    id: string;
                    email?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    id?: string;
                    email?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey";
                        columns: ["id"];
                        isOneToOne: true;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            series: {
                Row: {
                    id: string;
                    created_at: string;
                    updated_at: string;
                    title: string;
                    tagline: string | null;
                    base_concept: string;
                    full_lore: string;
                    genre: string[] | null;
                    themes: string[] | null;
                    setting: string | null;
                    planned_seasons: number;
                    current_season: number;
                    episodes_per_season: number;
                    narrative_style: string | null;
                    target_duration_per_episode: number;
                    visual_style: string | null;
                    script_style: string | null;
                    main_characters: any | null;
                    status: string;
                    user_id: string | null;
                    is_public: boolean;
                    tags: string[] | null;
                    series_poster_url: string | null;
                    series_poster_status: string;
                    series_poster_job_id: string | null;
                    series_poster_prompt: string | null;
                    series_visual_keywords: string[] | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    title: string;
                    tagline?: string | null;
                    base_concept: string;
                    full_lore: string;
                    genre?: string[] | null;
                    themes?: string[] | null;
                    setting?: string | null;
                    planned_seasons?: number;
                    current_season?: number;
                    episodes_per_season?: number;
                    narrative_style?: string | null;
                    target_duration_per_episode?: number;
                    visual_style?: string | null;
                    script_style?: string | null;
                    main_characters?: any | null;
                    status?: string;
                    user_id?: string | null;
                    is_public?: boolean;
                    tags?: string[] | null;
                    series_poster_url?: string | null;
                    series_poster_status?: string;
                    series_poster_job_id?: string | null;
                    series_poster_prompt?: string | null;
                    series_visual_keywords?: string[] | null;
                };
                Update: {
                    id?: string;
                    updated_at?: string;
                    title?: string;
                    tagline?: string | null;
                    base_concept?: string;
                    full_lore?: string;
                    genre?: string[] | null;
                    themes?: string[] | null;
                    setting?: string | null;
                    planned_seasons?: number;
                    current_season?: number;
                    episodes_per_season?: number;
                    narrative_style?: string | null;
                    target_duration_per_episode?: number;
                    visual_style?: string | null;
                    script_style?: string | null;
                    main_characters?: any | null;
                    status?: string;
                    user_id?: string | null;
                    is_public?: boolean;
                    tags?: string[] | null;
                    series_poster_url?: string | null;
                    series_poster_status?: string;
                    series_poster_job_id?: string | null;
                    series_poster_prompt?: string | null;
                    series_visual_keywords?: string[] | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "series_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            characters: {
                Row: {
                    id: string;
                    created_at: string;
                    updated_at: string;
                    series_id: string;
                    name: string;
                    role: string;
                    description: string;
                    character_arc: string | null;
                    visual_prompt: string;
                    visual_keywords: string[];
                    age_range: string | null;
                    physical_traits: any | null;
                    distinctive_features: string[];
                    clothing_style: string | null;
                    poster_url: string | null;
                    poster_status: string;
                    poster_job_id: string | null;
                    poster_prompt: string | null;
                    reference_images: any | null;
                    color_palette: string[];
                    first_appearance_episode_id: string | null;
                    main_episodes: string[];
                    relationships: any | null;
                    current_status: string;
                    status_as_of_episode_id: string | null;
                    importance_level: number;
                    is_recurring: boolean;
                    tags: string[] | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    series_id: string;
                    name: string;
                    role: string;
                    description: string;
                    character_arc?: string | null;
                    visual_prompt: string;
                    visual_keywords: string[];
                    age_range?: string | null;
                    physical_traits?: any | null;
                    distinctive_features: string[];
                    clothing_style?: string | null;
                    poster_url?: string | null;
                    poster_status?: string;
                    poster_job_id?: string | null;
                    poster_prompt?: string | null;
                    reference_images?: any | null;
                    color_palette: string[];
                    first_appearance_episode_id?: string | null;
                    main_episodes?: string[];
                    relationships?: any | null;
                    current_status?: string;
                    status_as_of_episode_id?: string | null;
                    importance_level?: number;
                    is_recurring?: boolean;
                    tags?: string[] | null;
                };
                Update: {
                    id?: string;
                    updated_at?: string;
                    series_id?: string;
                    name?: string;
                    role?: string;
                    description?: string;
                    character_arc?: string | null;
                    visual_prompt?: string;
                    visual_keywords?: string[];
                    age_range?: string | null;
                    physical_traits?: any | null;
                    distinctive_features?: string[];
                    clothing_style?: string | null;
                    poster_url?: string | null;
                    poster_status?: string;
                    poster_job_id?: string | null;
                    poster_prompt?: string | null;
                    reference_images?: any | null;
                    color_palette?: string[];
                    first_appearance_episode_id?: string | null;
                    main_episodes?: string[];
                    relationships?: any | null;
                    current_status?: string;
                    status_as_of_episode_id?: string | null;
                    importance_level?: number;
                    is_recurring?: boolean;
                    tags?: string[] | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "characters_series_id_fkey";
                        columns: ["series_id"];
                        isOneToOne: false;
                        referencedRelation: "series";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "characters_first_appearance_episode_id_fkey";
                        columns: ["first_appearance_episode_id"];
                        isOneToOne: false;
                        referencedRelation: "episodes";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "characters_status_as_of_episode_id_fkey";
                        columns: ["status_as_of_episode_id"];
                        isOneToOne: false;
                        referencedRelation: "episodes";
                        referencedColumns: ["id"];
                    }
                ];
            };
            episodes: {
                Row: {
                    id: string;
                    created_at: string;
                    updated_at: string;
                    series_id: string;
                    season_number: number;
                    episode_number: number;
                    title: string;
                    synopsis: string;
                    full_script: string | null;
                    story_beats: string[] | null;
                    featured_characters: any | null;
                    target_duration: number;
                    actual_duration: number | null;
                    previous_episode_recap: string | null;
                    cliffhanger: string | null;
                    next_episode_tease: string | null;
                    status: string;
                    video_url: string | null;
                    video_status: string | null;
                    video_job_id: string | null;
                    thumbnail_url: string | null;
                    is_finale: boolean;
                    is_premiere: boolean;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                    series_id: string;
                    season_number: number;
                    episode_number: number;
                    title: string;
                    synopsis: string;
                    full_script?: string | null;
                    story_beats?: string[] | null;
                    featured_characters?: any | null;
                    target_duration?: number;
                    actual_duration?: number | null;
                    previous_episode_recap?: string | null;
                    cliffhanger?: string | null;
                    next_episode_tease?: string | null;
                    status?: string;
                    video_url?: string | null;
                    video_status?: string | null;
                    video_job_id?: string | null;
                    thumbnail_url?: string | null;
                    is_finale?: boolean;
                    is_premiere?: boolean;
                };
                Update: {
                    id?: string;
                    updated_at?: string;
                    series_id?: string;
                    season_number?: number;
                    episode_number?: number;
                    title?: string;
                    synopsis?: string;
                    full_script?: string | null;
                    story_beats?: string[] | null;
                    featured_characters?: any | null;
                    target_duration?: number;
                    actual_duration?: number | null;
                    previous_episode_recap?: string | null;
                    cliffhanger?: string | null;
                    next_episode_tease?: string | null;
                    status?: string;
                    video_url?: string | null;
                    video_status?: string | null;
                    video_job_id?: string | null;
                    thumbnail_url?: string | null;
                    is_finale?: boolean;
                    is_premiere?: boolean;
                };
                Relationships: [
                    {
                        foreignKeyName: "episodes_series_id_fkey";
                        columns: ["series_id"];
                        isOneToOne: false;
                        referencedRelation: "series";
                        referencedColumns: ["id"];
                    }
                ];
            };
            character_visual_generations: {
                Row: {
                    id: string;
                    created_at: string;
                    character_id: string;
                    prompt: string;
                    visual_style: string | null;
                    generation_type: string;
                    image_url: string | null;
                    status: string;
                    job_id: string | null;
                    error_message: string | null;
                    is_selected: boolean;
                    user_rating: number | null;
                    model_used: string | null;
                    generation_params: any | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    character_id: string;
                    prompt: string;
                    visual_style?: string | null;
                    generation_type: string;
                    image_url?: string | null;
                    status?: string;
                    job_id?: string | null;
                    error_message?: string | null;
                    is_selected?: boolean;
                    user_rating?: number | null;
                    model_used?: string | null;
                    generation_params?: any | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    character_id?: string;
                    prompt?: string;
                    visual_style?: string | null;
                    generation_type?: string;
                    image_url?: string | null;
                    status?: string;
                    job_id?: string | null;
                    error_message?: string | null;
                    is_selected?: boolean;
                    user_rating?: number | null;
                    model_used?: string | null;
                    generation_params?: any | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "character_visual_generations_character_id_fkey";
                        columns: ["character_id"];
                        isOneToOne: false;
                        referencedRelation: "characters";
                        referencedColumns: ["id"];
                    }
                ];
            };
            series_poster_generations: {
                Row: {
                    id: string;
                    created_at: string;
                    series_id: string;
                    prompt: string;
                    visual_style: string | null;
                    image_url: string | null;
                    status: string;
                    job_id: string | null;
                    error_message: string | null;
                    is_selected: boolean;
                    user_rating: number | null;
                    model_used: string | null;
                    generation_params: any | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    series_id: string;
                    prompt: string;
                    visual_style?: string | null;
                    image_url?: string | null;
                    status?: string;
                    job_id?: string | null;
                    error_message?: string | null;
                    is_selected?: boolean;
                    user_rating?: number | null;
                    model_used?: string | null;
                    generation_params?: any | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    series_id?: string;
                    prompt?: string;
                    visual_style?: string | null;
                    image_url?: string | null;
                    status?: string;
                    job_id?: string | null;
                    error_message?: string | null;
                    is_selected?: boolean;
                    user_rating?: number | null;
                    model_used?: string | null;
                    generation_params?: any | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "series_poster_generations_series_id_fkey";
                        columns: ["series_id"];
                        isOneToOne: false;
                        referencedRelation: "series";
                        referencedColumns: ["id"];
                    }
                ];
            };
            token_usage: {
                Row: {
                    id: string;
                    created_at: string;
                    series_id: string | null;
                    episode_id: string | null;
                    segment_id: string | null;
                    story_id: string | null;
                    character_id: string | null;
                    generation_id: string | null;
                    generation_type: 'text' | 'image' | 'audio' | 'video';
                    model_used: string;
                    provider: string;
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                    estimated_cost_usd: number | null;
                    context_type: string | null;
                    metadata: any | null;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    series_id?: string | null;
                    episode_id?: string | null;
                    segment_id?: string | null;
                    story_id?: string | null;
                    character_id?: string | null;
                    generation_id?: string | null;
                    generation_type: 'text' | 'image' | 'audio' | 'video';
                    model_used: string;
                    provider?: string;
                    prompt_tokens?: number;
                    completion_tokens?: number;
                    total_tokens?: number;
                    estimated_cost_usd?: number | null;
                    context_type?: string | null;
                    metadata?: any | null;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    series_id?: string | null;
                    episode_id?: string | null;
                    segment_id?: string | null;
                    story_id?: string | null;
                    character_id?: string | null;
                    generation_id?: string | null;
                    generation_type?: 'text' | 'image' | 'audio' | 'video';
                    model_used?: string;
                    provider?: string;
                    prompt_tokens?: number;
                    completion_tokens?: number;
                    total_tokens?: number;
                    estimated_cost_usd?: number | null;
                    context_type?: string | null;
                    metadata?: any | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "token_usage_series_id_fkey";
                        columns: ["series_id"];
                        isOneToOne: false;
                        referencedRelation: "series";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "token_usage_episode_id_fkey";
                        columns: ["episode_id"];
                        isOneToOne: false;
                        referencedRelation: "episodes";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "token_usage_segment_id_fkey";
                        columns: ["segment_id"];
                        isOneToOne: false;
                        referencedRelation: "segments";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "token_usage_story_id_fkey";
                        columns: ["story_id"];
                        isOneToOne: false;
                        referencedRelation: "stories";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "token_usage_character_id_fkey";
                        columns: ["character_id"];
                        isOneToOne: false;
                        referencedRelation: "characters";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "token_usage_generation_id_fkey";
                        columns: ["generation_id"];
                        isOneToOne: false;
                        referencedRelation: "generations";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

// Convenience types
export type DbStory = Database['public']['Tables']['stories']['Row'];
export type DbSegment = Database['public']['Tables']['segments']['Row'];
export type InsertStory = Database['public']['Tables']['stories']['Insert'];
export type InsertSegment = Database['public']['Tables']['segments']['Insert'];
export type UpdateSegment = Database['public']['Tables']['segments']['Update'];

export type DbGeneration = Database['public']['Tables']['generations']['Row'];
export type InsertGeneration = Database['public']['Tables']['generations']['Insert'];
export type UpdateGeneration = Database['public']['Tables']['generations']['Update'];

export type DbProfile = Database['public']['Tables']['profiles']['Row'];

export type DbTokenUsage = Database['public']['Tables']['token_usage']['Row'];
export type InsertTokenUsage = Database['public']['Tables']['token_usage']['Insert'];
export type UpdateTokenUsage = Database['public']['Tables']['token_usage']['Update'];

// Combined story with segments (for API responses)
export interface StoryWithSegments extends DbStory {
    segments: DbSegment[];
}
