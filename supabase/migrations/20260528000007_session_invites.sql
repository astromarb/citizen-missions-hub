-- Session invite tokens and targeted invite system.
--
-- invite_token: short hex slug shared in links (?join=TOKEN)
-- session_invites: tracks targeted in-app invites so invitees can accept/decline
--   from their Requests tab.

-- ── invite_token on sessions ──────────────────────────────────────────────────
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE
    DEFAULT encode(gen_random_bytes(8), 'hex');

UPDATE public.sessions
  SET invite_token = encode(gen_random_bytes(8), 'hex')
  WHERE invite_token IS NULL;

ALTER TABLE public.sessions
  ALTER COLUMN invite_token SET NOT NULL;

-- ── RPC: look up a session by token (SECURITY DEFINER bypasses member-only RLS)
CREATE OR REPLACE FUNCTION public.get_session_preview_by_token(p_token TEXT)
RETURNS TABLE (
  session_id    UUID,
  session_date  TEXT,
  creator_callsign TEXT,
  member_count  BIGINT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    s.id,
    s.date,
    p.callsign,
    COUNT(sp.profile_id)
  FROM public.sessions s
  LEFT JOIN public.profiles p ON p.id = s.created_by
  LEFT JOIN public.session_players sp ON sp.session_id = s.id
  WHERE s.invite_token = p_token
  GROUP BY s.id, s.date, p.callsign;
$$;

GRANT EXECUTE ON FUNCTION public.get_session_preview_by_token(TEXT) TO authenticated;

-- ── session_invites table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_invites (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  inviter_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, invitee_id)
);

ALTER TABLE public.session_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_invites REPLICA IDENTITY FULL;

-- Invitee sees their own pending invites
DROP POLICY IF EXISTS "si_invitee_select" ON public.session_invites;
CREATE POLICY "si_invitee_select" ON public.session_invites
  FOR SELECT TO authenticated USING (invitee_id = auth.uid());

-- Inviter sees invites they sent (to know if accepted/declined)
DROP POLICY IF EXISTS "si_inviter_select" ON public.session_invites;
CREATE POLICY "si_inviter_select" ON public.session_invites
  FOR SELECT TO authenticated USING (inviter_id = auth.uid());

-- Session members can create invites
DROP POLICY IF EXISTS "si_insert" ON public.session_invites;
CREATE POLICY "si_insert" ON public.session_invites
  FOR INSERT TO authenticated WITH CHECK (
    inviter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.session_players
      WHERE session_id = session_invites.session_id
        AND profile_id = auth.uid()
    )
  );

-- Invitee can accept or decline
DROP POLICY IF EXISTS "si_update" ON public.session_invites;
CREATE POLICY "si_update" ON public.session_invites
  FOR UPDATE TO authenticated USING (invitee_id = auth.uid());

-- Either party can remove (cancel invite / clear notification)
DROP POLICY IF EXISTS "si_delete" ON public.session_invites;
CREATE POLICY "si_delete" ON public.session_invites
  FOR DELETE TO authenticated USING (
    inviter_id = auth.uid() OR invitee_id = auth.uid()
  );

-- ── Realtime ──────────────────────────────────────────────────────────────────
DO $$
DECLARE pub_all_tables bool;
BEGIN
  SELECT puballtables INTO pub_all_tables
  FROM pg_publication WHERE pubname = 'supabase_realtime';
  IF pub_all_tables IS NULL THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE public.session_invites;
  ELSIF NOT pub_all_tables THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_invites;
  END IF;
END $$;
