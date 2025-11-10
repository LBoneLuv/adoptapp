-- Agregar columna sender_type a messages y corregir todo el sistema

-- 1. Agregar columna sender_type
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type text CHECK (sender_type IN ('user', 'shelter'));

-- 2. Poblar sender_type basado en los datos existentes
-- Para cada mensaje, verificar si sender_id coincide con user_id o shelter_id del chat
UPDATE messages m
SET sender_type = CASE
  WHEN m.sender_id = (SELECT c.user_id FROM chats c WHERE c.id = m.chat_id) THEN 'user'
  WHEN m.sender_id = (SELECT c.shelter_id FROM chats c WHERE c.id = m.chat_id) THEN 'shelter'
  ELSE 'user'
END
WHERE sender_type IS NULL;

-- 3. Resetear todos los contadores a 0 para empezar limpio
UPDATE chats SET unread_count_user = 0, unread_count_shelter = 0;

-- 4. Eliminar triggers y funciones anteriores
DROP TRIGGER IF EXISTS on_message_insert ON messages;
DROP FUNCTION IF EXISTS update_unread_count();

-- 5. Crear función correcta del trigger
-- LÓGICA CORRECTA:
-- - Cuando un USUARIO envía mensaje (sender_type='user'), la PROTECTORA tiene mensaje sin leer → incrementar unread_count_shelter
-- - Cuando una PROTECTORA envía mensaje (sender_type='shelter'), el USUARIO tiene mensaje sin leer → incrementar unread_count_user
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

-- 6. Crear trigger
CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- 7. Calcular contadores correctos basados en mensajes existentes
UPDATE chats c
SET unread_count_shelter = (
  SELECT COUNT(*)
  FROM messages m
  WHERE m.chat_id = c.id 
  AND m.sender_type = 'user'
  AND m.read = false
),
unread_count_user = (
  SELECT COUNT(*)
  FROM messages m
  WHERE m.chat_id = c.id 
  AND m.sender_type = 'shelter'
  AND m.read = false
);
