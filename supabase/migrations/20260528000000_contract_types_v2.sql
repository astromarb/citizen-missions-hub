-- Expand the contracts.type CHECK constraint to cover all four canonical
-- hauling types plus the two legacy aliases still present in older rows.
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_type_check;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_type_check
  CHECK (type IN (
    'Hauling - Direct',
    'Hauling - Interstellar',
    'Hauling - Solar',
    'Hauling - Planetary',
    -- Legacy aliases (kept for backward-compatibility with pre-v2 rows)
    'Hauling - Stellar',
    'Hauling - Local'
  ));

-- Add Ship Ammunition to the commodities reference table.
-- sort_order 42 places it after the existing 41 entries; the autocomplete
-- filters by text so position is cosmetic only.
INSERT INTO public.commodities (name, sort_order)
VALUES ('Ship Ammunition', 42)
ON CONFLICT (name) DO NOTHING;
