-- Enable Supabase Realtime for all tables that the front-end subscribes to.
--
-- Two requirements for postgres_changes to emit UPDATE / DELETE events:
--   1. REPLICA IDENTITY FULL  — so the WAL carries the old row, letting
--      Supabase reconstruct what changed and forward it to subscribers.
--   2. The table must be in the supabase_realtime publication.
--
-- The safety DO block skips the ADD TABLE step when the publication is
-- already defined as FOR ALL TABLES (common on hosted Supabase projects
-- that use the default publication), since ALTER PUBLICATION … ADD TABLE
-- is invalid in that case.

ALTER TABLE public.sessions               REPLICA IDENTITY FULL;
ALTER TABLE public.session_players        REPLICA IDENTITY FULL;
ALTER TABLE public.contracts              REPLICA IDENTITY FULL;
ALTER TABLE public.contract_waypoints     REPLICA IDENTITY FULL;
ALTER TABLE public.waypoint_completions   REPLICA IDENTITY FULL;
ALTER TABLE public.cargo_items            REPLICA IDENTITY FULL;
ALTER TABLE public.contract_removal_votes REPLICA IDENTITY FULL;

DO $$
DECLARE
  pub_all_tables bool;
BEGIN
  SELECT puballtables INTO pub_all_tables
  FROM pg_publication
  WHERE pubname = 'supabase_realtime';

  IF pub_all_tables IS NULL THEN
    -- Publication doesn't exist yet; create it covering these tables.
    CREATE PUBLICATION supabase_realtime FOR TABLE
      public.sessions,
      public.session_players,
      public.contracts,
      public.contract_waypoints,
      public.waypoint_completions,
      public.cargo_items,
      public.contract_removal_votes;

  ELSIF NOT pub_all_tables THEN
    -- Publication exists but is table-specific; add our tables.
    ALTER PUBLICATION supabase_realtime ADD TABLE
      public.sessions,
      public.session_players,
      public.contracts,
      public.contract_waypoints,
      public.waypoint_completions,
      public.cargo_items,
      public.contract_removal_votes;

  -- ELSE: puballtables = true → FOR ALL TABLES already, nothing to do.
  END IF;
END $$;
