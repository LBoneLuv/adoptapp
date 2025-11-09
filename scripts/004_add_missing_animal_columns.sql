-- Add missing columns to animals table
ALTER TABLE animals
ADD COLUMN IF NOT EXISTS species TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS size TEXT;

-- Update the images column to be named image_url for consistency
-- First, add the new column
ALTER TABLE animals
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- If you want to migrate data from images array to image_url (taking first image)
-- UPDATE animals SET image_url = images[1] WHERE images IS NOT NULL AND array_length(images, 1) > 0;

-- Add check constraints for the new columns
ALTER TABLE animals
ADD CONSTRAINT animals_species_check CHECK (species IN ('perro', 'gato', 'otro')),
ADD CONSTRAINT animals_gender_check CHECK (gender IN ('macho', 'hembra')),
ADD CONSTRAINT animals_size_check CHECK (size IN ('pequeño', 'mediano', 'grande'));
