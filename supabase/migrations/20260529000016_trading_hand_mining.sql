-- Add Hand Mining + Trading contract types; add per-item buy/sell price to cargo_items

-- 1. Widen the type constraint to include new contract types
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_type_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_type_check
  CHECK (type IN (
    'Hauling - Planetary',
    'Hauling - Stellar',
    'Hauling - Interstellar',
    'Salvaging',
    'Refueling',
    'Hand Mining',
    'Trading'
  ));

-- 2. Per-item buy/sell price tracking (Trading contracts)
--    buy_price  = aUEC paid per SCU when buying
--    sell_price = aUEC received per SCU when selling (0 until sold)
ALTER TABLE public.cargo_items ADD COLUMN IF NOT EXISTS buy_price  numeric NOT NULL DEFAULT 0;
ALTER TABLE public.cargo_items ADD COLUMN IF NOT EXISTS sell_price numeric NOT NULL DEFAULT 0;
