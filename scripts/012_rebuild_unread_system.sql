-- Drop existing trigger and function completely
DROP TRIGGER IF EXISTS on_message_unread ON messages;
DROP FUNCTION IF EXISTS update_unread_count();

-- Create a simpler, more reliable function
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  chat_user_id UUID;
  chat_shelter_id UUID;
BEGIN
  -- Get the chat participants
  SELECT user_id, shelter_id INTO chat_user_id, chat_shelter_id
  FROM chats WHERE id = NEW.chat_id;

  -- When a new message is inserted, increment the RECEIVER's unread count
  IF TG_OP = 'INSERT' THEN
    -- Update last message info
    UPDATE chats
    SET last_message = NEW.content,
        last_message_at = NEW.created_at
    WHERE id = NEW.chat_id;
    
    -- If sender is the USER, increment SHELTER's unread count
    IF NEW.sender_id = chat_user_id THEN
      UPDATE chats
      SET unread_count_shelter = unread_count_shelter + 1
      WHERE id = NEW.chat_id;
    END IF;
    
    -- If sender is the SHELTER, increment USER's unread count
    IF NEW.sender_id = chat_shelter_id THEN
      UPDATE chats
      SET unread_count_user = unread_count_user + 1
      WHERE id = NEW.chat_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only for INSERT (we'll handle read status manually)
CREATE TRIGGER on_message_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- Reset all counters to 0
UPDATE chats SET unread_count_user = 0, unread_count_shelter = 0;

-- Recalculate unread counts based on existing unread messages
-- For users: count unread messages FROM shelter TO user
UPDATE chats c
SET unread_count_user = (
  SELECT COALESCE(COUNT(*), 0)
  FROM messages m
  WHERE m.chat_id = c.id 
    AND m.sender_id = c.shelter_id 
    AND m.read = false
);

-- For shelters: count unread messages FROM user TO shelter
UPDATE chats c
SET unread_count_shelter = (
  SELECT COALESCE(COUNT(*), 0)
  FROM messages m
  WHERE m.chat_id = c.id 
    AND m.sender_id = c.user_id 
    AND m.read = false
);
