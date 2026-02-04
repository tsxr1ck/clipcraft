-- Add video generation columns to segments table
ALTER TABLE public.segments 
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS video_status text DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS video_asset_id text;

-- Add check constraint for video status if needed (optional, flexible)
-- ALTER TABLE public.segments ADD CONSTRAINT segments_video_status_check CHECK (video_status IN ('idle', 'pending', 'generating', 'completed', 'failed'));
