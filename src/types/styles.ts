// ═══════════════════════════════════════════════════════════════════════════
// VISUAL STYLES
// Keys match the STYLES object in the image generation script
// ═══════════════════════════════════════════════════════════════════════════

export const VisualStyleKey = {
    ComicBook: 'comic-book',
    CreepyComic: 'creepy-comic',
    CinematicRealistic: 'cinematic-realistic',
    Anime: 'anime',
    OilPainting: 'oil-painting',
    ThreeDRender: '3d-render',
    Watercolor: 'watercolor',
    Cyberpunk: 'cyberpunk',
    Steampunk: 'steampunk',
    Gothic: 'gothic',
    ScaryCartoon: 'scary-cartoon',
    PixarLike: 'pixar-like',
} as const;

export const VisualStyleLabel = {
    ComicBook: 'Comic Book',
    CreepyComic: 'Creepy Comic',
    CinematicRealistic: 'Cinematic Realistic',
    Anime: 'Anime',
    OilPainting: 'Oil Painting',
    ThreeDRender: '3D Render',
    Watercolor: 'Watercolor',
    Cyberpunk: 'Cyberpunk',
    Steampunk: 'Steampunk',
    Gothic: 'Gothic',
    ScaryCartoon: 'Scary Cartoon',
    PixarLike: 'Pixar Like',
} as const;

export const VisualStyleDescription = {
    ComicBook: 'Bold comic book panel with thick black ink outlines, halftone dot shading, and vibrant saturated colors',
    CreepyComic: 'Creepy indie comic illustration with wobbly hand-drawn ink lines and muted sickly colors',
    CinematicRealistic: 'Cinematic photorealistic scene with volumetric fog and dramatic directional lighting',
    Anime: 'Anime illustration with large expressive eyes, vibrant cel-shaded colors, and dynamic poses',
    OilPainting: 'Classical oil painting with visible thick brushstrokes, rich deep colors, and dramatic chiaroscuro lighting',
    ThreeDRender: 'Stylized 3D render with ray-traced reflections and perfect studio lighting',
    Watercolor: 'Watercolor painting with soft bleeding color edges and translucent washes of pastel colors',
    Cyberpunk: 'Cyberpunk city street with neon signs, rain-slicked ground, and holographic advertisements',
    Steampunk: 'Steampunk mechanical scene with exposed gears, copper pipes, and Victorian era industrial aesthetic',
    Gothic: 'Dark gothic illustration with deep black and grey palette and medieval horror style',
    ScaryCartoon: 'Illustrated comic book style with dramatic cinematic lighting and semi-realistic proportions',
    PixarLike: 'Pixar-style 3D animation with cute characters, rounded features, and Disney quality rendering',
} as const;

// Type-safe key and label types
export type VisualStyleKey = typeof VisualStyleKey[keyof typeof VisualStyleKey];
export type VisualStyleLabel = typeof VisualStyleLabel[keyof typeof VisualStyleLabel];
export type VisualStyleDescription = typeof VisualStyleDescription[keyof typeof VisualStyleDescription];

// Arrays of all visual style keys and labels
export const VISUAL_STYLE_KEYS = Object.values(VisualStyleKey);
export const VISUAL_STYLE_LABELS = Object.values(VisualStyleLabel);
export const VISUAL_STYLE_DESCRIPTIONS = Object.values(VisualStyleDescription);

// ═══════════════════════════════════════════════════════════════════════════
// SCRIPT STYLES (Tone/Mood)
// Keys match the SCRIPT_STYLES object in the image generation script
// ═══════════════════════════════════════════════════════════════════════════

export const ScriptStyleKey = {
    ScaryHorror: 'scary-horror',
    FunnyComedy: 'funny-comedy',
    EducationalDocumentary: 'educational-documentary',
    DramaticTelenovela: 'dramatic-telenovela',
    InspirationalMotivational: 'inspirational-motivational',
    ActionThriller: 'action-thriller',
} as const;

export const ScriptStyleLabel = {
    ScaryHorror: 'Scary/Horror',
    FunnyComedy: 'Funny/Comedy',
    EducationalDocumentary: 'Educational/Documentary',
    DramaticTelenovela: 'Dramatic/Telenovela',
    InspirationalMotivational: 'Inspirational/Motivational',
    ActionThriller: 'Action/Thriller',
} as const;

export const ScriptStyleDescription = {
    ScaryHorror: 'Cinematic horror atmosphere with dark haunted scenes, shadowy figures, and ominous mood',
    FunnyComedy: 'Bright colorful scenes with exaggerated expressions, fun and joyful atmosphere',
    EducationalDocumentary: 'Professional documentary style with warm lighting and intellectual vibe',
    DramaticTelenovela: 'Dramatic soap opera aesthetic with intense emotions and high contrast',
    InspirationalMotivational: 'Inspirational scenes with uplifting atmosphere and breathtaking views',
    ActionThriller: 'High octane action scenes with motion blur, explosions, and intense energy',
} as const;

// Type-safe key and label types
export type ScriptStyleKey = typeof ScriptStyleKey[keyof typeof ScriptStyleKey];
export type ScriptStyleLabel = typeof ScriptStyleLabel[keyof typeof ScriptStyleLabel];
export type ScriptStyleDescription = typeof ScriptStyleDescription[keyof typeof ScriptStyleDescription];

// Arrays of all script style keys and labels
export const SCRIPT_STYLE_KEYS = Object.values(ScriptStyleKey);
export const SCRIPT_STYLE_LABELS = Object.values(ScriptStyleLabel);
export const SCRIPT_STYLE_DESCRIPTIONS = Object.values(ScriptStyleDescription);

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE STYLE METADATA
// Complete information about each style
// ═══════════════════════════════════════════════════════════════════════════

export interface VisualStyleMetadata {
    key: VisualStyleKey;
    label: VisualStyleLabel;
    description: VisualStyleDescription;
    imagePath: string;
    tags: string[];
    bestFor: string[];
}

export interface ScriptStyleMetadata {
    key: ScriptStyleKey;
    label: ScriptStyleLabel;
    description: ScriptStyleDescription;
    imagePath: string;
    tags: string[];
    bestFor: string[];
}

export const VISUAL_STYLE_METADATA: Record<VisualStyleKey, VisualStyleMetadata> = {
    'comic-book': {
        key: 'comic-book',
        label: 'Comic Book',
        description: 'Bold comic book panel with thick black ink outlines, halftone dot shading, and vibrant saturated colors',
        imagePath: '/assets/styles/comic-book.jpg',
        tags: ['bold', 'vibrant', 'illustrated', 'action'],
        bestFor: ['superhero stories', 'action narratives', 'dynamic scenes', 'adventure tales'],
    },
    'creepy-comic': {
        key: 'creepy-comic',
        label: 'Creepy Comic',
        description: 'Creepy indie comic illustration with wobbly hand-drawn ink lines and muted sickly colors',
        imagePath: '/assets/styles/creepy-comic.jpg',
        tags: ['horror', 'unsettling', 'indie', 'dark'],
        bestFor: ['horror stories', 'psychological thrillers', 'creepy tales', 'disturbing narratives'],
    },
    'cinematic-realistic': {
        key: 'cinematic-realistic',
        label: 'Cinematic Realistic',
        description: 'Cinematic photorealistic scene with volumetric fog and dramatic directional lighting',
        imagePath: '/assets/styles/cinematic-realistic.jpg',
        tags: ['realistic', 'cinematic', 'dramatic', 'photographic'],
        bestFor: ['historical events', 'war stories', 'documentaries', 'realistic dramas'],
    },
    'anime': {
        key: 'anime',
        label: 'Anime',
        description: 'Anime illustration with large expressive eyes, vibrant cel-shaded colors, and dynamic poses',
        imagePath: '/assets/styles/anime.jpg',
        tags: ['anime', 'vibrant', 'expressive', 'japanese'],
        bestFor: ['fantasy stories', 'adventure tales', 'character-driven narratives', 'emotional journeys'],
    },
    'oil-painting': {
        key: 'oil-painting',
        label: 'Oil Painting',
        description: 'Classical oil painting with visible thick brushstrokes, rich deep colors, and dramatic chiaroscuro lighting',
        imagePath: '/assets/styles/oil-painting.jpg',
        tags: ['classical', 'artistic', 'elegant', 'timeless'],
        bestFor: ['historical narratives', 'period pieces', 'classical tales', 'artistic stories'],
    },
    '3d-render': {
        key: '3d-render',
        label: '3D Render',
        description: 'Stylized 3D render with ray-traced reflections and perfect studio lighting',
        imagePath: '/assets/styles/3d-render.jpg',
        tags: ['3d', 'modern', 'clean', 'futuristic'],
        bestFor: ['sci-fi stories', 'tech narratives', 'futuristic tales', 'product stories'],
    },
    'watercolor': {
        key: 'watercolor',
        label: 'Watercolor',
        description: 'Watercolor painting with soft bleeding color edges and translucent washes of pastel colors',
        imagePath: '/assets/styles/watercolor.jpg',
        tags: ['soft', 'dreamy', 'gentle', 'impressionist'],
        bestFor: ['gentle stories', 'nature tales', 'emotional narratives', 'peaceful scenes'],
    },
    'cyberpunk': {
        key: 'cyberpunk',
        label: 'Cyberpunk',
        description: 'Cyberpunk city street with neon signs, rain-slicked ground, and holographic advertisements',
        imagePath: '/assets/styles/cyberpunk.jpg',
        tags: ['neon', 'futuristic', 'urban', 'tech-noir'],
        bestFor: ['dystopian stories', 'tech thrillers', 'future noir', 'urban tales'],
    },
    'steampunk': {
        key: 'steampunk',
        label: 'Steampunk',
        description: 'Steampunk mechanical scene with exposed gears, copper pipes, and Victorian era industrial aesthetic',
        imagePath: '/assets/styles/steampunk.jpg',
        tags: ['victorian', 'mechanical', 'vintage', 'industrial'],
        bestFor: ['alternative history', 'invention stories', 'Victorian tales', 'mechanical adventures'],
    },
    'gothic': {
        key: 'gothic',
        label: 'Gothic',
        description: 'Dark gothic illustration with deep black and grey palette and medieval horror style',
        imagePath: '/assets/styles/gothic.jpg',
        tags: ['dark', 'medieval', 'atmospheric', 'moody'],
        bestFor: ['gothic horror', 'dark fantasy', 'medieval tales', 'atmospheric stories'],
    },
    'scary-cartoon': {
        key: 'scary-cartoon',
        label: 'Scary Cartoon',
        description: 'Illustrated comic book style with dramatic cinematic lighting and semi-realistic proportions',
        imagePath: '/assets/styles/scary-cartoon.jpg',
        tags: ['illustrated', 'dramatic', 'historical', 'cinematic'],
        bestFor: ['historical stories', 'period narratives', 'dramatic tales', 'vintage stories'],
    },
    'pixar-like': {
        key: 'pixar-like',
        label: 'Pixar Like',
        description: 'Pixar-style 3D animation with cute characters, rounded features, and Disney quality rendering',
        imagePath: '/assets/styles/pixar-like.jpg',
        tags: ['3d', 'cute', 'animated', 'wholesome', 'disney'],
        bestFor: ['children stories', 'emotional narratives', 'cute tales', 'animated adventures'],
    },
};

export const SCRIPT_STYLE_METADATA: Record<ScriptStyleKey, ScriptStyleMetadata> = {
    'scary-horror': {
        key: 'scary-horror',
        label: 'Scary/Horror',
        description: 'Cinematic horror atmosphere with dark haunted scenes, shadowy figures, and ominous mood',
        imagePath: '/assets/scripts/scary-horror.jpg',
        tags: ['horror', 'scary', 'suspenseful', 'dark'],
        bestFor: ['horror stories', 'scary tales', 'suspenseful narratives', 'dark mysteries'],
    },
    'funny-comedy': {
        key: 'funny-comedy',
        label: 'Funny/Comedy',
        description: 'Bright colorful scenes with exaggerated expressions, fun and joyful atmosphere',
        imagePath: '/assets/scripts/funny-comedy.jpg',
        tags: ['comedy', 'funny', 'lighthearted', 'cheerful'],
        bestFor: ['comedy sketches', 'funny stories', 'lighthearted tales', 'humorous narratives'],
    },
    'educational-documentary': {
        key: 'educational-documentary',
        label: 'Educational/Documentary',
        description: 'Professional documentary style with warm lighting and intellectual vibe',
        imagePath: '/assets/scripts/educational-documentary.jpg',
        tags: ['educational', 'informative', 'professional', 'documentary'],
        bestFor: ['educational content', 'documentaries', 'informative stories', 'historical facts'],
    },
    'dramatic-telenovela': {
        key: 'dramatic-telenovela',
        label: 'Dramatic/Telenovela',
        description: 'Dramatic soap opera aesthetic with intense emotions and high contrast',
        imagePath: '/assets/scripts/dramatic-telenovela.jpg',
        tags: ['dramatic', 'emotional', 'intense', 'telenovela'],
        bestFor: ['dramatic stories', 'emotional narratives', 'intense scenes', 'soap opera style'],
    },
    'inspirational-motivational': {
        key: 'inspirational-motivational',
        label: 'Inspirational/Motivational',
        description: 'Inspirational scenes with uplifting atmosphere and breathtaking views',
        imagePath: '/assets/scripts/inspirational-motivational.jpg',
        tags: ['inspirational', 'motivational', 'uplifting', 'positive'],
        bestFor: ['motivational stories', 'inspiring tales', 'success narratives', 'uplifting content'],
    },
    'action-thriller': {
        key: 'action-thriller',
        label: 'Action/Thriller',
        description: 'High octane action scenes with motion blur, explosions, and intense energy',
        imagePath: '/assets/scripts/action-thriller.jpg',
        tags: ['action', 'thriller', 'intense', 'fast-paced'],
        bestFor: ['action stories', 'thrillers', 'chase scenes', 'intense narratives'],
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the file system path for a visual style image
 * @param key - Visual style key (e.g., 'comic-book')
 * @returns Image path (e.g., '/assets/styles/comic-book.jpg')
 */
export function getVisualStyleImagePath(key: VisualStyleKey): string {
    return `/assets/styles/${key}.jpg`;
}

/**
 * Get the file system path for a script style image
 * @param key - Script style key (e.g., 'scary-horror')
 * @returns Image path (e.g., '/assets/scripts/scary-horror.jpg')
 */
export function getScriptStyleImagePath(key: ScriptStyleKey): string {
    return `/assets/scripts/${key}.jpg`;
}

/**
 * Convert a visual style key to its display label
 * @param key - Visual style key (e.g., 'comic-book')
 * @returns Display label (e.g., 'Comic Book')
 */
export function visualStyleKeyToLabel(key: VisualStyleKey): VisualStyleLabel {
    const entries = Object.entries(VisualStyleKey) as [keyof typeof VisualStyleKey, VisualStyleKey][];
    const entry = entries.find(([_, val]) => val === key);
    if (!entry) throw new Error(`Unknown visual style key: ${key}`);
    return VisualStyleLabel[entry[0]];
}

/**
 * Convert a visual style label to its key
 * @param label - Display label (e.g., 'Comic Book')
 * @returns Visual style key (e.g., 'comic-book')
 */
export function visualStyleLabelToKey(label: VisualStyleLabel): VisualStyleKey {
    const entries = Object.entries(VisualStyleLabel) as [keyof typeof VisualStyleLabel, VisualStyleLabel][];
    const entry = entries.find(([_, val]) => val === label);
    if (!entry) throw new Error(`Unknown visual style label: ${label}`);
    return VisualStyleKey[entry[0]];
}

/**
 * Convert a script style key to its display label
 * @param key - Script style key (e.g., 'scary-horror')
 * @returns Display label (e.g., 'Scary/Horror')
 */
export function scriptStyleKeyToLabel(key: ScriptStyleKey): ScriptStyleLabel {
    const entries = Object.entries(ScriptStyleKey) as [keyof typeof ScriptStyleKey, ScriptStyleKey][];
    const entry = entries.find(([_, val]) => val === key);
    if (!entry) throw new Error(`Unknown script style key: ${key}`);
    return ScriptStyleLabel[entry[0]];
}

/**
 * Convert a script style label to its key
 * @param label - Display label (e.g., 'Scary/Horror')
 * @returns Script style key (e.g., 'scary-horror')
 */
export function scriptStyleLabelToKey(label: ScriptStyleLabel): ScriptStyleKey {
    const entries = Object.entries(ScriptStyleLabel) as [keyof typeof ScriptStyleLabel, ScriptStyleLabel][];
    const entry = entries.find(([_, val]) => val === label);
    if (!entry) throw new Error(`Unknown script style label: ${label}`);
    return ScriptStyleKey[entry[0]];
}

/**
 * Get complete metadata for a visual style
 * @param key - Visual style key
 * @returns Complete metadata object
 */
export function getVisualStyleMetadata(key: VisualStyleKey): VisualStyleMetadata {
    return VISUAL_STYLE_METADATA[key];
}

/**
 * Get complete metadata for a script style
 * @param key - Script style key
 * @returns Complete metadata object
 */
export function getScriptStyleMetadata(key: ScriptStyleKey): ScriptStyleMetadata {
    return SCRIPT_STYLE_METADATA[key];
}

/**
 * Check if a value is a valid visual style key
 * @param value - Value to check
 * @returns Type guard for VisualStyleKey
 */
export function isVisualStyleKey(value: unknown): value is VisualStyleKey {
    return typeof value === 'string' && VISUAL_STYLE_KEYS.includes(value as VisualStyleKey);
}

/**
 * Check if a value is a valid script style key
 * @param value - Value to check
 * @returns Type guard for ScriptStyleKey
 */
export function isScriptStyleKey(value: unknown): value is ScriptStyleKey {
    return typeof value === 'string' && SCRIPT_STYLE_KEYS.includes(value as ScriptStyleKey);
}

/**
 * Get all visual styles that match certain tags
 * @param tags - Tags to filter by
 * @returns Array of matching visual style keys
 */
export function getVisualStylesByTags(tags: string[]): VisualStyleKey[] {
    return VISUAL_STYLE_KEYS.filter((key) => {
        const metadata = VISUAL_STYLE_METADATA[key];
        return tags.some((tag) => metadata.tags.includes(tag));
    });
}

/**
 * Get all script styles that match certain tags
 * @param tags - Tags to filter by
 * @returns Array of matching script style keys
 */
export function getScriptStylesByTags(tags: string[]): ScriptStyleKey[] {
    return SCRIPT_STYLE_KEYS.filter((key) => {
        const metadata = SCRIPT_STYLE_METADATA[key];
        return tags.some((tag) => metadata.tags.includes(tag));
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKWARDS COMPATIBILITY (DEPRECATED)
// Remove these once you've migrated all code
// ═══════════════════════════════════════════════════════════════════════════

/** @deprecated Use VisualStyleLabel instead */
export const VisualStyle = VisualStyleLabel;

/** @deprecated Use ScriptStyleLabel instead */
export const ScriptStyle = ScriptStyleLabel;

/** @deprecated Use VISUAL_STYLE_LABELS instead */
export const VISUAL_STYLES = VISUAL_STYLE_LABELS;

/** @deprecated Use SCRIPT_STYLE_LABELS instead */
export const SCRIPT_STYLES = SCRIPT_STYLE_LABELS;