-- Create token_usage table for tracking AI generation costs
-- Allows aggregating costs at segment, episode, season, or series level

CREATE TABLE token_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Flexible entity linking (multiple can be set for hierarchy tracking)
    series_id UUID REFERENCES series(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
    
    -- Generation details
    generation_type TEXT NOT NULL CHECK (generation_type IN ('text', 'image', 'audio', 'video')),
    model_used TEXT NOT NULL,
    provider TEXT DEFAULT 'qwen',
    
    -- Token metrics (for text generations)
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Cost tracking (optional, user-configurable)
    estimated_cost_usd NUMERIC(10, 6),
    
    -- Context metadata
    context_type TEXT,  -- 'series_lore', 'episode_segments', 'character_poster', 'segment_image', 'segment_audio', etc.
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient aggregation queries
CREATE INDEX idx_token_usage_series ON token_usage(series_id);
CREATE INDEX idx_token_usage_episode ON token_usage(episode_id);
CREATE INDEX idx_token_usage_segment ON token_usage(segment_id);
CREATE INDEX idx_token_usage_story ON token_usage(story_id);
CREATE INDEX idx_token_usage_character ON token_usage(character_id);
CREATE INDEX idx_token_usage_created ON token_usage(created_at);
CREATE INDEX idx_token_usage_type ON token_usage(generation_type);
CREATE INDEX idx_token_usage_context ON token_usage(context_type);

-- Comments for documentation
COMMENT ON TABLE token_usage IS 'Tracks AI generation token/resource usage for cost analysis at segment, episode, season, and series levels.';
COMMENT ON COLUMN token_usage.generation_type IS 'Type of generation: text (LLM), image, audio, or video';
COMMENT ON COLUMN token_usage.context_type IS 'What the generation was for: series_lore, episode_segments, character_poster, segment_image, segment_audio, etc.';
COMMENT ON COLUMN token_usage.estimated_cost_usd IS 'Optional calculated cost in USD based on provider pricing';
