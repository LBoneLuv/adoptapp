-- ============================================================================
-- 041_create_professional_reviews.sql
-- Reseñas de usuarios para los profesionales. Recalcula automáticamente
-- professionals.rating y professionals.reviews_count.
-- ============================================================================

CREATE TABLE IF NOT EXISTS professional_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (professional_id, user_id)        -- una reseña por usuario y profesional
);

CREATE INDEX IF NOT EXISTS idx_prof_reviews_professional ON professional_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_reviews_user ON professional_reviews(user_id);

ALTER TABLE professional_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prof_reviews_select_all ON professional_reviews;
CREATE POLICY prof_reviews_select_all ON professional_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS prof_reviews_insert_own ON professional_reviews;
CREATE POLICY prof_reviews_insert_own ON professional_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS prof_reviews_update_own ON professional_reviews;
CREATE POLICY prof_reviews_update_own ON professional_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS prof_reviews_delete_own ON professional_reviews;
CREATE POLICY prof_reviews_delete_own ON professional_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Recalcular rating + reviews_count del profesional tras cada cambio
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_professional_rating()
RETURNS TRIGGER AS $$
DECLARE
  target UUID := COALESCE(NEW.professional_id, OLD.professional_id);
BEGIN
  UPDATE professionals p
  SET
    rating = ROUND((SELECT AVG(rating)::numeric FROM professional_reviews WHERE professional_id = target), 1),
    reviews_count = (SELECT COUNT(*) FROM professional_reviews WHERE professional_id = target)
  WHERE p.id = target;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_professional_rating ON professional_reviews;
CREATE TRIGGER trg_refresh_professional_rating
  AFTER INSERT OR UPDATE OR DELETE ON professional_reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_professional_rating();

-- updated_at automático
CREATE OR REPLACE FUNCTION set_prof_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prof_reviews_updated_at ON professional_reviews;
CREATE TRIGGER trg_prof_reviews_updated_at
  BEFORE UPDATE ON professional_reviews
  FOR EACH ROW EXECUTE FUNCTION set_prof_reviews_updated_at();
