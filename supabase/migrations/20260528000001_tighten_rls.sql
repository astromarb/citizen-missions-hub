-- Tighten RLS so only session members can mutate sessions and contracts.
-- The original schema allowed any authenticated user to write to everything.

-- ── Sessions ──────────────────────────────────────────────────────────────────
-- Only members may update a session (start/pause/end, date edit).
DROP POLICY IF EXISTS "sessions_update" ON public.sessions;
CREATE POLICY "sessions_update" ON public.sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_players
      WHERE session_id = public.sessions.id
        AND profile_id  = auth.uid()
    )
  );

-- Only members may delete a session.
DROP POLICY IF EXISTS "sessions_delete" ON public.sessions;
CREATE POLICY "sessions_delete" ON public.sessions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_players
      WHERE session_id = public.sessions.id
        AND profile_id  = auth.uid()
    )
  );

-- ── session_players ────────────────────────────────────────────────────────────
-- A user may add themselves, OR an existing member may invite others.
DROP POLICY IF EXISTS "session_players_insert" ON public.session_players;
CREATE POLICY "session_players_insert" ON public.session_players
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()       -- always allowed to add yourself
    OR EXISTS (
      SELECT 1 FROM public.session_players existing
      WHERE existing.session_id = session_id
        AND existing.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id         = session_id
        AND s.created_by = auth.uid()
    )
  );

-- ── Contracts ─────────────────────────────────────────────────────────────────
-- Only session members may add contracts.
DROP POLICY IF EXISTS "contracts_insert" ON public.contracts;
CREATE POLICY "contracts_insert" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_players
      WHERE session_id = public.contracts.session_id
        AND profile_id = auth.uid()
    )
  );

-- Only session members may update contracts (toggle done, payout).
DROP POLICY IF EXISTS "contracts_update" ON public.contracts;
CREATE POLICY "contracts_update" ON public.contracts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_players
      WHERE session_id = public.contracts.session_id
        AND profile_id = auth.uid()
    )
  );

-- Only session members may delete contracts (own removal or vote threshold).
DROP POLICY IF EXISTS "contracts_delete" ON public.contracts;
CREATE POLICY "contracts_delete" ON public.contracts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_players
      WHERE session_id = public.contracts.session_id
        AND profile_id = auth.uid()
    )
  );

-- ── Contract waypoints ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "waypoints_insert" ON public.contract_waypoints;
CREATE POLICY "waypoints_insert" ON public.contract_waypoints
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN  public.session_players sp ON sp.session_id = c.session_id
      WHERE c.id             = contract_id
        AND sp.profile_id    = auth.uid()
    )
  );

DROP POLICY IF EXISTS "waypoints_update" ON public.contract_waypoints;
CREATE POLICY "waypoints_update" ON public.contract_waypoints
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN  public.session_players sp ON sp.session_id = c.session_id
      WHERE c.id             = contract_waypoints.contract_id
        AND sp.profile_id    = auth.uid()
    )
  );

DROP POLICY IF EXISTS "waypoints_delete" ON public.contract_waypoints;
CREATE POLICY "waypoints_delete" ON public.contract_waypoints
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN  public.session_players sp ON sp.session_id = c.session_id
      WHERE c.id             = contract_waypoints.contract_id
        AND sp.profile_id    = auth.uid()
    )
  );

-- ── Cargo items ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cargo_items_insert" ON public.cargo_items;
CREATE POLICY "cargo_items_insert" ON public.cargo_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN  public.session_players sp ON sp.session_id = c.session_id
      WHERE c.id             = contract_id
        AND sp.profile_id    = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cargo_items_update" ON public.cargo_items;
CREATE POLICY "cargo_items_update" ON public.cargo_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN  public.session_players sp ON sp.session_id = c.session_id
      WHERE c.id             = cargo_items.contract_id
        AND sp.profile_id    = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cargo_items_delete" ON public.cargo_items;
CREATE POLICY "cargo_items_delete" ON public.cargo_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN  public.session_players sp ON sp.session_id = c.session_id
      WHERE c.id             = cargo_items.contract_id
        AND sp.profile_id    = auth.uid()
    )
  );
