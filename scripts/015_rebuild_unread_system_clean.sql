-- Eliminar triggers y funciones existentes en el orden correcto
DROP TRIGGER IF EXISTS on_message_sent ON messages;
DROP TRIGGER IF EXISTS on_vote_change ON votes;
DROP FUNCTION IF EXISTS update_unread_count() CASCADE;
DROP FUNCTION IF EXISTS update_post_vote_count() CASCADE;

-- Agregar columna sender_type si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'sender_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN sender_type TEXT CHECK (sender_type IN ('user', 'shelter'));
  END IF;
END $$;

-- Rellenar sender_type para mensajes existentes
UPDATE messages m
SET sender_type = CASE
  WHEN EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = m.user_id
  ) THEN 'user'
  WHEN EXISTS (
    SELECT 1 FROM shelters s
    WHERE s.id = m.user_id
  ) THEN 'shelter'
  ELSE 'user'
END
WHERE sender_type IS NULL;

-- Agregar columnas de contador si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'unread_count_user'
  ) THEN
    ALTER TABLE chats ADD COLUMN unread_count_user INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chats' AND column_name = 'unread_count_shelter'
  ) THEN
    ALTER TABLE chats ADD COLUMN unread_count_shelter INTEGER DEFAULT 0;
  END IF;
END $$;

-- Resetear contadores existentes
UPDATE chats SET unread_count_user = 0, unread_count_shelter = 0;

-- Crear la función para actualizar contadores de mensajes no leídos
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo incrementar el contador del RECEPTOR, no del emisor
  IF NEW.sender_type = 'user' THEN
    -- Si el usuario envió el mensaje, incrementar el contador de la protectora
    UPDATE chats
    SET unread_count_shelter = unread_count_shelter + 1
    WHERE id = NEW.chat_id;
  ELSIF NEW.sender_type = 'shelter' THEN
    -- Si la protectora envió el mensaje, incrementar el contador del usuario
    UPDATE chats
    SET unread_count_user = unread_count_user + 1
    WHERE id = NEW.chat_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para mensajes
CREATE TRIGGER on_message_sent
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- Recrear la función de votos
CREATE OR REPLACE FUNCTION update_post_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET vote_count = vote_count + NEW.vote_value
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE posts
    SET vote_count = vote_count + (NEW.vote_value - OLD.vote_value)
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET vote_count = vote_count - OLD.vote_value
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger de votos
CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_vote_count();
