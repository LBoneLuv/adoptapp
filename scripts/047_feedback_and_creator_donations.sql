-- ============================================================================
-- 047_feedback_and_creator_donations.sql
-- Sugerencias/mejoras/bugs de los usuarios + donaciones al creador de la app.
-- ============================================================================

-- (1) Feedback de la app
CREATE TABLE IF NOT EXISTS app_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'sugerencia' CHECK (type IN ('sugerencia', 'mejora', 'bug')),
  message TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_feedback_insert_auth ON app_feedback;
CREATE POLICY app_feedback_insert_auth ON app_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS app_feedback_select_own_or_admin ON app_feedback;
CREATE POLICY app_feedback_select_own_or_admin ON app_feedback
  FOR SELECT USING (auth.uid() = user_id OR is_super_admin());
DROP POLICY IF EXISTS app_feedback_update_admin ON app_feedback;
CREATE POLICY app_feedback_update_admin ON app_feedback
  FOR UPDATE USING (is_super_admin());

-- (2) Donaciones al creador (mantenimiento de la app)
CREATE TABLE IF NOT EXISTS creator_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  donor_email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE creator_donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS creator_donations_insert_own ON creator_donations;
CREATE POLICY creator_donations_insert_own ON creator_donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS creator_donations_select_own_or_admin ON creator_donations;
CREATE POLICY creator_donations_select_own_or_admin ON creator_donations
  FOR SELECT USING (auth.uid() = user_id OR is_super_admin());
