-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_message_unread ON messages;
DROP FUNCTION IF EXISTS update_unread_count();

-- Create improved function to update unread counts
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  chat_user_id UUID;
  chat_shelter_id UUID;
BEGIN
  -- Get the chat participants
  SELECT user_id, shelter_id INTO chat_user_id, chat_shelter_id
  FROM chats WHERE id = NEW.chat_id;

  -- When a new message is inserted
  IF TG_OP = 'INSERT' THEN
    -- If sender is the user, increment shelter's unread count
    IF NEW.sender_id = chat_user_id THEN
      UPDATE chats
      SET unread_count_shelter = unread_count_shelter + 1,
          last_message = NEW.content,
          last_message_at = NEW.created_at
      WHERE id = NEW.chat_id;
    -- If sender is the shelter, increment user's unread count
    ELSIF NEW.sender_id = chat_shelter_id THEN
      UPDATE chats
      SET unread_count_user = unread_count_user + 1,
          last_message = NEW.content,
          last_message_at = NEW.created_at
      WHERE id = NEW.chat_id;
    END IF;
  END IF;

  -- When a message is marked as read, decrement the appropriate count
  IF TG_OP = 'UPDATE' AND OLD.read = false AND NEW.read = true THEN
    -- If message was from user, decrement shelter's count
    IF NEW.sender_id = chat_user_id THEN
      UPDATE chats
      SET unread_count_shelter = GREATEST(0, unread_count_shelter - 1)
      WHERE id = NEW.chat_id;
    -- If message was from shelter, decrement user's count
    ELSIF NEW.sender_id = chat_shelter_id THEN
      UPDATE chats
      SET unread_count_user = GREATEST(0, unread_count_user - 1)
      WHERE id = NEW.chat_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_message_unread
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- Reset all unread counts to calculate them correctly from existing messages
UPDATE chats SET unread_count_user = 0, unread_count_shelter = 0;

-- Recalculate unread counts for users
UPDATE chats c
SET unread_count_user = (
  SELECT COUNT(*)
  FROM messages m
  WHERE m.chat_id = c.id 
    AND m.sender_id = c.shelter_id 
    AND m.read = false
);

-- Recalculate unread counts for shelters
UPDATE chats c
SET unread_count_shelter = (
  SELECT COUNT(*)
  FROM messages m
  WHERE m.chat_id = c.id 
    AND m.sender_id = c.user_id 
    AND m.read = false
);
