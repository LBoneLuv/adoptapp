-- ============================================================================
-- 049_user_addresses.sql
-- Libreta de direcciones del usuario (varias direcciones de envío).
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT,                       -- "Casa", "Trabajo"...
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_addresses_select_own ON user_addresses;
CREATE POLICY user_addresses_select_own ON user_addresses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_addresses_insert_own ON user_addresses;
CREATE POLICY user_addresses_insert_own ON user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS user_addresses_update_own ON user_addresses;
CREATE POLICY user_addresses_update_own ON user_addresses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_addresses_delete_own ON user_addresses;
CREATE POLICY user_addresses_delete_own ON user_addresses FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_user_addresses_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER trg_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION set_user_addresses_updated_at();
