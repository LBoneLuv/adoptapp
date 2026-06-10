-- ============================================================================
-- 046_coupons_and_order_discounts.sql
-- Cupones de descuento + columnas de descuento en pedidos.
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order NUMERIC(10, 2) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER,            -- NULL = ilimitado
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Lectura de cupones activos (para validar el código en el carrito).
DROP POLICY IF EXISTS coupons_select_active ON coupons;
CREATE POLICY coupons_select_active ON coupons
  FOR SELECT USING (active = true OR is_super_admin());

-- Gestión completa para el super_admin.
DROP POLICY IF EXISTS coupons_admin_all ON coupons;
CREATE POLICY coupons_admin_all ON coupons
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE OR REPLACE FUNCTION set_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION set_coupons_updated_at();

-- Descuento aplicado en cada pedido
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0;
