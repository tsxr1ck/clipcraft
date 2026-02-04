-- Create table for tracking high-level Wan2.6 generations per episode
CREATE TABLE IF NOT EXISTS wan_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    
    -- Status tracking for the whole batch
    status TEXT DEFAULT 'pending', -- pending, audio_processing, video_processing, assembling, completed, failed
    progress INTEGER DEFAULT 0,
    
    -- Final output
    final_video_url TEXT,
    subtitle_url TEXT,
    
    -- Metadata
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wan_generations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (since we are in single user mode for now/dev)
CREATE POLICY "Allow all access to wan_generations" ON wan_generations
    FOR ALL USING (true) WITH CHECK (true);


-- Create table to copy segment data and track per-segment assets
CREATE TABLE IF NOT EXISTS wan_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wan_generation_id UUID REFERENCES wan_generations(id) ON DELETE CASCADE,
    
    -- Link back to original just for reference, but data is copied
    original_segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
    segment_index INTEGER NOT NULL,
    
    -- Inputs (Copied/Snapshot)
    text_content TEXT,
    visual_prompt TEXT,
    
    -- Generated Assets
    audio_url TEXT,
    video_url TEXT,
    
    -- Job Tracking
    status TEXT DEFAULT 'pending', -- pending, audio_ready, generating_video, video_ready, failed
    dashscope_task_id TEXT,
    
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wan_segments ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all access to wan_segments" ON wan_segments
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_wan_generations_episode_id ON wan_generations(episode_id);
CREATE INDEX idx_wan_segments_generation_id ON wan_segments(wan_generation_id);

-- Add simple updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wan_generations_modtime
    BEFORE UPDATE ON wan_generations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_wan_segments_modtime
    BEFORE UPDATE ON wan_segments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
