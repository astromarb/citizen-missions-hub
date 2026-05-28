-- Add 'loading' to waypoint completion statuses.
-- Pilots can mark a pickup as "loading" (actively loading cargo at the pickup
-- location) before transitioning to en_route or picked_up.
DO $$
BEGIN
  ALTER TABLE public.waypoint_completions
    DROP CONSTRAINT IF EXISTS waypoint_completions_status_check;
  ALTER TABLE public.waypoint_completions
    ADD CONSTRAINT waypoint_completions_status_check
      CHECK (status IN ('loading', 'en_route', 'picked_up', 'done', 'failed'));
END $$;

-- Rename landing zones to their official in-game spaceport names.
-- Migration 000005 set intermediate clean names; this corrects them to the
-- verified canonical names from the Star Citizen wiki.
UPDATE public.locations SET name = 'Riker Memorial Spaceport'
  WHERE name IN ('Area18', 'Area 18 (ArcCorp)') AND body = 'ArcCorp';

UPDATE public.locations SET name = 'New Babbage Interstellar Spaceport'
  WHERE name IN ('New Babbage', 'New Babbage (MicroTech)') AND body = 'MicroTech';

UPDATE public.locations SET name = 'August Dunlow Spaceport'
  WHERE name IN ('Orison', 'Orison (Crusader)') AND body = 'Crusader';

-- Back-fill existing waypoints that stored any of the old names.
UPDATE public.contract_waypoints SET location_name = 'Riker Memorial Spaceport'
  WHERE location_name IN ('Area18', 'Area 18 (ArcCorp)');

UPDATE public.contract_waypoints SET location_name = 'New Babbage Interstellar Spaceport'
  WHERE location_name IN ('New Babbage', 'New Babbage (MicroTech)');

UPDATE public.contract_waypoints SET location_name = 'August Dunlow Spaceport'
  WHERE location_name IN ('Orison', 'Orison (Crusader)');
