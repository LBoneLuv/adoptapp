-- ============================================================================
-- 048_order_shipping.sql
-- Método y coste de envío en los pedidos.
-- ============================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method TEXT,
  ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2) DEFAULT 0;
