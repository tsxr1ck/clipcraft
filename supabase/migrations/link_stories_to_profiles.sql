-- Add profile_id column to stories table referencing profiles table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Backfill existing stories with the specified profile ID
-- Note: This assumes the profile with this ID exists. If not, this statement will fail due to FK constraint.
UPDATE stories
SET profile_id = 'd96f419d-f0f4-4fb7-b287-bc72ceb556d5'
WHERE profile_id IS NULL;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_stories_profile_id ON stories(profile_id);
