-- ============================================================================
-- 050_forum.sql
-- Foro de comunidad (tipo ForoBeta): categorías -> hilos -> respuestas.
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_last_reply ON forum_threads(last_reply_at DESC);

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS forum_categories_select ON forum_categories;
CREATE POLICY forum_categories_select ON forum_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS forum_categories_admin ON forum_categories;
CREATE POLICY forum_categories_admin ON forum_categories FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS forum_threads_select ON forum_threads;
CREATE POLICY forum_threads_select ON forum_threads FOR SELECT USING (true);
DROP POLICY IF EXISTS forum_threads_insert ON forum_threads;
CREATE POLICY forum_threads_insert ON forum_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS forum_threads_update ON forum_threads;
CREATE POLICY forum_threads_update ON forum_threads FOR UPDATE USING (auth.uid() = user_id OR is_super_admin());
DROP POLICY IF EXISTS forum_threads_delete ON forum_threads;
CREATE POLICY forum_threads_delete ON forum_threads FOR DELETE USING (auth.uid() = user_id OR is_super_admin());

DROP POLICY IF EXISTS forum_replies_select ON forum_replies;
CREATE POLICY forum_replies_select ON forum_replies FOR SELECT USING (true);
DROP POLICY IF EXISTS forum_replies_insert ON forum_replies;
CREATE POLICY forum_replies_insert ON forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS forum_replies_update ON forum_replies;
CREATE POLICY forum_replies_update ON forum_replies FOR UPDATE USING (auth.uid() = user_id OR is_super_admin());
DROP POLICY IF EXISTS forum_replies_delete ON forum_replies;
CREATE POLICY forum_replies_delete ON forum_replies FOR DELETE USING (auth.uid() = user_id OR is_super_admin());

-- ---------------------------------------------------------------------------
-- Triggers: contador de respuestas + última actividad
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION forum_reply_changed()
RETURNS TRIGGER AS $$
DECLARE t UUID := COALESCE(NEW.thread_id, OLD.thread_id);
BEGIN
  UPDATE forum_threads SET
    reply_count = (SELECT COUNT(*) FROM forum_replies WHERE thread_id = t),
    last_reply_at = COALESCE((SELECT MAX(created_at) FROM forum_replies WHERE thread_id = t), created_at)
  WHERE id = t;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forum_reply_changed ON forum_replies;
CREATE TRIGGER trg_forum_reply_changed
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION forum_reply_changed();

-- Incrementar vistas (cualquier usuario; SECURITY DEFINER salta RLS)
CREATE OR REPLACE FUNCTION forum_increment_views(p_thread UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE forum_threads SET views = views + 1 WHERE id = p_thread;
$$;

-- ---------------------------------------------------------------------------
-- Categorías iniciales
-- ---------------------------------------------------------------------------
INSERT INTO forum_categories (name, slug, description, icon, order_index) VALUES
  ('Presentaciones', 'presentaciones', 'Preséntate y conoce a la comunidad', '👋', 1),
  ('Adopción y acogida', 'adopcion', 'Experiencias, dudas y consejos sobre adoptar', '🏡', 2),
  ('Salud y veterinaria', 'salud', 'Dudas de salud, vacunas y cuidados', '🩺', 3),
  ('Adiestramiento y conducta', 'adiestramiento', 'Educación, trucos y problemas de conducta', '🎓', 4),
  ('Alimentación', 'alimentacion', 'Piensos, dietas y nutrición', '🍖', 5),
  ('Razas', 'razas', 'Todo sobre razas de perros y gatos', '🐕', 6),
  ('Off-topic', 'off-topic', 'Charla libre sobre mascotas y más', '💬', 7)
ON CONFLICT (slug) DO NOTHING;
