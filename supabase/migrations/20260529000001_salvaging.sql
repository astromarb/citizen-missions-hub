-- Extend contract type CHECK to include Salvaging
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_type_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_type_check
  CHECK (type IN (
    'Hauling - Planetary',
    'Hauling - Stellar',
    'Hauling - Interstellar',
    'Salvaging'
  ));

-- Per-contract costs for salvaging (also useful for hauling fuel/docking)
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS claim_cost    NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refining_cost NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Distinguish RMC/CMATS materials from found cargo inside wrecks
ALTER TABLE cargo_items
  ADD COLUMN IF NOT EXISTS cargo_source TEXT
    CHECK (cargo_source IN ('material', 'found'));
