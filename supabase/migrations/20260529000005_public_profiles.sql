-- Allow anonymous (unauthenticated) users to read profiles for public profile links.
-- Authenticated policy remains; this adds a separate anon-read policy.
CREATE POLICY "profiles_public_select" ON public.profiles
  FOR SELECT TO anon USING (true);

-- Allow anon to read related tables needed for public session history
CREATE POLICY "sessions_public_select" ON public.sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "session_players_public_select" ON public.session_players
  FOR SELECT TO anon USING (true);

CREATE POLICY "contracts_public_select" ON public.contracts
  FOR SELECT TO anon USING (true);

CREATE POLICY "waypoints_public_select" ON public.contract_waypoints
  FOR SELECT TO anon USING (true);

CREATE POLICY "cargo_public_select" ON public.cargo_items
  FOR SELECT TO anon USING (true);
