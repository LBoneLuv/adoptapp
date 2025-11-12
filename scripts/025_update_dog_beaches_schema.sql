-- Add new columns to dog_beaches table
ALTER TABLE dog_beaches 
ADD COLUMN IF NOT EXISTS municipality TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS nearby_accommodations_url TEXT;

-- Update existing records to extract municipality and province from name
UPDATE dog_beaches 
SET 
  municipality = CASE 
    WHEN name LIKE '%,%' THEN 
      TRIM(SPLIT_PART(SPLIT_PART(name, ',', 2), '(', 1))
    ELSE NULL
  END,
  province = CASE 
    WHEN name LIKE '%(%' THEN 
      TRIM(REPLACE(REPLACE(SPLIT_PART(name, '(', 2), ')', ''), ',', ''))
    ELSE NULL
  END;
