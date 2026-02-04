-- Add visual_style and script_tone columns to stories table
ALTER TABLE stories
ADD COLUMN visual_style TEXT,
ADD COLUMN script_tone TEXT;

-- Comment on columns
COMMENT ON COLUMN stories.visual_style IS 'The visual style used for generating the story images (e.g., Comic Book, Realistic)';
COMMENT ON COLUMN stories.script_tone IS 'The tone used for the script generation (e.g., Scary, Funny)';
