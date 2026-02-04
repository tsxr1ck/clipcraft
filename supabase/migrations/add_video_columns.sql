-- Add video-related columns to stories table
ALTER TABLE stories
ADD COLUMN video_url TEXT,
ADD COLUMN video_status TEXT DEFAULT 'idle',
ADD COLUMN video_job_id TEXT;

-- Comments
COMMENT ON COLUMN stories.video_url IS 'URL of the generated video file stored in Supabase Storage';
COMMENT ON COLUMN stories.video_status IS 'Status of the video generation process (idle, generating, completed, failed)';
COMMENT ON COLUMN stories.video_job_id IS 'ID of the external video generation job (ClipCraft)';
