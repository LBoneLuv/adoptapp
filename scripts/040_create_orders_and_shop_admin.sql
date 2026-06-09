-- ============================================================================
-- 040_create_orders_and_shop_admin.sql
-- Pedidos (orders + order_items) para el flujo de checkout con Stripe, y
-- políticas RLS para que el super_admin pueda gestionar el catálogo desde la app.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  shipping_name TEXT,
  shipping_email TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,          -- snapshot por si el producto cambia/desaparece
  image_url TEXT,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- helper: ¿el usuario actual es super_admin?
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Orders: el usuario ve/crea los suyos; el super_admin ve y gestiona todos.
DROP POLICY IF EXISTS orders_select_own ON orders;
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (auth.uid() = user_id OR is_super_admin());

DROP POLICY IF EXISTS orders_insert_own ON orders;
CREATE POLICY orders_insert_own ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS orders_update_admin ON orders;
CREATE POLICY orders_update_admin ON orders
  FOR UPDATE USING (is_super_admin());

DROP POLICY IF EXISTS order_items_select_own ON order_items;
CREATE POLICY order_items_select_own ON order_items
  FOR SELECT USING (
    is_super_admin()
    OR EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS order_items_insert_own ON order_items;
CREATE POLICY order_items_insert_own ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Catálogo: el super_admin puede gestionar productos, categorías y banners.
-- (Antes solo existía la política pública de SELECT.)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS shop_products_admin_all ON shop_products;
CREATE POLICY shop_products_admin_all ON shop_products
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS shop_categories_admin_all ON shop_categories;
CREATE POLICY shop_categories_admin_all ON shop_categories
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS shop_banners_admin_all ON shop_banners;
CREATE POLICY shop_banners_admin_all ON shop_banners
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

-- updated_at automático para orders
CREATE OR REPLACE FUNCTION set_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_orders_updated_at();
