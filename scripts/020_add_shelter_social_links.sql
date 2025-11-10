-- Add website and social links to shelters table
ALTER TABLE shelters 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;

-- Social links will be stored as an array of objects: [{platform: 'facebook', url: 'https://...'}]
COMMENT ON COLUMN shelters.social_links IS 'Array of social media links with platform and url';
