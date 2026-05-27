-- ============================================================
-- Session Tracking v5 — payout, timer, waypoint picked_up
-- ============================================================

-- Payout field on contracts (aUEC)
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payout NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Session timer tracking
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS started_at  TIMESTAMPTZ;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS paused_at   TIMESTAMPTZ;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS total_paused_ms BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ended_at    TIMESTAMPTZ;

-- Extend waypoint status to include 'picked_up' (orange in-transit state)
ALTER TABLE public.waypoint_completions
  DROP CONSTRAINT IF EXISTS waypoint_completions_status_check;
ALTER TABLE public.waypoint_completions
  ADD CONSTRAINT waypoint_completions_status_check
  CHECK (status IN ('done', 'failed', 'picked_up'));
