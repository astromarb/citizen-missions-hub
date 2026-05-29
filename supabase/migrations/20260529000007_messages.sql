-- Direct messages between pilots, plus system-broadcast messages from admin
CREATE TABLE IF NOT EXISTS public.messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL, -- null = system
  recipient_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  is_system    boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  read_at      timestamptz
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Sender and recipient can read their own messages
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Admins can read all messages (needed for platform stats)
CREATE POLICY "messages_admin_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Authenticated users can insert as themselves
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Admins can insert system broadcast messages (null sender)
CREATE POLICY "messages_admin_broadcast" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    is_system = true
    AND sender_id IS NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Only the recipient can mark as read
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- Sender or recipient can permanently delete a message
CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx    ON public.messages(sender_id,    created_at DESC);
