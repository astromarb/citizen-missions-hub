-- ============================================================
-- SC Mission Board — Initial Schema
-- Run this once in: Supabase → SQL Editor → New Query → Run
-- ============================================================


-- ============================================================
-- TABLES
-- ============================================================

-- One profile per authenticated user (auto-created on first login)
CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  callsign    TEXT        NOT NULL UNIQUE,
  color       TEXT        NOT NULL DEFAULT '#8b949e',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A group play session on a specific in-game date
CREATE TABLE public.sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE        NOT NULL UNIQUE,
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which pilots were present in each session (many-to-many)
CREATE TABLE public.session_players (
  session_id  UUID  NOT NULL REFERENCES public.sessions(id)  ON DELETE CASCADE,
  profile_id  UUID  NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  PRIMARY KEY (session_id, profile_id)
);

-- A hauling contract logged within a session
CREATE TABLE public.contracts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('Hauling - Stellar', 'Hauling - Interstellar')),
  system      TEXT        NOT NULL,  -- 'Stanton', 'Pyro', 'Stanton → Pyro', etc.
  done        BOOLEAN     NOT NULL DEFAULT false,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pickup or dropoff stops (multiple per contract, ordered)
CREATE TABLE public.contract_waypoints (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID  NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  kind          TEXT  NOT NULL CHECK (kind IN ('pickup', 'dropoff')),
  body          TEXT  NOT NULL,   -- parent celestial body: 'Hurston', 'Yela', 'Deep Space'
  location_name TEXT  NOT NULL,   -- free-text: 'Brio''s Breaker Yard', 'ARC Mining 045'
  sort_order    INT   NOT NULL DEFAULT 0
);

-- Commodity line items per contract
CREATE TABLE public.cargo_items (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  UUID  NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  commodity    TEXT  NOT NULL,
  scu          INT   NOT NULL CHECK (scu > 0)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_sessions_date        ON public.sessions(date);
CREATE INDEX idx_contracts_session    ON public.contracts(session_id);
CREATE INDEX idx_waypoints_contract   ON public.contract_waypoints(contract_id, kind, sort_order);
CREATE INDEX idx_cargo_contract       ON public.cargo_items(contract_id);


-- ============================================================
-- AUTO-CREATE PROFILE ON FIRST SIGN-IN
-- Fires whenever a new row is added to auth.users (Discord login,
-- Google login, anonymous upgrade, etc.) and seeds the profile
-- using whatever the OAuth provider gives us.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, callsign, avatar_url)
  VALUES (
    NEW.id,
    -- Prefer Discord/Google display name, fall back to email prefix
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Pilot'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- All tables are locked by default; these policies open them up
-- to authenticated users as a group (tighten in a later step
-- once auth is wired up and you decide on ownership rules).
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_players   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_items       ENABLE ROW LEVEL SECURITY;

-- profiles: anyone in the group can read; only you can edit yours
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- sessions: full access for all authenticated users
CREATE POLICY "sessions_select" ON public.sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sessions_insert" ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sessions_update" ON public.sessions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sessions_delete" ON public.sessions
  FOR DELETE TO authenticated USING (true);

-- session_players
CREATE POLICY "session_players_select" ON public.session_players
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "session_players_insert" ON public.session_players
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "session_players_delete" ON public.session_players
  FOR DELETE TO authenticated USING (true);

-- contracts
CREATE POLICY "contracts_select" ON public.contracts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_insert" ON public.contracts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contracts_update" ON public.contracts
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contracts_delete" ON public.contracts
  FOR DELETE TO authenticated USING (true);

-- contract_waypoints
CREATE POLICY "waypoints_select" ON public.contract_waypoints
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "waypoints_insert" ON public.contract_waypoints
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "waypoints_update" ON public.contract_waypoints
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "waypoints_delete" ON public.contract_waypoints
  FOR DELETE TO authenticated USING (true);

-- cargo_items
CREATE POLICY "cargo_select" ON public.cargo_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cargo_insert" ON public.cargo_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cargo_delete" ON public.cargo_items
  FOR DELETE TO authenticated USING (true);
