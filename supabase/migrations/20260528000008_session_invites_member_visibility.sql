-- Session members need to see all pending invites for their session so the
-- "pending bubble" UI in SessionView can render for all crew, not just the inviter.
--
-- Replaces the two narrow invitee/inviter policies with a single policy that
-- also grants read access to any session member.

DROP POLICY IF EXISTS "si_invitee_select" ON public.session_invites;
DROP POLICY IF EXISTS "si_inviter_select" ON public.session_invites;

CREATE POLICY "si_select" ON public.session_invites
  FOR SELECT TO authenticated USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.session_players
      WHERE session_id = session_invites.session_id
        AND profile_id = auth.uid()
    )
  );
