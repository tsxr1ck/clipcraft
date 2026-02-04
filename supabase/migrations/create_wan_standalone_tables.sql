-- Drop previous experimental tables
DROP TABLE IF EXISTS wan_segments CASCADE;
DROP TABLE IF EXISTS wan_generations CASCADE;

-- Create table for Standalone Wan Stories
CREATE TABLE IF NOT EXISTS wan_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id), -- Optional tracking of creator
    
    title TEXT NOT NULL,
    premise TEXT,
    visual_style TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'draft', -- draft, generating_assets, ready
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wan_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to wan_stories" ON wan_stories FOR ALL USING (true) WITH CHECK (true);

-- Create table for segments within a standalone story
CREATE TABLE IF NOT EXISTS wan_story_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wan_story_id UUID REFERENCES wan_stories(id) ON DELETE CASCADE,
    
    segment_index INTEGER NOT NULL,
    
    -- Content
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
ALTER TABLE wan_story_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to wan_story_segments" ON wan_story_segments FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_wan_stories_user ON wan_stories(user_id);
CREATE INDEX idx_wan_story_segments_story ON wan_story_segments(wan_story_id);

-- Triggers for updated_at
CREATE TRIGGER update_wan_stories_modtime BEFORE UPDATE ON wan_stories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_wan_story_segments_modtime BEFORE UPDATE ON wan_story_segments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
