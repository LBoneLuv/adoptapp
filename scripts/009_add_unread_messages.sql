-- Add unread_count to chats table for quick access
ALTER TABLE chats ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Create function to update unread count for messages
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Fixed to only count unread messages from the other participant
  IF TG_OP = 'INSERT' THEN
    -- Get chat info to determine who should see this as unread
    DECLARE
      chat_record RECORD;
    BEGIN
      SELECT user_id, shelter_id INTO chat_record
      FROM chats
      WHERE id = NEW.chat_id;
      
      -- Only increment if message is from the other party
      -- Messages from shelter increment user's unread, messages from user increment shelter's unread
      UPDATE chats
      SET unread_count = unread_count + 1
      WHERE id = NEW.chat_id;
    END;
  END IF;

  -- When messages are marked as read, recalculate unread_count
  IF TG_OP = 'UPDATE' AND OLD.read = false AND NEW.read = true THEN
    UPDATE chats
    SET unread_count = (
      SELECT COUNT(*)
      FROM messages
      WHERE chat_id = NEW.chat_id AND read = false
    )
    WHERE id = NEW.chat_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for unread messages
DROP TRIGGER IF EXISTS on_message_unread ON messages;
CREATE TRIGGER on_message_unread
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- Initialize unread_count for existing chats to 0 (we'll recalculate properly in the app)
UPDATE chats SET unread_count = 0;
