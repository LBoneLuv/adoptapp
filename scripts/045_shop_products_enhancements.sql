-- ============================================================================
-- 045_shop_products_enhancements.sql
-- Galería, ofertas, reseñas y favoritos para los productos de la tienda.
-- ============================================================================

-- (1) Nuevos campos del producto
ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10, 2),   -- precio anterior (tachado)
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1),
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- (2) Reseñas de producto
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES shop_products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_reviews_select_all ON product_reviews;
CREATE POLICY product_reviews_select_all ON product_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS product_reviews_insert_own ON product_reviews;
CREATE POLICY product_reviews_insert_own ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS product_reviews_update_own ON product_reviews;
CREATE POLICY product_reviews_update_own ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS product_reviews_delete_own ON product_reviews;
CREATE POLICY product_reviews_delete_own ON product_reviews FOR DELETE USING (auth.uid() = user_id);

-- Recalcular rating + reviews_count del producto tras cada cambio
CREATE OR REPLACE FUNCTION refresh_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target UUID := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE shop_products p SET
    rating = ROUND((SELECT AVG(rating)::numeric FROM product_reviews WHERE product_id = target), 1),
    reviews_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = target)
  WHERE p.id = target;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_product_rating ON product_reviews;
CREATE TRIGGER trg_refresh_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_product_rating();

-- (3) Favoritos de producto
CREATE TABLE IF NOT EXISTS product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES shop_products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_product_favorites_user ON product_favorites(user_id);

ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_favorites_select_own ON product_favorites;
CREATE POLICY product_favorites_select_own ON product_favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS product_favorites_insert_own ON product_favorites;
CREATE POLICY product_favorites_insert_own ON product_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS product_favorites_delete_own ON product_favorites;
CREATE POLICY product_favorites_delete_own ON product_favorites FOR DELETE USING (auth.uid() = user_id);
