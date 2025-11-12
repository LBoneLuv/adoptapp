-- Añadiendo columnas para información detallada de las playas
ALTER TABLE dog_beaches
ADD COLUMN IF NOT EXISTS how_to_get TEXT,
ADD COLUMN IF NOT EXISTS rules TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[],
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Actualizando URLs de imágenes para quitar el 150x150 y obtener alta resolución
UPDATE dog_beaches
SET image_url = REPLACE(image_url, '-150x150', '')
WHERE image_url LIKE '%150x150%';
