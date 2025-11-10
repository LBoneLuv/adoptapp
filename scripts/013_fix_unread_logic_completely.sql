-- Corregir completamente la lógica de contadores de mensajes no leídos
-- Problema: el trigger incrementa el contador equivocado

-- Primero, resetear todos los contadores a 0
UPDATE chats SET unread_count_user = 0, unread_count_shelter = 0;

-- Eliminar el trigger anterior
DROP TRIGGER IF EXISTS on_message_insert ON messages;
DROP FUNCTION IF EXISTS update_unread_count();

-- Crear función corregida
-- LÓGICA: Cuando se inserta un mensaje
-- - Si sender_type = 'user', significa que el USUARIO envió el mensaje → incrementar unread_count_SHELTER (porque la protectora no lo ha leído)
-- - Si sender_type = 'shelter', significa que la PROTECTORA envió el mensaje → incrementar unread_count_USER (porque el usuario no lo ha leído)
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario envió el mensaje, incrementar contador de la protectora
  IF NEW.sender_type = 'user' THEN
    UPDATE chats
    SET unread_count_shelter = unread_count_shelter + 1,
        last_message = NEW.content,
        last_message_at = NEW.created_at
    WHERE id = NEW.chat_id;
  
  -- Si la protectora envió el mensaje, incrementar contador del usuario
  ELSIF NEW.sender_type = 'shelter' THEN
    UPDATE chats
    SET unread_count_user = unread_count_user + 1,
        last_message = NEW.content,
        last_message_at = NEW.created_at
    WHERE id = NEW.chat_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();
