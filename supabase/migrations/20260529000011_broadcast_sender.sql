-- Update admin broadcast policy to record which admin sent each message.
-- sender_id now stores the admin's profile ID instead of NULL,
-- allowing broadcast attribution in the admin log.

DROP POLICY IF EXISTS "messages_admin_broadcast" ON public.messages;

CREATE POLICY "messages_admin_broadcast" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    is_system = true
    AND sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
