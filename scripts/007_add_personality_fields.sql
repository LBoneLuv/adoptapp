-- Add personality fields to animals table
ALTER TABLE public.animals
ADD COLUMN IF NOT EXISTS active_level integer DEFAULT 5 CHECK (active_level >= 0 AND active_level <= 10),
ADD COLUMN IF NOT EXISTS affectionate_level integer DEFAULT 5 CHECK (affectionate_level >= 0 AND affectionate_level <= 10),
ADD COLUMN IF NOT EXISTS sociable_level integer DEFAULT 5 CHECK (sociable_level >= 0 AND sociable_level <= 10);

COMMENT ON COLUMN public.animals.active_level IS 'Activity level from 0 (very calm) to 10 (very active)';
COMMENT ON COLUMN public.animals.affectionate_level IS 'Affection level from 0 (independent) to 10 (very affectionate)';
COMMENT ON COLUMN public.animals.sociable_level IS 'Sociability level from 0 (shy) to 10 (very sociable)';
