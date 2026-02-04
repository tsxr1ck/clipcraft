// ============================================================================
// CHARACTER VISUAL SYSTEM - TYPESCRIPT TYPES
// ============================================================================

export type CharacterRole =
    | 'protagonist'
    | 'antagonist'
    | 'aliado'
    | 'supporting'
    | 'minor';

export type CharacterStatus =
    | 'active'
    | 'deceased'
    | 'disappeared'
    | 'unknown';

export type GenerationStatus =
    | 'pending'
    | 'generating'
    | 'completed'
    | 'failed';

export type GenerationType =
    | 'poster'
    | 'scene'
    | 'reference'
    | 'variation';

export type VisualStyle =
    | 'cinematic-realistic'
    | 'anime'
    | 'comic-book'
    | 'noir'
    | 'neon-cyberpunk'
    | 'retro'
    | 'minimalist';

// ============================================================================
// CHARACTER TYPES
// ============================================================================

export interface PhysicalTraits {
    height?: 'very short' | 'short' | 'average' | 'tall' | 'very tall';
    build?: 'slim' | 'athletic' | 'average' | 'muscular' | 'heavy';
    hair?: string; // e.g., "black short pixie cut", "long wavy brown"
    eyes?: string; // e.g., "dark brown", "green with cybernetic implant"
    skin?: string; // e.g., "brown", "pale", "tanned"
    facial_hair?: string; // e.g., "short beard", "clean shaven"
    scars?: string[]; // e.g., ["circuit scar on temple", "burn on left hand"]
    tattoos?: string[]; // e.g., ["tribal sleeve on right arm"]
    cybernetics?: string[]; // e.g., ["neural implant visible at temple"]
}

export interface CharacterRelationship {
    character_id: string;
    relationship: string; // e.g., "hermano", "enemigo", "mentor"
    description?: string;
    status?: 'active' | 'estranged' | 'deceased';
}

export interface ReferenceImage {
    url: string;
    description: string;
    type: 'face' | 'clothing' | 'pose' | 'scene' | 'other';
    is_primary?: boolean;
}

export interface Character {
    id: string;
    created_at: string;
    updated_at: string;

    // Series Reference
    series_id: string;

    // Basic Info
    name: string;
    role: CharacterRole;
    description: string;
    character_arc?: string;

    // Visual Identity
    visual_prompt: string;
    visual_keywords: string[];
    age_range?: string;
    physical_traits?: PhysicalTraits;
    distinctive_features: string[];
    clothing_style?: string;

    // Character Poster
    poster_url?: string;
    poster_status: GenerationStatus;
    poster_job_id?: string;
    poster_prompt?: string;

    // Additional Visual References
    reference_images?: ReferenceImage[];
    color_palette: string[]; // Hex colors

    // Story Integration
    first_appearance_episode_id?: string;
    main_episodes: string[]; // Episode UUIDs
    relationships?: CharacterRelationship[];

    // Character State
    current_status: CharacterStatus;
    status_as_of_episode_id?: string;

    // Metadata
    importance_level: number; // 1-10
    is_recurring: boolean;
    tags?: string[];
}

// ============================================================================
// VISUAL GENERATION TYPES
// ============================================================================

export interface GenerationParams {
    steps?: number;
    guidance?: number;
    seed?: number;
    width?: number;
    height?: number;
    negative_prompt?: string;
    [key: string]: any;
}

export interface CharacterVisualGeneration {
    id: string;
    created_at: string;

    character_id: string;

    // Generation Details
    prompt: string;
    visual_style: VisualStyle;
    generation_type: GenerationType;

    // Output
    image_url?: string;
    status: GenerationStatus;
    job_id?: string;
    error_message?: string;

    // Quality/Selection
    is_selected: boolean;
    user_rating?: number; // 1-5

    // Technical
    model_used?: string;
    generation_params?: GenerationParams;
}

export interface SeriesPosterGeneration {
    id: string;
    created_at: string;

    series_id: string;

    // Generation Details
    prompt: string;
    visual_style: VisualStyle;

    // Output
    image_url?: string;
    status: GenerationStatus;
    job_id?: string;
    error_message?: string;

    // Selection
    is_selected: boolean;
    user_rating?: number;

    // Technical
    model_used?: string;
    generation_params?: GenerationParams;
}

// ============================================================================
// SERIES TYPES (UPDATED)
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
    narrative_style?: string;
    target_duration_per_episode: number;

    // Visual & Audio Style
    visual_style?: VisualStyle;
    script_style?: string;

    // Poster (NEW)
    series_poster_url?: string;
    series_poster_status: GenerationStatus;
    series_poster_job_id?: string;
    series_poster_prompt?: string;
    series_visual_keywords?: string[];

    // Characters (DEPRECATED - use characters table)
    main_characters?: any; // Keep for backward compatibility

    // Production Status
    status: string;

    // Metadata
    user_id: string;
    is_public: boolean;
    tags?: string[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateCharacterRequest {
    series_id: string;
    name: string;
    role: CharacterRole;
    description: string;
    visual_prompt: string;
    character_arc?: string;
    age_range?: string;
    physical_traits?: PhysicalTraits;
    distinctive_features: string[];
    clothing_style?: string;
    visual_keywords: string[];
    color_palette: string[];
    importance_level?: number;
    relationships?: CharacterRelationship[];
}

export interface CreateCharacterDatabaseRecord extends CreateCharacterRequest {
    poster_status?: 'pending' | 'generating' | 'completed' | 'failed';
    current_status?: CharacterStatus;
    is_recurring?: boolean;
    main_episodes?: string[];
}

export interface UpdateCharacterRequest {
    name?: string;
    role?: CharacterRole;
    description?: string;
    character_arc?: string;
    age_range?: string;
    physical_traits?: PhysicalTraits;
    distinctive_features?: string[];
    clothing_style?: string;
    visual_keywords?: string[];
    color_palette?: string[];
    current_status?: CharacterStatus;
    importance_level?: number;
    relationships?: CharacterRelationship[];
}

export interface GeneratePosterRequest {
    character_id?: string; // For character poster
    series_id?: string; // For series poster
    custom_prompt?: string; // Override auto-generated prompt
    visual_style?: VisualStyle;
    generation_params?: GenerationParams;
}

export interface GeneratePosterResponse {
    job_id: string;
    generation_id: string;
    status: GenerationStatus;
    estimated_time_seconds?: number;
}

export interface ImageGenerationWebhook {
    job_id: string;
    status: GenerationStatus;
    image_url?: string;
    error_message?: string;
    metadata?: {
        model: string;
        generation_time_ms: number;
        [key: string]: any;
    };
}

export interface SelectVisualRequest {
    visual_generation_id: string;
}

export interface RateVisualRequest {
    visual_generation_id: string;
    rating: 1 | 2 | 3 | 4 | 5;
}

// ============================================================================
// QUERY RESPONSE TYPES
// ============================================================================

export interface CharacterWithVisuals extends Character {
    visual_generations: CharacterVisualGeneration[];
    series: {
        title: string;
        visual_style: VisualStyle;
        setting: string;
    };
}

export interface SeriesWithCharacters extends Series {
    characters: Character[];
    character_count: number;
}

export interface EpisodeWithCharacters {
    id: string;
    title: string;
    synopsis: string;
    featured_characters: {
        character_id: string;
        character_name: string;
        character_role: CharacterRole;
        character_poster_url?: string;
        focus: string; // "protagonist", "supporting", etc.
    }[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface VisualPromptBuilder {
    character: Character;
    series: Series;
    includeBackground?: boolean;
    emphasizeFeatures?: string[];
    customSuffix?: string;
}

export type CharacterFilter = {
    series_id?: string;
    role?: CharacterRole | CharacterRole[];
    status?: CharacterStatus | CharacterStatus[];
    min_importance?: number;
    has_poster?: boolean;
    tags?: string[];
};

export type CharacterSort =
    | 'importance_desc'
    | 'importance_asc'
    | 'name_asc'
    | 'name_desc'
    | 'created_desc'
    | 'created_asc';

// ============================================================================
// FORM SCHEMAS (for validation)
// ============================================================================

export const CharacterFormSchema = {
    name: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 200
    },
    role: {
        type: 'enum',
        required: true,
        values: ['protagonist', 'antagonist', 'aliado', 'supporting', 'minor']
    },
    description: {
        type: 'string',
        required: true,
        minLength: 10,
        maxLength: 2000
    },
    character_arc: {
        type: 'string',
        required: false,
        maxLength: 1000
    },
    age_range: {
        type: 'string',
        required: false,
        maxLength: 100
    },
    distinctive_features: {
        type: 'array',
        required: true,
        minItems: 1,
        maxItems: 10
    },
    clothing_style: {
        type: 'string',
        required: false,
        maxLength: 300
    },
    visual_keywords: {
        type: 'array',
        required: true,
        minItems: 3,
        maxItems: 15
    },
    color_palette: {
        type: 'array',
        required: true,
        minItems: 2,
        maxItems: 6,
        itemPattern: /^#[0-9A-Fa-f]{6}$/
    },
    importance_level: {
        type: 'number',
        required: false,
        min: 1,
        max: 10,
        default: 5
    }
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const CHARACTER_ROLES: Record<CharacterRole, { label: string; color: string }> = {
    protagonist: { label: 'Protagonista', color: '#3b82f6' },
    antagonist: { label: 'Antagonista', color: '#ef4444' },
    aliado: { label: 'Aliado', color: '#10b981' },
    supporting: { label: 'Secundario', color: '#6b7280' },
    minor: { label: 'Menor', color: '#9ca3af' }
};

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
    steps: 4,
    guidance: 7.5,
    width: 768,
    height: 1024,
    seed: Math.floor(Math.random() * 1000000)
};

export const VISUAL_STYLES: Record<VisualStyle, string> = {
    'cinematic-realistic': 'Cinematic Realistic',
    'anime': 'Anime Style',
    'comic-book': 'Comic Book',
    'noir': 'Film Noir',
    'neon-cyberpunk': 'Neon Cyberpunk',
    'retro': 'Retro/Vintage',
    'minimalist': 'Minimalist'
};