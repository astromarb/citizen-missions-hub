-- Add broadcast_id to group all per-recipient rows of the same broadcast,
-- enabling atomic deletion of an entire broadcast from all inboxes at once.

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS broadcast_id UUID;

CREATE INDEX IF NOT EXISTS messages_broadcast_id_idx
  ON public.messages(broadcast_id)
  WHERE broadcast_id IS NOT NULL;

-- Allow admins to delete system messages (entire broadcasts via broadcast_id)
DROP POLICY IF EXISTS "messages_admin_delete_broadcast" ON public.messages;

CREATE POLICY "messages_admin_delete_broadcast" ON public.messages
  FOR DELETE TO authenticated
  USING (
    is_system = true
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
