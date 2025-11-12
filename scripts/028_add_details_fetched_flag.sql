-- Agregar columna para saber si ya se hizo fetch de los detalles
ALTER TABLE dog_beaches
ADD COLUMN IF NOT EXISTS details_fetched BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photos_urls TEXT[];
