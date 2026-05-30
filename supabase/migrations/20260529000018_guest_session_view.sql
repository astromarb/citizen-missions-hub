-- Allow anonymous users to read sessions by invite token (guest view)
CREATE POLICY IF NOT EXISTS "Anon guest session read by invite token"
  ON public.sessions FOR SELECT TO anon
  USING (invite_token IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Anon guest contract read"
  ON public.contracts FOR SELECT TO anon
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE invite_token IS NOT NULL)
  );

CREATE POLICY IF NOT EXISTS "Anon guest waypoint read"
  ON public.contract_waypoints FOR SELECT TO anon
  USING (
    contract_id IN (
      SELECT c.id FROM public.contracts c
      JOIN public.sessions s ON c.session_id = s.id
      WHERE s.invite_token IS NOT NULL
    )
  );

CREATE POLICY IF NOT EXISTS "Anon guest cargo read"
  ON public.cargo_items FOR SELECT TO anon
  USING (
    contract_id IN (
      SELECT c.id FROM public.contracts c
      JOIN public.sessions s ON c.session_id = s.id
      WHERE s.invite_token IS NOT NULL
    )
  );

CREATE POLICY IF NOT EXISTS "Anon guest session_players read"
  ON public.session_players FOR SELECT TO anon
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE invite_token IS NOT NULL)
  );
