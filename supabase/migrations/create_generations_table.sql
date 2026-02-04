-- Create generations tracking table
CREATE TABLE generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('story', 'image', 'audio', 'video')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    provider TEXT, -- e.g., 'qwen', 'clipcraft', 'openai'
    metadata JSONB DEFAULT '{}'::jsonb, -- Store extra info like prompt length, resolution, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying recent generations or by type
CREATE INDEX generations_story_id_idx ON generations(story_id);
CREATE INDEX generations_type_idx ON generations(type);
CREATE INDEX generations_created_at_idx ON generations(created_at);

-- Comments
COMMENT ON TABLE generations IS 'Tracks AI generation events for usage analytics and ETA calculation.';
