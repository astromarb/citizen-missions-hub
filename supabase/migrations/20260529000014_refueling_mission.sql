-- Add Refueling mission type
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_type_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_type_check
  CHECK (type IN (
    'Hauling - Planetary',
    'Hauling - Stellar',
    'Hauling - Interstellar',
    'Salvaging',
    'Refueling'
  ));
