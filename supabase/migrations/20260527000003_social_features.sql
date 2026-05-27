-- ============================================================
-- Social Features Migration
-- Adds: home_region + onboarding_complete to profiles,
--       creator_id to contracts,
--       friendships, contract_removal_votes, waypoint_completions
-- ============================================================

-- ── profiles: add home_region + onboarding_complete ──────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_region TEXT
    CHECK (home_region IN ('New Babbage', 'Area 18', 'Orison', 'Lorville')),
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- ── contracts: track creator ──────────────────────────────────
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── friendships ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friendships (
  id           BIGSERIAL   PRIMARY KEY,
  requester_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- ── contract_removal_votes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_removal_votes (
  contract_id  UUID        NOT NULL REFERENCES public.contracts(id)  ON DELETE CASCADE,
  voter_id     UUID        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (contract_id, voter_id)
);

-- ── waypoint_completions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waypoint_completions (
  waypoint_id  UUID        NOT NULL REFERENCES public.contract_waypoints(id) ON DELETE CASCADE,
  profile_id   UUID        NOT NULL REFERENCES public.profiles(id)           ON DELETE CASCADE,
  status       TEXT        NOT NULL CHECK (status IN ('done', 'failed')),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (waypoint_id, profile_id)
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_removal_votes_contract ON public.contract_removal_votes(contract_id);
CREATE INDEX IF NOT EXISTS idx_waypoint_completions_waypoint ON public.waypoint_completions(waypoint_id);
CREATE INDEX IF NOT EXISTS idx_waypoint_completions_profile  ON public.waypoint_completions(profile_id);

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE public.friendships            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_removal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waypoint_completions   ENABLE ROW LEVEL SECURITY;

-- friendships policies
DROP POLICY IF EXISTS "friendships_select" ON public.friendships;
CREATE POLICY "friendships_select" ON public.friendships
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

DROP POLICY IF EXISTS "friendships_insert" ON public.friendships;
CREATE POLICY "friendships_insert" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "friendships_update" ON public.friendships;
CREATE POLICY "friendships_update" ON public.friendships
  FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid());

DROP POLICY IF EXISTS "friendships_delete" ON public.friendships;
CREATE POLICY "friendships_delete" ON public.friendships
  FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- contract_removal_votes policies
DROP POLICY IF EXISTS "removal_votes_select" ON public.contract_removal_votes;
CREATE POLICY "removal_votes_select" ON public.contract_removal_votes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "removal_votes_insert" ON public.contract_removal_votes;
CREATE POLICY "removal_votes_insert" ON public.contract_removal_votes
  FOR INSERT TO authenticated
  WITH CHECK (voter_id = auth.uid());

DROP POLICY IF EXISTS "removal_votes_delete" ON public.contract_removal_votes;
CREATE POLICY "removal_votes_delete" ON public.contract_removal_votes
  FOR DELETE TO authenticated
  USING (voter_id = auth.uid());

-- waypoint_completions policies
DROP POLICY IF EXISTS "waypoint_completions_select" ON public.waypoint_completions;
CREATE POLICY "waypoint_completions_select" ON public.waypoint_completions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "waypoint_completions_insert" ON public.waypoint_completions;
CREATE POLICY "waypoint_completions_insert" ON public.waypoint_completions
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "waypoint_completions_update" ON public.waypoint_completions;
CREATE POLICY "waypoint_completions_update" ON public.waypoint_completions
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "waypoint_completions_delete" ON public.waypoint_completions;
CREATE POLICY "waypoint_completions_delete" ON public.waypoint_completions
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());
