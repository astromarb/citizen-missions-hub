-- Add 'en_route' as a valid waypoint completion status.
-- Drops the existing CHECK constraint (if any) and recreates it with the
-- expanded set so pilots can mark a pickup leg as in-transit before
-- confirming the pickup itself.

ALTER TABLE public.waypoint_completions
  DROP CONSTRAINT IF EXISTS waypoint_completions_status_check;

ALTER TABLE public.waypoint_completions
  ADD CONSTRAINT waypoint_completions_status_check
  CHECK (status IN ('en_route', 'picked_up', 'done', 'failed'));
