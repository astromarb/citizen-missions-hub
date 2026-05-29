-- Security-definer helper: check admin status without causing recursive RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles: admins can read all rows and update any row
DROP POLICY IF EXISTS "admin_read_profiles"       ON profiles;
DROP POLICY IF EXISTS "admin_update_any_profile"  ON profiles;

CREATE POLICY "admin_read_profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admin_update_any_profile" ON profiles
  FOR UPDATE USING (public.is_admin());

-- Sessions, players, contracts, cargo: admins can read everything
DROP POLICY IF EXISTS "admin_read_sessions"        ON sessions;
DROP POLICY IF EXISTS "admin_read_session_players" ON session_players;
DROP POLICY IF EXISTS "admin_read_contracts"       ON contracts;
DROP POLICY IF EXISTS "admin_read_cargo_items"     ON cargo_items;

CREATE POLICY "admin_read_sessions" ON sessions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admin_read_session_players" ON session_players
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admin_read_contracts" ON contracts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admin_read_cargo_items" ON cargo_items
  FOR SELECT USING (public.is_admin());
