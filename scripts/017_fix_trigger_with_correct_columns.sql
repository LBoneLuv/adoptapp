DROP TRIGGER IF EXISTS update_unread_on_message ON messages;
DROP TRIGGER IF EXISTS update_chat_on_message ON messages;
DROP FUNCTION IF EXISTS update_unread_count() CASCADE;
DROP FUNCTION IF EXISTS update_chat_timestamp() CASCADE;

-- Función para actualizar el contador de mensajes no leídos
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  chat_user_id UUID;
  chat_shelter_id UUID;
BEGIN
  -- Obtener user_id y shelter_id del chat
  SELECT user_id, shelter_id INTO chat_user_id, chat_shelter_id
  FROM chats
  WHERE id = NEW.chat_id;
  
  -- Si el mensaje fue enviado por el usuario, incrementar contador de la protectora
  IF NEW.sender_id = chat_user_id THEN
    UPDATE chats
    SET unread_count_shelter = unread_count_shelter + 1
    WHERE id = NEW.chat_id;
  
  -- Si el mensaje fue enviado por la protectora, incrementar contador del usuario
  ELSIF NEW.sender_id = chat_shelter_id THEN
    UPDATE chats
    SET unread_count_user = unread_count_user + 1
    WHERE id = NEW.chat_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el timestamp del último mensaje
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET 
    last_message_at = NOW(),
    last_message = NEW.content
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
CREATE TRIGGER update_unread_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

CREATE TRIGGER update_chat_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- Resetear todos los contadores a 0 para empezar limpio
UPDATE chats SET unread_count_user = 0, unread_count_shelter = 0;
