-- Fix votes RLS policies to allow proper voting
DROP POLICY IF EXISTS "votes_select_all" ON public.votes;
DROP POLICY IF EXISTS "votes_insert_own" ON public.votes;
DROP POLICY IF EXISTS "votes_delete_own" ON public.votes;
DROP POLICY IF EXISTS "votes_update_own" ON public.votes;

CREATE POLICY "votes_select_all"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "votes_insert_own"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "votes_update_own"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "votes_delete_own"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  animal_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, shelter_id, animal_id)
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chats_select_own"
  ON public.chats FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = shelter_id);

CREATE POLICY "chats_insert_participants"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = shelter_id);

CREATE POLICY "chats_update_participants"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = shelter_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_chat_participants"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user_id = auth.uid() OR chats.shelter_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_chat_participants"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user_id = auth.uid() OR chats.shelter_id = auth.uid())
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_shelter_id ON public.chats(shelter_id);

-- Create function to update last_message in chats
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_message
DROP TRIGGER IF EXISTS trigger_update_chat_last_message ON public.messages;
CREATE TRIGGER trigger_update_chat_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message();
