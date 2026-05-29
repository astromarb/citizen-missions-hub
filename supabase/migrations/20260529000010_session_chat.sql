-- Session-scoped chat messages.
-- Only session members can read or write. Active/archived enforcement is client-side.

CREATE TABLE public.session_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL REFERENCES public.sessions(id)  ON DELETE CASCADE,
  sender_id   uuid        NOT NULL REFERENCES public.profiles(id),
  content     text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.session_messages (session_id, created_at);

ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages REPLICA IDENTITY FULL;

-- Session members can read all messages in their sessions
CREATE POLICY "session_messages_select" ON public.session_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_players sp
      WHERE sp.session_id = session_messages.session_id
        AND sp.profile_id = auth.uid()
    )
  );

-- Members can post their own messages
CREATE POLICY "session_messages_insert" ON public.session_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.session_players sp
      WHERE sp.session_id = session_messages.session_id
        AND sp.profile_id = auth.uid()
    )
  );

-- Sender can delete their own messages
CREATE POLICY "session_messages_delete" ON public.session_messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- Admins can read all session messages
CREATE POLICY "session_messages_admin_select" ON public.session_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'session_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
  END IF;
END $$;
