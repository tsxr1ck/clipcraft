-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-videos', 'story-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove existing policies to avoid conflicts (optional, allows re-running)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Create permissive policies for the story-videos bucket
-- (Adjust these if you have authentication implemented)

-- 1. Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'story-videos' );

-- 2. Allow public upload (INSERT)
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'story-videos' );

-- 3. Allow public updates
CREATE POLICY "Public Update Access"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'story-videos' );

-- 4. Allow public deletes (optional, for cleanup)
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING ( bucket_id = 'story-videos' );
