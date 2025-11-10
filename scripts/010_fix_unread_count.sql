-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_message_unread ON messages;
DROP FUNCTION IF EXISTS update_unread_count();

-- Remove unread_count column and recreate it
ALTER TABLE chats DROP COLUMN IF EXISTS unread_count;
ALTER TABLE chats ADD COLUMN unread_count_user INTEGER DEFAULT 0;
ALTER TABLE chats ADD COLUMN unread_count_shelter INTEGER DEFAULT 0;

-- Create function to properly update unread counts
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new message is inserted
  IF TG_OP = 'INSERT' THEN
    -- Increment the unread count for the RECIPIENT (not the sender)
    -- If sender is user, increment shelter's unread count
    -- If sender is shelter, increment user's unread count
    UPDATE chats
    SET 
      unread_count_shelter = CASE 
        WHEN NEW.sender_id = (SELECT user_id FROM chats WHERE id = NEW.chat_id) 
        THEN unread_count_shelter + 1 
        ELSE unread_count_shelter 
      END,
      unread_count_user = CASE 
        WHEN NEW.sender_id = (SELECT shelter_id FROM chats WHERE id = NEW.chat_id) 
        THEN unread_count_user + 1 
        ELSE unread_count_user 
      END
    WHERE id = NEW.chat_id;
  END IF;

  -- When a message is marked as read, decrement the count
  IF TG_OP = 'UPDATE' AND OLD.read = false AND NEW.read = true THEN
    UPDATE chats
    SET 
      unread_count_shelter = CASE 
        WHEN NEW.sender_id = (SELECT user_id FROM chats WHERE id = NEW.chat_id) 
        THEN GREATEST(0, unread_count_shelter - 1)
        ELSE unread_count_shelter 
      END,
      unread_count_user = CASE 
        WHEN NEW.sender_id = (SELECT shelter_id FROM chats WHERE id = NEW.chat_id) 
        THEN GREATEST(0, unread_count_user - 1)
        ELSE unread_count_user 
      END
    WHERE id = NEW.chat_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_message_unread
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- Initialize counts to 0
UPDATE chats SET unread_count_user = 0, unread_count_shelter = 0;
