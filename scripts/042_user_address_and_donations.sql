-- ============================================================================
-- 042_user_address_and_donations.sql
-- (1) Datos de envío en el perfil del usuario (para autocompletar la tienda).
-- (2) Donaciones a protectoras.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- (1) Dirección de envío en profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- ---------------------------------------------------------------------------
-- (2) Donaciones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  donor_name TEXT,
  donor_email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_shelter ON donations(shelter_id);
CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_session ON donations(stripe_session_id);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- El donante, la protectora receptora o el super_admin pueden ver la donación.
DROP POLICY IF EXISTS donations_select_related ON donations;
CREATE POLICY donations_select_related ON donations
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = shelter_id            -- shelters.id == auth.users.id de la protectora
    OR is_super_admin()
  );

-- Cualquier usuario autenticado puede crear su donación.
DROP POLICY IF EXISTS donations_insert_own ON donations;
CREATE POLICY donations_insert_own ON donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- updated_at automático
CREATE OR REPLACE FUNCTION set_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_donations_updated_at ON donations;
CREATE TRIGGER trg_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION set_donations_updated_at();
