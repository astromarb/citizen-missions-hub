-- ============================================================
-- SC Mission Board — Locations v2 / Reference Data Enhancement
-- Run AFTER: 20260527000000_reference_tables.sql
-- Idempotent: safe to re-run (IF NOT EXISTS + ON CONFLICT)
-- Does NOT wipe existing sessions/contracts/cargo data.
-- Sources: starcitizen.tools, FleetYards.net, sc-trade.tools (May 2026)
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

-- SM0-22 belongs on MicroTech planet surface (all SM0-prefix facilities do)
UPDATE public.locations
SET body  = 'MicroTech',
    notes = 'SM0-prefix = MicroTech planet surface; was incorrectly seeded under Daymar'
WHERE system = 'Stanton' AND body = 'Daymar' AND name = 'Shubin Mining SM0-22';

-- Brio's Breaker Yard is on Daymar (Crusader moon), not Hurston
UPDATE public.locations
SET body  = 'Daymar',
    notes = 'Daymar (Crusader moon); was incorrectly seeded under Hurston planet'
WHERE system = 'Stanton' AND body = 'Hurston' AND name = 'Brio''s Breaker Yard';

-- Security Post Kareah orbits Cellin, not Aberdeen
UPDATE public.locations
SET body  = 'Cellin',
    notes = 'Orbital installation above Cellin; was incorrectly filed under Aberdeen'
WHERE system = 'Stanton' AND body = 'Aberdeen' AND name = 'Security Post Kareah';

-- ICC ScanHub Stanton: removed from the game in Alpha 3.0 (Dec 2017)
UPDATE public.locations
SET is_active = false,
    notes     = 'Removed from the game in Alpha 3.0 (Dec 2017)'
WHERE system = 'Stanton' AND name = 'ICC ScanHub Stanton';

-- ARC Mining Areas belong on Wala (ArcCorp moon), not Lyria or ArcCorp planet
-- Also normalise names: "ARC Mining NNN" → "ArcCorp Mining Area NNN"
UPDATE public.locations
SET name = 'ArcCorp Mining Area 045', body = 'Wala', location_type = 'mining-outpost'
WHERE system = 'Stanton' AND name = 'ARC Mining 045';

UPDATE public.locations
SET name = 'ArcCorp Mining Area 056', body = 'Wala', location_type = 'mining-outpost'
WHERE system = 'Stanton' AND name = 'ARC Mining 056';

UPDATE public.locations
SET name = 'ArcCorp Mining Area 061', body = 'Wala', location_type = 'mining-outpost'
WHERE system = 'Stanton' AND name = 'ARC Mining 061';

-- RAYARI research outposts belong on MicroTech's moons, not MicroTech planet
UPDATE public.locations
SET body = 'Clio'
WHERE system = 'Stanton' AND body = 'MicroTech' AND name = 'RAYARI Cantwell Research Outpost';

UPDATE public.locations
SET body = 'Clio'
WHERE system = 'Stanton' AND body = 'MicroTech' AND name = 'RAYARI McGrath Research Outpost';

UPDATE public.locations
SET body = 'Calliope'
WHERE system = 'Stanton' AND body = 'MicroTech' AND name = 'RAYARI Anvik Research Outpost';

UPDATE public.locations
SET body = 'Euterpe',
    notes = 'Euterpe moon placement sourced from community data'
WHERE system = 'Stanton' AND body = 'MicroTech' AND name = 'RAYARI Deltana Research Outpost';

-- Pyro II and Pyro III planet names were swapped in the original seed:
--   Pyro II = Monox, Pyro III = Bloom
UPDATE public.locations
SET name = 'Bloom (Pyro III)', body = 'Pyro III'
WHERE system = 'Pyro' AND name = 'Bloom (Pyro II)';

UPDATE public.locations
SET name = 'Monox (Pyro II)', body = 'Pyro II'
WHERE system = 'Pyro' AND name = 'Monox (Pyro III)';

-- Ruin Station orbits Terminus (Pyro VI), not Pyro IV
UPDATE public.locations
SET body = 'Pyro VI'
WHERE system = 'Pyro' AND name = 'Ruin Station';

-- Checkmate is near Bloom (Pyro III), not Pyro V
UPDATE public.locations
SET body = 'Pyro III'
WHERE system = 'Pyro' AND name = 'Checkmate';

-- Adir, Ignis, Fairo, Fuego, Vatra, Vuur are moons of Pyro V —
-- they were incorrectly seeded as locations ON Pyro II / III / VI.
UPDATE public.locations SET body = 'Ignis' WHERE system = 'Pyro' AND body = 'Pyro II'  AND name = 'Ignis';
UPDATE public.locations SET body = 'Adir'  WHERE system = 'Pyro' AND body = 'Pyro II'  AND name = 'Adir';
UPDATE public.locations SET body = 'Fairo' WHERE system = 'Pyro' AND body = 'Pyro III' AND name = 'Fairo';
UPDATE public.locations SET body = 'Fuego' WHERE system = 'Pyro' AND body = 'Pyro III' AND name = 'Fuego';
UPDATE public.locations SET body = 'Vatra' WHERE system = 'Pyro' AND body = 'Pyro VI'  AND name = 'Vatra';
UPDATE public.locations SET body = 'Vuur'  WHERE system = 'Pyro' AND body = 'Pyro VI'  AND name = 'Vuur';

-- ─────────────────────────────────────────────────────────────
-- SECTION 3: Fix uniqueness constraint
-- Old: UNIQUE (system, name)  →  New: UNIQUE (system, body, name)
-- ─────────────────────────────────────────────────────────────

-- Remove any duplicates on (system, body, name) keeping lowest id
DELETE FROM public.locations
WHERE id NOT IN (
  SELECT MIN(id) FROM public.locations GROUP BY system, body, name
);

-- Drop old constraint if present
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

-- Add new constraint if not present
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
-- Sources: starcitizen.tools, FleetYards.net, sc-trade.tools
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

-- ── Stanton / Lyria (ArcCorp moon 1) ─────────────────────────
-- All Shubin SAL/SPAL facilities are on Lyria; ArcCorp Mining Areas are on Wala
('Stanton','Lyria','Lyria',                                1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Lyria','Shubin Mining Facility SAL-2',         2,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Lyria','Shubin Mining Facility SAL-5',         3,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Lyria','Loveridge Mineral Reserve',            4,'outpost',         true, false, false, 'community-sourced', NULL),

-- ── Stanton / Wala (ArcCorp moon 2) ──────────────────────────
-- ArcCorp Mining Areas 045, 048, 056, 061 are all on Wala (confirmed)
('Stanton','Wala','Wala',                                  1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Wala','ICC ScanHub Stanton',                   2,'scanHub',         false,false, false, 'verified',          'Removed from game in Alpha 3.0 (Dec 2017)'),
('Stanton','Wala','ArcCorp Mining Area 045',               3,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Wala','ArcCorp Mining Area 048',               4,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Wala','ArcCorp Mining Area 056',               5,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Wala','ArcCorp Mining Area 061',               6,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Wala','Paradise Cove',                         7,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Wala','Samson & Son''s Salvage Center',        8,'salvage',         true, false, false, 'community-sourced', NULL),
('Stanton','Wala','Shady Glen Farms',                      9,'settlement',      true, false, false, 'community-sourced', NULL),

-- ── Stanton / Hurston (planet) ────────────────────────────────
-- Six HDMS outposts are on the Hurston planet surface itself (not on its moons)
('Stanton','Hurston','Lorville (Hurston)',                  1,'city',            true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L1 Green Glade Station',         2,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L2 Faithful Dream Station',      3,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L3 Thundering Express Station',  4,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L4 Melodic Fields Station',      5,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','HUR-L5 High Course Station',         6,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Hurston','Everus Harbor',                      7,'station',         true, true,  true,  'verified',          NULL),
('Stanton','Hurston','Reclamation & Disposal Orinth',      8,'facility',        true, false, false, 'verified',          NULL),
('Stanton','Hurston','Attritus OLP',                       9,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Hurston','Vivere OLP',                        10,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Hurston','Lamina OLP',                        11,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Hurston','Ruptura OLP',                       12,'outpost',         true, false, false, 'community-sourced', NULL),
('Stanton','Hurston','HDMS-Edmond',                       13,'mining-outpost',  true, false, true,  'verified',          'Hurston planet surface'),
('Stanton','Hurston','HDMS-Hadley',                       14,'mining-outpost',  true, false, true,  'verified',          'Hurston planet surface'),
('Stanton','Hurston','HDMS-Oparei',                       15,'mining-outpost',  true, false, true,  'verified',          'Hurston planet surface'),
('Stanton','Hurston','HDMS-Pinewood',                     16,'mining-outpost',  true, false, true,  'verified',          'Hurston planet surface'),
('Stanton','Hurston','HDMS-Stanhope',                     17,'mining-outpost',  true, false, true,  'verified',          'Hurston planet surface'),
('Stanton','Hurston','HDMS-Thedus',                       18,'mining-outpost',  true, false, true,  'verified',          'Hurston planet surface'),

-- ── Stanton / Arial (Hurston moon 1) ─────────────────────────
('Stanton','Arial','Arial',                                1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Arial','HDMS-Bezdek',                          2,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Arial','HDMS-Lathan',                          3,'mining-outpost',  true, false, true,  'verified',          NULL),

-- ── Stanton / Magda (Hurston moon 2) ─────────────────────────
('Stanton','Magda','Magda',                                1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Magda','HDMS-Hahn',                            2,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Magda','HDMS-Perlman',                         3,'mining-outpost',  true, false, true,  'verified',          NULL),

-- ── Stanton / Ita (Hurston moon 3) ───────────────────────────
('Stanton','Ita','Ita',                                    1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Ita','HDMS-Ryder',                             2,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Ita','HDMS-Woodruff',                          3,'mining-outpost',  true, false, true,  'verified',          NULL),

-- ── Stanton / Aberdeen (Hurston moon 4) ──────────────────────
-- Klescher Rehabilitation Facility is on Aberdeen (NOT Cellin — common mistake)
('Stanton','Aberdeen','Aberdeen',                           1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Aberdeen','HDMS-Norgaard',                      2,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Aberdeen','HDMS-Anderson',                      3,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Aberdeen','Klescher Rehabilitation Facility',   4,'facility',        true, false, false, 'verified',          'Prison facility; on Aberdeen, not Cellin'),
('Stanton','Aberdeen','Barton Flats Aid Shelter',           5,'aid-shelter',     true, false, false, 'community-sourced', NULL),

-- ── Stanton / Crusader (gas giant) ───────────────────────────
('Stanton','Crusader','Orison (Crusader)',                  1,'city',            true, true,  true,  'verified',          NULL),
('Stanton','Crusader','CRU-L1 Ambitious Dream Station',    2,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Crusader','CRU-L4 Shallow Fields Station',     3,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Crusader','CRU-L5 Beautiful Glen Station',     4,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','Crusader','Seraphim Station',                  5,'station',         true, true,  true,  'verified',          NULL),

-- ── Stanton / Cellin (Crusader moon 1) ───────────────────────
-- Security Post Kareah orbits Cellin (NOT Aberdeen — common mistake)
-- Klescher is on Aberdeen, not here. SCD-1 is on Daymar, not here.
('Stanton','Cellin','Cellin',                              1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Cellin','Security Post Kareah',                2,'security-post',   true, false, false, 'verified',          'Orbits Cellin; was incorrectly seeded under Aberdeen'),
('Stanton','Cellin','Gallete Family Farms',                3,'settlement',      true, false, false, 'verified',          NULL),
('Stanton','Cellin','Terra Mills HydroFarm',               4,'settlement',      true, false, false, 'verified',          NULL),
('Stanton','Cellin','Hickes Research Outpost',             5,'research',        true, false, false, 'verified',          NULL),
('Stanton','Cellin','Tram & Myers Mining',                 6,'mining-outpost',  true, false, false, 'verified',          NULL),

-- ── Stanton / Daymar (Crusader moon 2) ───────────────────────
-- Brio's Breaker Yard, SCD-1, ArcCorp Mining Area 141 are on Daymar
('Stanton','Daymar','Daymar',                              1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Daymar','Brio''s Breaker Yard',                2,'salvage',         true, false, false, 'verified',          'On Daymar; was incorrectly seeded under Hurston'),
('Stanton','Daymar','Kudre Ore',                           3,'mining-outpost',  true, false, false, 'verified',          NULL),
('Stanton','Daymar','ArcCorp Mining Area 141',             4,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Daymar','Shubin Mining Facility SCD-1',        5,'mining-outpost',  true, false, true,  'verified',          'On Daymar; not on Cellin'),
('Stanton','Daymar','Bountiful Harvest Hydroponics',       6,'settlement',      true, false, false, 'community-sourced', NULL),
('Stanton','Daymar','Nuen Waste Management',               7,'facility',        true, false, false, 'verified',          NULL),
('Stanton','Daymar','Jumptown',                            8,'outpost',         true, false, false, 'verified',          'Known drug lab; not a standard cargo terminal'),

-- ── Stanton / Yela (Crusader moon 3) ─────────────────────────
-- ArcCorp Mining Area 157 is on Yela (confirmed; NOT Lyria or Wala)
('Stanton','Yela','Yela',                                  1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Yela','Grim HEX',                              2,'station',         true, true,  false, 'verified',          'Outlaw-aligned station'),
('Stanton','Yela','INS Jericho',                           3,'station',         true, false, false, 'community-sourced', NULL),
('Stanton','Yela','ArcCorp Mining Area 157',               4,'mining-outpost',  true, false, true,  'verified',          'On Yela; not Lyria or Wala'),
('Stanton','Yela','Benson Mining Outpost',                 5,'mining-outpost',  true, false, false, 'community-sourced', NULL),
('Stanton','Yela','Deakins Research Outpost',              6,'research',        true, false, false, 'verified',          NULL),
('Stanton','Yela','Benny Henge',                           7,'landmark',        true, false, false, 'verified',          'Landmark; not a standard cargo terminal'),
('Stanton','Yela','Security Post Opal',                    8,'security-post',   true, false, false, 'community-sourced', NULL),
('Stanton','Yela','Security Post Wan',                     9,'security-post',   true, false, false, 'community-sourced', NULL),

-- ── Stanton / MicroTech (planet) ─────────────────────────────
-- SM0-prefix Shubin facilities are on MicroTech planet surface
-- RAYARI outposts belong on the moons (Calliope / Clio), not here
('Stanton','MicroTech','New Babbage (MicroTech)',           1,'city',            true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L1 Shallow Frontier Station',  2,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L2 Long Forest Station',       3,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L3 Endless Odyssey Station',   4,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L4 Red Crossroads Station',    5,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','MIC-L5 Modern Icarus Station',     6,'rest-stop',       true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','Port Tressler',                    7,'station',         true, true,  true,  'verified',          NULL),
('Stanton','MicroTech','Shubin Mining SM0-22',             8,'mining-outpost',  true, false, true,  'verified',          'MicroTech planet surface; was incorrectly seeded under Daymar'),
('Stanton','MicroTech','Shubin Mining Facility SM0-10',    9,'mining-outpost',  true, false, true,  'verified',          'MicroTech planet surface'),
('Stanton','MicroTech','Shubin Mining Facility SM0-13',   10,'mining-outpost',  true, false, true,  'verified',          'MicroTech planet surface'),
('Stanton','MicroTech','Shubin Mining Facility SM0-18',   11,'mining-outpost',  true, false, true,  'verified',          'MicroTech planet surface'),

-- ── Stanton / Calliope (MicroTech moon 1) ─────────────────────
-- Rayari Anvik + Kaltag are on Calliope; Shubin uses SMCa prefix here
('Stanton','Calliope','Calliope',                          1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Calliope','Rayari Anvik Research Outpost',     2,'research',        true, false, false, 'verified',          'On Calliope; was incorrectly seeded under MicroTech planet'),
('Stanton','Calliope','Rayari Kaltag Research Outpost',    3,'research',        true, false, false, 'verified',          NULL),
('Stanton','Calliope','Shubin Mining Facility SMCa-6',     4,'mining-outpost',  true, false, true,  'verified',          NULL),
('Stanton','Calliope','Shubin Mining Facility SMCa-8',     5,'mining-outpost',  true, false, true,  'verified',          NULL),

-- ── Stanton / Clio (MicroTech moon 2) ────────────────────────
-- Rayari Cantwell + McGrath are on Clio, not MicroTech planet
('Stanton','Clio','Clio',                                  1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Clio','Rayari Cantwell Research Outpost',      2,'research',        true, false, false, 'verified',          'On Clio; was incorrectly seeded under MicroTech planet'),
('Stanton','Clio','Rayari McGrath Research Outpost',       3,'research',        true, false, false, 'verified',          'On Clio; was incorrectly seeded under MicroTech planet'),

-- ── Stanton / Euterpe (MicroTech moon 3) ─────────────────────
('Stanton','Euterpe','Euterpe',                            1,'moon',            true, false, false, 'verified',          NULL),
('Stanton','Euterpe','Rayari Deltana Research Outpost',    2,'research',        true, false, false, 'community-sourced', 'Euterpe moon placement sourced from community data'),
('Stanton','Euterpe','Devlin Scrap & Salvage',             3,'salvage',         true, false, false, 'verified',          NULL),
('Stanton','Euterpe','Bud''s Growery',                     4,'outpost',         true, false, false, 'verified',          NULL),
('Stanton','Euterpe','Icebreaker',                         5,'outpost',         true, false, false, 'community-sourced', NULL),

-- ── Stanton / Deep Space ─────────────────────────────────────
('Stanton','Deep Space','Magnus Gateway',                  1,'jump-point',      true, false, false, 'verified',          NULL),
('Stanton','Deep Space','Pyro Gateway (Stanton)',          2,'jump-point',      true, false, false, 'verified',          NULL),
('Stanton','Deep Space','Covalex Hub Gundo',               3,'facility',        true, false, false, 'community-sourced', NULL),

-- ── Pyro / Pyro I ────────────────────────────────────────────
('Pyro','Pyro I','Pyro I',                                 1,'planet',          true, false, false, 'verified',          'Hot planet close to Pyro star; sparse outpost data'),

-- ── Pyro / Pyro II (Monox) ───────────────────────────────────
-- Pyro II's nickname is Monox (original seed had Bloom here — incorrect)
('Pyro','Pyro II','Monox (Pyro II)',                       1,'station',         true, true,  false, 'verified',          'Pyro II; was incorrectly labelled Bloom in original seed'),
('Pyro','Pyro II','Pyro II',                               2,'planet',          true, false, false, 'verified',          NULL),

-- ── Pyro / Pyro III (Bloom) ──────────────────────────────────
-- Pyro III's nickname is Bloom (original seed had Monox here — incorrect)
-- Main player hubs: Checkmate, Orbituary. Ruin Station is at Pyro VI.
('Pyro','Pyro III','Bloom (Pyro III)',                     1,'station',         true, true,  false, 'verified',          'Pyro III; was incorrectly labelled Monox in original seed'),
('Pyro','Pyro III','Pyro III',                             2,'planet',          true, false, false, 'verified',          NULL),
('Pyro','Pyro III','Checkmate',                            3,'station',         true, true,  false, 'verified',          'Near Bloom/Pyro III; was incorrectly seeded under Pyro V'),
('Pyro','Pyro III','Orbituary',                            4,'station',         true, true,  false, 'verified',          'High orbit above Bloom (Pyro III)'),
('Pyro','Pyro III','Patch City',                           5,'settlement',      true, false, false, 'community-sourced', NULL),
('Pyro','Pyro III','Endgame',                              6,'outpost',         true, false, false, 'community-sourced', NULL),

-- ── Pyro / Pyro IV ───────────────────────────────────────────
('Pyro','Pyro IV','Pyro IV',                               1,'planet',          true, false, false, 'verified',          NULL),

-- ── Pyro / Pyro V (gas giant) ────────────────────────────────
-- Gaslight is at the Pyro V L2 Lagrange point
('Pyro','Pyro V','Pyro V',                                 1,'planet',          true, false, false, 'verified',          'Gas giant with 6 moons: Ignis, Adir, Fairo, Fuego, Vatra, Vuur'),
('Pyro','Pyro V','Gaslight',                               2,'station',         true, true,  false, 'verified',          'At Pyro V L2 Lagrange; Rough & Ready controlled'),

-- ── Pyro / Pyro V moons (each moon is its own body) ──────────
('Pyro','Ignis','Ignis',                                   1,'moon',            true, false, false, 'verified',          'Innermost moon of Pyro V'),
('Pyro','Adir','Adir',                                     1,'moon',            true, false, false, 'verified',          'Moon of Pyro V'),
('Pyro','Fairo','Fairo',                                   1,'moon',            true, false, false, 'verified',          'Moon of Pyro V'),
('Pyro','Fuego','Fuego',                                   1,'moon',            true, false, false, 'verified',          'Moon of Pyro V'),
('Pyro','Vatra','Vatra',                                   1,'moon',            true, false, false, 'verified',          'Moon of Pyro V'),
('Pyro','Vuur','Vuur',                                     1,'moon',            true, false, false, 'verified',          'Moon of Pyro V'),

-- ── Pyro / Pyro VI (Terminus) ────────────────────────────────
-- Ruin Station orbits Terminus (Pyro VI) — confirmed; was incorrectly seeded under Pyro IV
('Pyro','Pyro VI','Terminus (Pyro VI)',                    1,'station',         true, true,  false, 'verified',          'Primary station for Pyro VI / Terminus'),
('Pyro','Pyro VI','Pyro VI',                               2,'planet',          true, false, false, 'verified',          'Pyro VI; nickname Terminus'),
('Pyro','Pyro VI','Ruin Station',                          3,'station',         true, true,  false, 'verified',          'Main pirate hub; orbits Terminus (Pyro VI). Was incorrectly seeded under Pyro IV'),

-- ── Pyro / Deep Space ────────────────────────────────────────
('Pyro','Deep Space','Akiro Cluster',                      1,'outpost',         true, false, false, 'community-sourced', NULL),
('Pyro','Deep Space','Stanton Gateway (Pyro-side)',        2,'jump-point',      true, false, false, 'verified',          NULL),
('Pyro','Deep Space','Nyx Gateway (Pyro-side)',            3,'jump-point',      true, false, false, 'community-sourced', NULL),

-- ── Nyx ──────────────────────────────────────────────────────
-- Levski returned to the game in Alpha 4.4; Delamar is an asteroid, not a moon
('Nyx','Delamar','Levski (Delamar)',                        1,'outpost',         true, true,  false, 'verified',          'Returned in Alpha 4.4; free-town carved into Delamar asteroid'),
('Nyx','Delamar','Delamar',                                2,'asteroid',        true, false, false, 'verified',          'Asteroid in the Glaciem Ring belt'),
('Nyx','Deep Space','Nyx Gateway (Stanton-side)',           1,'jump-point',      true, false, false, 'community-sourced', NULL)

ON CONFLICT (system, body, name) DO UPDATE SET
  location_type       = EXCLUDED.location_type,
  is_active           = EXCLUDED.is_active,
  is_trade_terminal   = EXCLUDED.is_trade_terminal,
  is_freight_elevator = EXCLUDED.is_freight_elevator,
  confidence          = EXCLUDED.confidence,
  notes               = COALESCE(EXCLUDED.notes, public.locations.notes);

-- ─────────────────────────────────────────────────────────────
-- SECTION 6: Aliases for renamed / corrected locations
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.location_aliases (location_id, alias)
SELECT l.id, a.alias
FROM (VALUES
  -- Old short names for ArcCorp Mining Areas (now on Wala with full names)
  ('Stanton','Wala','ArcCorp Mining Area 045','ARC Mining 045'),
  ('Stanton','Wala','ArcCorp Mining Area 056','ARC Mining 056'),
  ('Stanton','Wala','ArcCorp Mining Area 061','ARC Mining 061'),
  -- Pyro planet name aliases (labels swapped in original seed)
  ('Pyro','Pyro II','Monox (Pyro II)','Bloom (Pyro II)'),
  ('Pyro','Pyro III','Bloom (Pyro III)','Monox (Pyro III)')
) AS a (system, body, name, alias)
JOIN public.locations l
  ON l.system = a.system AND l.body = a.body AND l.name = a.name
ON CONFLICT (location_id, alias) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SECTION 7: Verification queries (copy-paste to audit)
-- ─────────────────────────────────────────────────────────────

-- Total row count
-- SELECT COUNT(*) FROM public.locations;

-- Inactive locations
-- SELECT system, body, name, notes FROM public.locations WHERE is_active = false ORDER BY system, body;

-- Trade terminals
-- SELECT system, body, name FROM public.locations WHERE is_trade_terminal = true ORDER BY system, body;

-- Freight elevator locations
-- SELECT system, body, name FROM public.locations WHERE is_freight_elevator = true ORDER BY system, body;

-- Low-confidence entries (review these before relying on them for route planning)
-- SELECT system, body, name, notes FROM public.locations WHERE confidence != 'verified' ORDER BY system, body;

-- All aliases
-- SELECT l.system, l.body, l.name, a.alias FROM public.location_aliases a JOIN public.locations l ON l.id = a.location_id ORDER BY l.system, l.body;

-- Duplicate check on (system, body, name) — should return 0 rows
-- SELECT system, body, name, COUNT(*) FROM public.locations GROUP BY system, body, name HAVING COUNT(*) > 1;

-- All Pyro V moon bodies
-- SELECT DISTINCT body FROM public.locations WHERE system = 'Pyro' ORDER BY body;
