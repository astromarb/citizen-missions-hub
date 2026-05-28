-- Consolidate hauling contract types to exactly three canonical values:
--   Hauling - Planetary    (all waypoints on the same celestial body)
--   Hauling - Stellar      (same star system, different bodies)
--   Hauling - Interstellar (different star systems)
--
-- "LOCAL" becomes a derived UI tag (same body = local), not a stored type.
-- Migrate any existing rows using the old names to their canonical equivalents.

UPDATE public.contracts
  SET type = 'Hauling - Stellar'
  WHERE type IN ('Hauling - Direct', 'Hauling - Solar');

UPDATE public.contracts
  SET type = 'Hauling - Planetary'
  WHERE type = 'Hauling - Local';

-- Tighten the CHECK to the three canonical types only
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_type_check;
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_type_check
    CHECK (type IN (
      'Hauling - Planetary',
      'Hauling - Stellar',
      'Hauling - Interstellar'
    ));
