-- =============================================
-- Viralify Database Schema v2
-- Normalized structure with separate segments table
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Stories Table (parent)
-- =============================================
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS stories CASCADE;

CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_idea TEXT NOT NULL,
    story_title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- =============================================
-- Segments Table (child)
-- =============================================
CREATE TABLE segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 5,
    text TEXT NOT NULL,
    visual_prompt TEXT NOT NULL,
    image_url TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique segment index per story
    UNIQUE(story_id, segment_index)
);

-- Index for faster joins
CREATE INDEX idx_segments_story_id ON segments(story_id);
CREATE INDEX idx_segments_order ON segments(story_id, segment_index);

-- =============================================
-- Auto-update timestamps
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at
    BEFORE UPDATE ON segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for development)
CREATE POLICY "Allow all on stories" ON stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on segments" ON segments FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Storage Bucket Setup (run in Dashboard)
-- =============================================
-- Go to Storage > Create buckets:
--
-- BUCKET 1: story-images
-- Name: story-images
-- Public: Yes
--
-- BUCKET 2: story-audios
-- Name: story-audios
-- Public: Yes
--
-- Then add these policies via SQL Editor:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('story-images', 'story-images', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('story-audios', 'story-audios', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "Public read images" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'story-images');
--
-- CREATE POLICY "Anyone can upload images" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'story-images');
--
-- CREATE POLICY "Anyone can update images" ON storage.objects 
--   FOR UPDATE USING (bucket_id = 'story-images');
--
-- CREATE POLICY "Anyone can delete images" ON storage.objects 
--   FOR DELETE USING (bucket_id = 'story-images');
--
-- CREATE POLICY "Public read audios" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'story-audios');
--
-- CREATE POLICY "Anyone can upload audios" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'story-audios');
--
-- CREATE POLICY "Anyone can update audios" ON storage.objects 
--   FOR UPDATE USING (bucket_id = 'story-audios');
--
-- CREATE POLICY "Anyone can delete audios" ON storage.objects 
--   FOR DELETE USING (bucket_id = 'story-audios');
