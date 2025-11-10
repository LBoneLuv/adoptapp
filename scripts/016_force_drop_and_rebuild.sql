DROP TRIGGER IF EXISTS update_message_unread_count ON messages CASCADE;
DROP TRIGGER IF EXISTS update_post_vote_count ON votes CASCADE;
DROP FUNCTION IF EXISTS update_unread_count() CASCADE;
DROP FUNCTION IF EXISTS on_vote_change() CASCADE;

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

-- Actualizar mensajes existentes para establecer sender_type basado en user_id
UPDATE messages m
SET sender_type = CASE 
  WHEN EXISTS (
    SELECT 1 FROM chats c 
    WHERE c.id = m.chat_id 
    AND c.user_id = m.user_id
  ) THEN 'user'
  ELSE 'shelter'
END
WHERE sender_type IS NULL;

-- Crear función para actualizar contador de mensajes no leídos
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo incrementar en INSERT, no en UPDATE
  IF (TG_OP = 'INSERT') THEN
    -- Si el mensaje es del usuario, incrementar el contador de la protectora
    IF NEW.sender_type = 'user' THEN
      UPDATE chats 
      SET unread_count_shelter = unread_count_shelter + 1
      WHERE id = NEW.chat_id;
    -- Si el mensaje es de la protectora, incrementar el contador del usuario
    ELSIF NEW.sender_type = 'shelter' THEN
      UPDATE chats 
      SET unread_count_user = unread_count_user + 1
      WHERE id = NEW.chat_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para mensajes
CREATE TRIGGER update_message_unread_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- Recrear función de votos
CREATE OR REPLACE FUNCTION on_vote_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts SET vote_count = vote_count + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts SET vote_count = vote_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger de votos
CREATE TRIGGER update_post_vote_count
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION on_vote_change();

-- Resetear todos los contadores a 0 para empezar limpio
UPDATE chats SET unread_count_user = 0, unread_count_shelter = 0;
