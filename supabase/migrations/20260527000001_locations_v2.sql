-- ============================================================
-- SC Mission Board — Locations v2 / Reference Data Enhancement
-- Run AFTER: 20260527000000_reference_tables.sql
-- Idempotent: safe to re-run (IF NOT EXISTS + ON CONFLICT)
-- Does NOT wipe existing sessions/contracts/cargo data.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION 1: Add metadata columns to locations
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS location_type        TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS is_active            BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS is_trade_terminal    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS is_freight_elevator  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS confidence           TEXT    NOT NULL DEFAULT 'community-sourced';
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS notes                TEXT;

-- ─────────────────────────────────────────────────────────────
-- SECTION 2: Data corrections (run before constraint change)
-- ─────────────────────────────────────────────────────────────

-- Shubin SM0-22 was seeded under Daymar; correct body is MicroTech
UPDATE public.locations
SET body = 'MicroTech', notes = 'Corrected: seeded under Daymar, belongs to MicroTech'
WHERE system = 'Stanton' AND body = 'Daymar' AND name = 'Shubin Mining SM0-22';

-- Brio's Breaker Yard was seeded under Hurston planet; correct body is Daymar
UPDATE public.locations
SET body = 'Daymar', notes = 'Corrected: seeded under Hurston, belongs to Daymar'
WHERE system = 'Stanton' AND body = 'Hurston' AND name = 'Brio''s Breaker Yard';

-- Security Post Kareah orbits Cellin, not on Aberdeen surface
UPDATE public.locations
SET body = 'Cellin Orbit', notes = 'Orbits Cellin; was incorrectly filed under Aberdeen'
WHERE system = 'Stanton' AND body = 'Aberdeen' AND name = 'Security Post Kareah';

-- ICC ScanHub Stanton: decommissioned in current patch
UPDATE public.locations
SET is_active = false, notes = 'Decommissioned — not present in current game version'
WHERE system = 'Stanton' AND name = 'ICC ScanHub Stanton';

-- Normalize ArcCorp Mining Area names and move to correct body (Lyria moon)
UPDATE public.locations
SET name = 'ArcCorp Mining Area 045', body = 'Lyria', location_type = 'mining-outpost'
WHERE system = 'Stanton' AND name = 'ARC Mining 045';

UPDATE public.locations
SET name = 'ArcCorp Mining Area 056', body = 'Lyria', location_type = 'mining-outpost'
WHERE system = 'Stanton' AND name = 'ARC Mining 056';

UPDATE public.locations
SET name = 'ArcCorp Mining Area 061', body = 'Lyria', location_type = 'mining-outpost'
WHERE system = 'Stanton' AND name = 'ARC Mining 061';

-- ─────────────────────────────────────────────────────────────
-- SECTION 3: Fix uniqueness constraint
-- Old: UNIQUE (system, name)  →  New: UNIQUE (system, body, name)
-- ─────────────────────────────────────────────────────────────

-- Remove any duplicates on (system, body, name) keeping lowest id
DELETE FROM public.locations
WHERE id NOT IN (
  SELECT MIN(id) FROM public.locations GROUP BY system, body, name
);

-- Drop old constraint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class     t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'locations_system_name_key'
      AND n.nspname = 'public' AND t.relname = 'locations'
  ) THEN
    ALTER TABLE public.locations DROP CONSTRAINT locations_system_name_key;
  END IF;
END $$;

-- Add new constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class     t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'locations_system_body_name_key'
      AND n.nspname = 'public' AND t.relname = 'locations'
  ) THEN
    ALTER TABLE public.locations
      ADD CONSTRAINT locations_system_body_name_key UNIQUE (system, body, name);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- SECTION 4: location_aliases table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.location_aliases (
  id          BIGSERIAL PRIMARY KEY,
  location_id BIGINT    NOT NULL REFERENCES public.locations (id) ON DELETE CASCADE,
  alias       TEXT      NOT NULL,
  UNIQUE (location_id, alias)
);

ALTER TABLE public.location_aliases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "aliases_select" ON public.location_aliases
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "aliases_insert" ON public.location_aliases
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "aliases_update" ON public.location_aliases
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "aliases_delete" ON public.location_aliases
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- SECTION 5: Location upserts with full metadata
-- Columns: system, body, name, sort_order,
--          location_type, is_active, is_trade_terminal,
--          is_freight_elevator, confidence, notes
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.locations
  (system, body, name, sort_order,
   location_type, is_active, is_trade_terminal, is_freight_elevator, confidence, notes)
VALUES

-- ── Stanton / ArcCorp (planet) ────────────────────────────────
('Stanton','ArcCorp','Area 18 (ArcCorp)',                  1,'city',            true, true,  true,  'verified',          NULL),
('Stanton','ArcCorp','ARC-L1 Wide Forest Station',         2,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','ArcCorp','ARC-L2 Lively Pathway Station',      3,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','ArcCorp','ARC-L3 Modern Express Station',      4,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','ArcCorp','ARC-L4 Faint Glen Station',          5,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','ArcCorp','ARC-L5 Yellow Core Station',         6,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','ArcCorp','Baijini Point',                      7,'station',         true, true,  true,  'verified',          NULL),

-- ── Stanton / Lyria (ArcCorp moon) ───────────────────────────
('Stanton','Lyria','Lyria',                                1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Lyria','ArcCorp Mining Area 045',              2,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Lyria','ArcCorp Mining Area 056',              3,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Lyria','ArcCorp Mining Area 061',              4,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Lyria','ArcCorp Mining Area 157',              5,'mining-outpost',  true, false, true,  'community-sourced', NULL),

-- ── Stanton / Wala (ArcCorp moon) ────────────────────────────
('Stanton','Wala','Wala',                                  1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Wala','ICC ScanHub Stanton',                   2,'scanHub',         false,false, false, 'verified',          'Decommissioned — not present in current game version'),
('Stanton','Wala','ArcCorp Mining Area 141',               3,'mining-outpost',  true, false, true,  'community-sourced', NULL),

-- ── Stanton / Hurston (planet) ───────────────────────────────
('Stanton','Hurston','Lorville (Hurston)',                  1,'city',            true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L1 Green Glade Station',         2,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L2 Faithful Dream Station',      3,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L3 Thundering Express Station',  4,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L4 Melodic Fields Station',      5,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L5 High Course Station',         6,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','Everus Harbor',                      7,'station',         true, true,  true,  'verified',          NULL),
('Stanton','Hurston','Reclamation & Disposal Orinth',      9,'facility',        true, false, false, 'verified',          NULL),
('Stanton','Hurston','Attritus OLP',                      10,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Hurston','Vivere OLP',                        11,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Hurston','Lamina OLP',                        12,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Hurston','Ruptura OLP',                       13,'outpost',         true, false, false, 'community-sourced', NULL),

-- ── Stanton / Arial (Hurston moon) ───────────────────────────
('Stanton','Arial','Arial',                                1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Arial','HDMS-Anderson',                        2,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Arial','HDMS-Bezdek',                          3,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Arial','HDMS-Hadley',                          4,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Arial','HDMS-Norgaard',                        5,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Arial','HDMS-Woodruff',                        6,'mining-outpost',  true, false, true,  'community-sourced', NULL),

-- ── Stanton / Magda (Hurston moon) ───────────────────────────
('Stanton','Magda','Magda',                                1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Magda','HDMS-Oparei',                          2,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Magda','HDMS-Pinewood',                        3,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Magda','HDMS-Ryder',                           4,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Magda','HDMS-Stanhope',                        5,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Magda','HDMS-Thedus',                          6,'mining-outpost',  true, false, true,  'community-sourced', NULL),

-- ── Stanton / Aberdeen (Hurston moon) ────────────────────────
('Stanton','Aberdeen','Aberdeen',                           1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Aberdeen','Green Imperial Housing Exchange',    2,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Aberdeen','Shubin Interstellar SAL-2',         3,'mining-outpost',  true, false, false, 'community-sourced', NULL),

-- ── Stanton / Ita (Hurston moon) ─────────────────────────────
('Stanton','Ita','Ita',                                    1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Ita','HDMS-Edmond',                            2,'mining-outpost',  true, false, true,  'community-sourced', NULL),

-- ── Stanton / Crusader (gas giant) ───────────────────────────
('Stanton','Crusader','Orison (Crusader)',                  1,'city',            true, true,  true,  'verified',          NULL),
('Stanton','Crusader','CRU-L1 Ambitious Dream Station',    2,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Crusader','CRU-L4 Shallow Fields Station',     3,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Crusader','CRU-L5 Beautiful Glen Station',     4,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Crusader','Seraphim Station',                  5,'station',         true, true,  true,  'verified',          NULL),

-- ── Stanton / Cellin (Crusader moon) ─────────────────────────
('Stanton','Cellin','Cellin',                              1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Cellin','Gallete Family Farms',                2,'settlement',      true, false, false, 'community-sourced', NULL),
('Stanton','Cellin','Klescher Rehabilitation Facility',    3,'facility',        true, false, false, 'verified',          'Prison facility'),
('Stanton','Cellin','Nuen Waste Management',               4,'facility',        true, false, false, 'community-sourced', NULL),
('Stanton','Cellin','Wick & Morley Fuel Terminal',         5,'fuel-station',    true, true,  false, 'community-sourced', NULL),
('Stanton','Cellin','Shady Glen Farms',                    6,'settlement',      true, false, false, 'community-sourced', NULL),
('Stanton','Cellin','Terra Mills HydroFarm',               7,'settlement',      true, false, false, 'community-sourced', NULL),
('Stanton','Cellin','Hickes Research Outpost',             8,'research',        true, false, false, 'community-sourced', NULL),
('Stanton','Cellin','Shubin Mining Facility SCD-1',        9,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Cellin','Security Post Aquila',               10,'security-post',   true, false, false, 'community-sourced', NULL),

-- ── Stanton / Cellin Orbit ────────────────────────────────────
-- Security Post Kareah moved here from Aberdeen via UPDATE above
('Stanton','Cellin Orbit','Security Post Kareah',          1,'security-post',   true, false, false, 'community-sourced', 'Orbital installation; corrected from Aberdeen'),

-- ── Stanton / Daymar (Crusader moon) ─────────────────────────
('Stanton','Daymar','Daymar',                              1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Daymar','Brio''s Breaker Yard',                2,'salvage',         true, false, false, 'community-sourced', 'Corrected: was seeded under Hurston'),
('Stanton','Daymar','Kudre Ore',                           3,'mining-outpost',  true, false, false, 'community-sourced', NULL),
('Stanton','Daymar','ArcCorp Mining Area 141',             4,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Daymar','Shubin Mining Facility SMO-10',       5,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Daymar','Shubin Mining Facility SMO-18',       6,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Daymar','Bud''s Growery',                      7,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Daymar','Covalex Shipping Hub',                8,'facility',        false,false, false, 'community-sourced', 'Derelict — not a viable cargo destination'),

-- ── Stanton / Yela (Crusader moon) ───────────────────────────
('Stanton','Yela','Yela',                                  1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Yela','Grim HEX',                              2,'station',         true, true,  false, 'verified',          'Outlaw-aligned station'),
('Stanton','Yela','INS Jericho',                           3,'station',         true, false, false, 'community-sourced', NULL),
('Stanton','Yela','Deakins Research Outpost',              4,'research',        true, false, false, 'community-sourced', NULL),
('Stanton','Yela','Miles Eco',                             5,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Yela','Nuen Waste Management',                 6,'facility',        true, false, false, 'community-sourced', 'Yela installation; separate from Cellin location'),
('Stanton','Yela','Jumptown',                              7,'outpost',         true, false, false, 'community-sourced', 'Drug lab; not a standard cargo terminal'),

-- ── Stanton / MicroTech (planet) ─────────────────────────────
('Stanton','MicroTech','New Babbage (MicroTech)',           1,'city',            true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L1 Shallow Frontier Station',  2,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L2 Long Forest Station',       3,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L3 Endless Odyssey Station',   4,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L4 Red Crossroads Station',    5,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L5 Modern Icarus Station',     6,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','Port Tressler',                    7,'station',         true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','RAYARI Cantwell Research Outpost', 8,'research',        true, false, false, 'verified',          NULL),
('Stanton','MicroTech','RAYARI McGrath Research Outpost',  9,'research',        true, false, false, 'verified',          NULL),
('Stanton','MicroTech','RAYARI Deltana Research Outpost', 10,'research',        true, false, false, 'verified',          NULL),
('Stanton','MicroTech','RAYARI Anvik Research Outpost',   11,'research',        true, false, false, 'verified',          NULL),
('Stanton','MicroTech','Shubin Mining SM0-22',            12,'mining-outpost',  true, false, true,  'community-sourced', 'Corrected: was seeded under Daymar'),

-- ── Stanton / Calliope (MicroTech moon) ──────────────────────
('Stanton','Calliope','Calliope',                          1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Calliope','Shubin Mining Facility SAL-2',      2,'mining-outpost',  true, false, true,  'community-sourced', NULL),
('Stanton','Calliope','Shubin Mining Facility SAL-5',      3,'mining-outpost',  true, false, true,  'community-sourced', NULL),

-- ── Stanton / Clio (MicroTech moon) ──────────────────────────
('Stanton','Clio','Clio',                                  1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Clio','Tram & Myers Mining',                   2,'mining-outpost',  true, false, false, 'community-sourced', NULL),

-- ── Stanton / Euterpe (MicroTech moon) ───────────────────────
('Stanton','Euterpe','Euterpe',                            1,'moon',            true, false, false, 'verified',          NULL),

-- ── Stanton / Deep Space ─────────────────────────────────────
('Stanton','Deep Space','Magnus Gateway',                  1,'jump-point',      true, false, false, 'verified',          NULL),
('Stanton','Deep Space','Pyro Gateway (Stanton)',          2,'jump-point',      true, false, false, 'verified',          NULL),
('Stanton','Deep Space','Covalex Hub Gundo',               3,'facility',        true, false, false, 'community-sourced', NULL),

-- ── Pyro / Pyro I ────────────────────────────────────────────
('Pyro','Pyro I','Pyro I',                                 1,'planet',          true, false, false, 'verified',          NULL),
('Pyro','Pyro I','Hamatsu Station',                        2,'station',         true, true,  false, 'community-sourced', NULL),

-- ── Pyro / Pyro II ───────────────────────────────────────────
('Pyro','Pyro II','Bloom (Pyro II)',                        1,'station',         true, true,  false, 'verified',          NULL),
('Pyro','Pyro II','Pyro II',                               2,'planet',          true, false, false, 'verified',          NULL),
('Pyro','Pyro II','Adir',                                  3,'settlement',      true, false, false, 'community-sourced', NULL),
('Pyro','Pyro II','Ignis',                                 4,'settlement',      true, false, false, 'community-sourced', NULL),
('Pyro','Pyro II','Patch City',                            5,'settlement',      true, false, false, 'community-sourced', NULL),
('Pyro','Pyro II','Tammany and Sons Salvage',              6,'salvage',         true, false, false, 'community-sourced', NULL),

-- ── Pyro / Pyro III ──────────────────────────────────────────
('Pyro','Pyro III','Monox (Pyro III)',                      1,'station',         true, true,  false, 'verified',          NULL),
('Pyro','Pyro III','Pyro III',                             2,'planet',          true, false, false, 'verified',          NULL),
('Pyro','Pyro III','Fairo',                                3,'settlement',      true, false, false, 'community-sourced', NULL),
('Pyro','Pyro III','Fuego',                                4,'settlement',      true, false, false, 'community-sourced', NULL),
('Pyro','Pyro III','Stog''s Burg',                         5,'settlement',      true, false, false, 'community-sourced', NULL),

-- ── Pyro / Pyro IV ───────────────────────────────────────────
('Pyro','Pyro IV','Ruin Station',                          1,'station',         true, true,  false, 'verified',          NULL),
('Pyro','Pyro IV','Pyro IV',                               2,'planet',          true, false, false, 'verified',          NULL),
('Pyro','Pyro IV','The Necropolis',                        3,'outpost',         true, false, false, 'community-sourced', NULL),

-- ── Pyro / Pyro V ────────────────────────────────────────────
('Pyro','Pyro V','Checkmate',                              1,'station',         true, true,  false, 'verified',          NULL),
('Pyro','Pyro V','Pyro V',                                 2,'planet',          true, false, false, 'verified',          NULL),
('Pyro','Pyro V','Cassel',                                 3,'settlement',      true, false, false, 'community-sourced', NULL),
('Pyro','Pyro V','Gaslight',                               4,'settlement',      true, false, false, 'community-sourced', NULL),

-- ── Pyro / Pyro VI ───────────────────────────────────────────
('Pyro','Pyro VI','Terminus (Pyro VI)',                    1,'station',         true, true,  false, 'verified',          NULL),
('Pyro','Pyro VI','Pyro VI',                               2,'planet',          true, false, false, 'verified',          NULL),
('Pyro','Pyro VI','Vatra',                                 3,'settlement',      true, false, false, 'community-sourced', NULL),
('Pyro','Pyro VI','Vuur',                                  4,'settlement',      true, false, false, 'community-sourced', NULL),

-- ── Pyro / Deep Space ────────────────────────────────────────
('Pyro','Deep Space','Orbituary',                          1,'station',         true, true,  false, 'verified',          NULL),
('Pyro','Deep Space','Akiro Cluster',                      2,'outpost',         true, false, false, 'community-sourced', NULL),
('Pyro','Deep Space','Stanton Gateway (Pyro-side)',        3,'jump-point',      true, false, false, 'verified',          NULL),

-- ── Nyx ──────────────────────────────────────────────────────
('Nyx','Delamar','Levski (Delamar)',                        1,'outpost',         true, true,  false, 'verified',          NULL),
('Nyx','Delamar','Delamar',                                2,'moon',            true, false, false, 'verified',          NULL),
('Nyx','Deep Space','Nyx Gateway (Stanton-side)',           1,'jump-point',      true, false, false, 'community-sourced', NULL)

ON CONFLICT (system, body, name) DO UPDATE SET
  location_type       = EXCLUDED.location_type,
  is_active           = EXCLUDED.is_active,
  is_trade_terminal   = EXCLUDED.is_trade_terminal,
  is_freight_elevator = EXCLUDED.is_freight_elevator,
  confidence          = EXCLUDED.confidence,
  notes               = COALESCE(EXCLUDED.notes, public.locations.notes);

-- ─────────────────────────────────────────────────────────────
-- SECTION 6: Aliases for renamed ArcCorp Mining Areas
-- (old names: ARC Mining 045 / 056 / 061)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.location_aliases (location_id, alias)
SELECT l.id, a.alias
FROM (VALUES
  ('Stanton','Lyria','ArcCorp Mining Area 045','ARC Mining 045'),
  ('Stanton','Lyria','ArcCorp Mining Area 056','ARC Mining 056'),
  ('Stanton','Lyria','ArcCorp Mining Area 061','ARC Mining 061')
) AS a (system, body, name, alias)
JOIN public.locations l
  ON l.system = a.system AND l.body = a.body AND l.name = a.name
ON CONFLICT (location_id, alias) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SECTION 7: Verification queries
-- Copy-paste into SQL editor to audit after running.
-- ─────────────────────────────────────────────────────────────

-- Total row count
-- SELECT COUNT(*) FROM public.locations;

-- Inactive locations
-- SELECT system, body, name, notes FROM public.locations WHERE is_active = false ORDER BY system, body;

-- Trade terminals
-- SELECT system, body, name FROM public.locations WHERE is_trade_terminal = true ORDER BY system, body;

-- Freight elevators
-- SELECT system, body, name FROM public.locations WHERE is_freight_elevator = true ORDER BY system, body;

-- Low-confidence entries
-- SELECT system, body, name, confidence, notes FROM public.locations WHERE confidence != 'verified' ORDER BY system, body;

-- Aliases
-- SELECT l.system, l.body, l.name, a.alias FROM public.location_aliases a JOIN public.locations l ON l.id = a.location_id;

-- Duplicate check on (system, body, name)
-- SELECT system, body, name, COUNT(*) FROM public.locations GROUP BY system, body, name HAVING COUNT(*) > 1;
