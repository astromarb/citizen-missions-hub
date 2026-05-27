-- ============================================================
-- SC Mission Board — Full Verified Dataset (v3)
-- Run AFTER: 20260527000001_locations_v2.sql
-- Sources: starcitizen.tools systematic per-body scrape (May 2026)
--          CStone Universal Item Finder, UEX Corp, FleetYards.net
-- Covers: Stanton (all planets + moons), Pyro (all bodies),
--         Nyx; plus expanded commodities list.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION 1: Commodity additions
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.commodities (name, sort_order) VALUES
-- Metals
('Atlasium',                50),
('Hephaestanite',           51),
('Iron',                    52),
('Mercury',                 53),
('Riccite',                 54),
('Taranite',                55),
-- Minerals / gems
('Dolivine',                60),
('Hadanite',                61),
('Janalite',                62),
('Quartz',                  63),
('Silicon',                 64),
-- Raw / ore forms
('Agricium (Ore)',           70),
('Aluminum (Ore)',           71),
('Beryl (Raw)',              72),
('Bexalite (Raw)',           73),
('Borase (Ore)',             74),
('Copper (Ore)',             75),
('Corundum (Raw)',           76),
('Diamond (Raw)',            77),
('Gold (Ore)',               78),
('Hephaestanite (Raw)',      79),
('Iron (Ore)',               80),
('Laranite (Raw)',           81),
('Quantanium (Raw)',         82),
('Taranite (Raw)',           83),
-- Gases
('Helium',                  90),
('Hydrogen',                91),
('Iodine',                  92),
('Methane',                 93),
('Neon',                    94),
('Nitrogen',                95),
('Potassium',               96),
-- Harvestable / flora & fauna
('Amioshi Plague',         100),
('Degnous Root',           101),
('Gasping Weevil Eggs',    102),
('Heart of the Woods',     103),
('Jumping Limes',          104),
('Kopion Horn',            105),
('Osoian Hides',           106),
('Pitambu',                107),
('Prota',                  108),
('Revenant Tree Pollen',   109),
-- Drugs / controlled substances
('Altruciatoxin',          110),
('Maze',                   111),
-- Manufactured / industrial
('AcryliPlex Composite',   120),
('Diamond Laminate',       121),
('Feynmaline',             122),
('Glacosite',              123),
('Human Food Bars',        124),
('Inert Materials',        125),
('Neograph',               126),
('Omnapoxy',               127),
('Organics',               128),
('Partillium',             129),
('Pressurized Ice',        130),
-- Misc
('Marok Gem',              140),
('Savrilium',              141),
('Savrilium (Ore)',        142)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SECTION 2: Body / name corrections from v2
-- ─────────────────────────────────────────────────────────────

-- Rayari Deltana is on MicroTech planet surface (not Euterpe)
UPDATE public.locations
SET body  = 'MicroTech',
    notes = 'MicroTech planet surface; v2 incorrectly placed under Euterpe'
WHERE system = 'Stanton' AND name = 'RAYARI Deltana Research Outpost';

-- Security Post Kareah body fix: v2 used 'Cellin Orbit'; correct body is 'Cellin'
UPDATE public.locations
SET body = 'Cellin'
WHERE system = 'Stanton' AND body = 'Cellin Orbit' AND name = 'Security Post Kareah';

-- OLPs: move to correct bodies (all were under Hurston planet in v1/v2)
UPDATE public.locations
SET body = 'Daymar', is_active = false,
    notes = 'Hathor Group PAF on Daymar; decommissioned combat zone'
WHERE system = 'Stanton' AND body = 'Hurston' AND name = 'Attritus OLP';

UPDATE public.locations
SET body = 'Daymar', is_active = false,
    notes = 'Hathor Group PAF on Daymar; decommissioned combat zone'
WHERE system = 'Stanton' AND body = 'Hurston' AND name = 'Lamina OLP';

UPDATE public.locations
SET body = 'Aberdeen', is_active = false,
    notes = 'Hathor Group OLP above Aberdeen; decommissioned'
WHERE system = 'Stanton' AND body = 'Hurston' AND name = 'Ruptura OLP';

UPDATE public.locations
SET body = 'Aberdeen', is_active = false,
    notes = 'Hathor Group OLP above Aberdeen; decommissioned'
WHERE system = 'Stanton' AND body = 'Hurston' AND name = 'Vivere OLP';

-- The Necropolis is on MicroTech, not Pyro IV
UPDATE public.locations
SET system = 'Stanton', body = 'MicroTech',
    notes  = 'MicroTech surface outpost; v2 incorrectly placed under Pyro IV'
WHERE system = 'Pyro' AND body = 'Pyro IV' AND name = 'The Necropolis';

-- Checkmate orbits Monox (Pyro II L4), not Pyro III
UPDATE public.locations
SET body  = 'Pyro II',
    notes = 'Rough & Ready HQ at Pyro II (Monox) L4; v2 incorrectly placed under Pyro III'
WHERE system = 'Pyro' AND name = 'Checkmate';

-- Patch City is at Pyro III (Bloom) L3, not Pyro II
UPDATE public.locations
SET body = 'Pyro III'
WHERE system = 'Pyro' AND body = 'Pyro II' AND name = 'Patch City';

-- Endgame is at Pyro VI (Terminus) L3, not Pyro III
UPDATE public.locations
SET body = 'Pyro VI'
WHERE system = 'Pyro' AND body = 'Pyro III' AND name = 'Endgame';

-- Nyx gateway name fix: there is no Stanton-Nyx direct jump
UPDATE public.locations
SET name = 'Pyro Gateway (Nyx)'
WHERE system = 'Nyx' AND name = 'Nyx Gateway (Stanton-side)';

-- Port Olisar was decommissioned in Alpha 3.20.0
UPDATE public.locations
SET is_active = false,
    notes     = 'Removed in Alpha 3.20.0; replaced by Seraphim Station'
WHERE system = 'Stanton' AND name = 'Port Olisar';

-- INS Jericho: delete the v1 Yela row; v2 may have already inserted the MicroTech row,
-- and Section 4 will upsert the correct entry.
DELETE FROM public.locations
WHERE system = 'Stanton' AND body = 'Yela' AND name = 'INS Jericho';

-- Orbituary: delete the v1 Deep Space row; v2 already inserted the Pyro III row,
-- and Section 4 will upsert the correct entry.
DELETE FROM public.locations
WHERE system = 'Pyro' AND body = 'Deep Space' AND name = 'Orbituary';

-- RAYARI outpost name capitalisation: v2 already inserted the mixed-case 'Rayari ...' rows,
-- so renaming the stale uppercase 'RAYARI ...' rows would collide. Delete them instead;
-- Section 4's upsert will insert/update the correct mixed-case entries.
DELETE FROM public.locations
  WHERE system = 'Stanton' AND name IN (
    'RAYARI Cantwell Research Outpost',
    'RAYARI McGrath Research Outpost',
    'RAYARI Anvik Research Outpost',
    'RAYARI Deltana Research Outpost'
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION 3: De-dup after body moves
-- ─────────────────────────────────────────────────────────────
DELETE FROM public.locations
WHERE id NOT IN (
  SELECT MIN(id) FROM public.locations GROUP BY system, body, name
);

-- ─────────────────────────────────────────────────────────────
-- SECTION 4: Comprehensive location upserts
-- All wiki-verified from systematic per-body scrape (May 2026)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.locations
  (system, body, name, sort_order,
   location_type, is_active, is_trade_terminal, is_freight_elevator, confidence, notes)
VALUES

-- ════════════════════════════════════════════════════════════
-- STANTON — HURSTON CLUSTER
-- ════════════════════════════════════════════════════════════

-- Hurston planet ──────────────────────────────────────────────
('Stanton','Hurston','Lorville (Hurston)',                  1,'city',           true, true,  true,  'verified','TDD (Transfers Commodity Exchange) in Central Business District'),
('Stanton','Hurston','Everus Harbor',                       2,'station',        true, true,  true,  'verified','Geostationary orbital station above Lorville'),
('Stanton','Hurston','HUR-L1 Green Glade Station',          3,'rest-stop',      true, true,  true,  'verified','Has refinery'),
('Stanton','Hurston','HUR-L2 Faithful Dream Station',       4,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','Hurston','HUR-L3 Thundering Express Station',   5,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','Hurston','HUR-L4 Melodic Fields Station',       6,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','Hurston','HUR-L5 High Course Station',          7,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','Hurston','HDMS-Edmond',                         8,'mining-outpost', true, true,  true,  'verified','Hurston planet surface'),
('Stanton','Hurston','HDMS-Hadley',                         9,'mining-outpost', true, true,  true,  'verified','Hurston planet surface'),
('Stanton','Hurston','HDMS-Oparei',                        10,'mining-outpost', true, true,  true,  'verified','Hurston planet surface'),
('Stanton','Hurston','HDMS-Pinewood',                      11,'mining-outpost', true, true,  true,  'verified','Hurston planet surface'),
('Stanton','Hurston','HDMS-Stanhope',                      12,'mining-outpost', true, true,  true,  'verified','Hurston planet surface'),
('Stanton','Hurston','HDMS-Thedus',                        13,'mining-outpost', true, true,  true,  'verified','Hurston planet surface'),
('Stanton','Hurston','Covalex Distribution Centre S1DC06', 14,'facility',       true, true,  true,  'verified','Public-access distribution centre'),
('Stanton','Hurston','Dupree Industrial Manufacturing Facility',15,'facility',  true, true,  true,  'verified','Distribution centre with commodity trading'),
('Stanton','Hurston','Reclamation & Disposal Orinth',      16,'facility',       true, false, false, 'verified',NULL),
-- Derelict settlements — bars/shops but NO commodity trade consoles
('Stanton','Hurston','Zephyr',                             20,'settlement',     true, false, false, 'verified','Derelict; has bar/store, no commodity terminal'),
('Stanton','Hurston','Ludlow',                             21,'settlement',     true, false, false, 'verified','Built from 600i hull'),
('Stanton','Hurston','Maker''s Point',                     22,'settlement',     true, false, false, 'verified',NULL),
('Stanton','Hurston','Picker''s Field',                    23,'settlement',     true, false, false, 'verified',NULL),
('Stanton','Hurston','Finn''s Folly',                      24,'settlement',     true, false, false, 'verified','Built around a derelict shipwreck'),
('Stanton','Hurston','Weeping Cove',                       25,'settlement',     true, false, false, 'verified',NULL),
('Stanton','Hurston','Cutter''s Rig',                      26,'settlement',     true, false, false, 'verified','Offshore platform on a lake'),
('Stanton','Hurston','Rappel',                             27,'settlement',     true, false, false, 'verified',NULL),

-- Arial (Hurston moon 1) ──────────────────────────────────────
('Stanton','Arial','Arial',                                 1,'moon',           true, false, false, 'verified',NULL),
('Stanton','Arial','HDMS-Bezdek',                           2,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Arial','HDMS-Lathan',                           3,'mining-outpost', true, true,  true,  'verified',NULL),

-- Magda (Hurston moon 2) ──────────────────────────────────────
('Stanton','Magda','Magda',                                 1,'moon',           true, false, false, 'verified',NULL),
('Stanton','Magda','HDMS-Hahn',                             2,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Magda','HDMS-Perlman',                          3,'mining-outpost', true, true,  true,  'verified',NULL),

-- Ita (Hurston moon 3) ────────────────────────────────────────
('Stanton','Ita','Ita',                                     1,'moon',           true, false, false, 'verified',NULL),
('Stanton','Ita','HDMS-Ryder',                              2,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Ita','HDMS-Woodruff',                           3,'mining-outpost', true, true,  true,  'verified',NULL),

-- Aberdeen (Hurston moon 4) ───────────────────────────────────
-- Klescher is here, NOT on Cellin (common misconception)
('Stanton','Aberdeen','Aberdeen',                           1,'moon',           true, false, false, 'verified',NULL),
('Stanton','Aberdeen','HDMS-Norgaard',                      2,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Aberdeen','HDMS-Anderson',                      3,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Aberdeen','Klescher Rehabilitation Facility',   4,'prison',         true, false, false, 'verified','On Aberdeen, NOT Cellin'),
('Stanton','Aberdeen','Barton Flats Aid Shelter',           5,'aid-shelter',    true, false, false, 'verified','Has ASOP terminal; 11 km from Klescher'),
('Stanton','Aberdeen','Ruptura OLP',                        6,'outpost',        false,false, false, 'verified','Decommissioned Hathor Group OLP'),
('Stanton','Aberdeen','Vivere OLP',                         7,'outpost',        false,false, false, 'verified','Decommissioned Hathor Group OLP'),

-- ════════════════════════════════════════════════════════════
-- STANTON — ARCCORP CLUSTER
-- ════════════════════════════════════════════════════════════

-- ArcCorp planet ──────────────────────────────────────────────
('Stanton','ArcCorp','Area 18 (ArcCorp)',                   1,'city',           true, true,  true,  'verified','TDD at ArcCorp Plaza'),
('Stanton','ArcCorp','Baijini Point',                       2,'station',        true, true,  true,  'verified','Geostationary orbital station above Area 18'),
('Stanton','ArcCorp','ARC-L1 Wide Forest Station',          3,'rest-stop',      true, true,  true,  'verified','Has refinery'),
('Stanton','ArcCorp','ARC-L2 Lively Pathway Station',       4,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','ArcCorp','ARC-L3 Modern Express Station',       5,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','ArcCorp','ARC-L4 Faint Glen Station',           6,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','ArcCorp','ARC-L5 Yellow Core Station',          7,'rest-stop',      true, true,  true,  'verified',NULL),

-- Lyria (ArcCorp moon 1) ──────────────────────────────────────
-- Premier Quantanium destination; Shubin SAL facilities here
('Stanton','Lyria','Lyria',                                 1,'moon',           true, false, false, 'verified','Premier Quantanium mining moon'),
('Stanton','Lyria','Humboldt Mines',                        2,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Lyria','Loveridge Mineral Reserve',             3,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Lyria','Shubin Mining Facility SAL-2',          4,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Lyria','Shubin Mining Facility SAL-5',          5,'mining-outpost', true, true,  true,  'verified',NULL),

-- Wala (ArcCorp moon 2) ───────────────────────────────────────
-- ArcCorp Mining Areas 045/048/056/061 are all on Wala (NOT Lyria)
('Stanton','Wala','Wala',                                   1,'moon',           true, false, false, 'verified',NULL),
('Stanton','Wala','ICC ScanHub Stanton',                    2,'outpost',        false,false, false, 'verified','Removed in Alpha 3.0 (Dec 2017)'),
('Stanton','Wala','ArcCorp Mining Area 045',                3,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Wala','ArcCorp Mining Area 048',                4,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Wala','ArcCorp Mining Area 056',                5,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Wala','ArcCorp Mining Area 061',                6,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Wala','Paradise Cove',                          7,'drug-lab',       true, true,  false, 'verified','Jumptown 2.1 event; illegal goods'),
('Stanton','Wala','Samson & Son''s Salvage Center',         8,'salvage',        true, true,  false, 'verified',NULL),
('Stanton','Wala','Shady Glen Farms',                       9,'settlement',     true, true,  false, 'verified',NULL),

-- ════════════════════════════════════════════════════════════
-- STANTON — CRUSADER CLUSTER
-- ════════════════════════════════════════════════════════════

-- Crusader (gas giant) ────────────────────────────────────────
('Stanton','Crusader','Orison (Crusader)',                   1,'city',           true, true,  true,  'verified','Floating city; TDD at Cloudview Center'),
('Stanton','Crusader','Seraphim Station',                    2,'station',        true, true,  true,  'verified','Replaced Port Olisar (Alpha 3.20)'),
('Stanton','Crusader','CRU-L1 Ambitious Dream Station',      3,'rest-stop',      true, true,  true,  'verified','Has refinery'),
('Stanton','Crusader','CRU-L4 Shallow Fields Station',       4,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','Crusader','CRU-L5 Beautiful Glen Station',       5,'rest-stop',      true, true,  true,  'verified',NULL),

-- Cellin (Crusader moon 1) ────────────────────────────────────
-- Klescher is on Aberdeen, SCD-1 is on Daymar — common misplacements
('Stanton','Cellin','Cellin',                                1,'moon',           true, false, false, 'verified',NULL),
('Stanton','Cellin','Security Post Kareah',                  2,'security-post',  true, false, false, 'verified','Orbits Cellin; CrimeStat clearance only — no commodity trade'),
('Stanton','Cellin','Gallete Family Farms',                  3,'settlement',     true, false, false, 'verified',NULL),
('Stanton','Cellin','Terra Mills HydroFarm',                 4,'settlement',     true, false, false, 'verified',NULL),
('Stanton','Cellin','Hickes Research Outpost',               5,'research',       true, false, false, 'verified',NULL),
('Stanton','Cellin','Tram & Myers Mining',                   6,'mining-outpost', true, false, false, 'verified','On Cellin, not Clio'),

-- Daymar (Crusader moon 2) ────────────────────────────────────
-- Brio's, SCD-1 and ArcCorp 141 are all confirmed on Daymar
('Stanton','Daymar','Daymar',                                1,'moon',           true, false, false, 'verified',NULL),
('Stanton','Daymar','Shubin Mining Facility SCD-1',          2,'mining-outpost', true, true,  true,  'verified','Major commodity hub on Daymar'),
('Stanton','Daymar','ArcCorp Mining Area 141',               3,'mining-outpost', true, true,  true,  'verified','Major commodity hub; sells Agricium, RMC, Construction Materials'),
('Stanton','Daymar','Bountiful Harvest Hydroponics',          4,'settlement',     true, true,  false, 'verified','Buys agri/medical; sells food and distilled spirits'),
('Stanton','Daymar','Brio''s Breaker Yard',                  5,'salvage',        true, false, false, 'verified',NULL),
('Stanton','Daymar','Kudre Ore',                             6,'mining-outpost', true, false, false, 'verified',NULL),
('Stanton','Daymar','Nuen Waste Management',                  7,'facility',       true, false, false, 'verified',NULL),
('Stanton','Daymar','Jumptown',                              8,'drug-lab',       true, true,  false, 'verified','Produces WiDoW; notorious PvP hotspot'),
('Stanton','Daymar','Attritus OLP',                          9,'outpost',        false,false, false, 'verified','Hathor Group PAF; decommissioned'),
('Stanton','Daymar','Lamina OLP',                           10,'outpost',        false,false, false, 'verified','Hathor Group PAF; decommissioned'),

-- Yela (Crusader moon 3) ──────────────────────────────────────
-- ArcCorp Mining Area 157 is on Yela (not Lyria or Wala)
('Stanton','Yela','Yela',                                    1,'moon',           true, false, false, 'verified','Has the only asteroid belt in Stanton'),
('Stanton','Yela','Grim HEX',                                2,'station',        true, true,  false, 'verified','Outlaw station inside asteroid belt; Nine Tails HQ'),
('Stanton','Yela','ArcCorp Mining Area 157',                 3,'mining-outpost', true, true,  true,  'verified','On Yela; has commodity trade, habitation, storage'),
('Stanton','Yela','Wikelo Emporium Selo Station',            4,'station',        true, true,  false, 'verified','Banu merchant asteroid station near Yela'),
('Stanton','Yela','Benson Mining Outpost',                   5,'mining-outpost', true, false, false, 'verified',NULL),
('Stanton','Yela','Deakins Research Outpost',                6,'research',       true, false, false, 'verified',NULL),
('Stanton','Yela','Security Post Opal',                      7,'security-post',  true, false, false, 'verified',NULL),
('Stanton','Yela','Security Post Wan',                       8,'security-post',  true, false, false, 'verified',NULL),
('Stanton','Yela','Benny Henge',                             9,'landmark',       true, false, false, 'verified','Easter egg; Big Benny machines in Stonehenge formation'),

-- ════════════════════════════════════════════════════════════
-- STANTON — MICROTECH CLUSTER
-- ════════════════════════════════════════════════════════════

-- MicroTech planet ────────────────────────────────────────────
-- SM0-prefix Shubin facilities are all on the planet surface
-- RAYARI Deltana is also on planet surface (NOT Euterpe)
('Stanton','MicroTech','New Babbage (MicroTech)',             1,'city',           true, true,  true,  'verified','TDD in the Commons'),
('Stanton','MicroTech','Port Tressler',                       2,'station',        true, true,  true,  'verified','Geostationary orbital station above New Babbage'),
('Stanton','MicroTech','MIC-L1 Shallow Frontier Station',     3,'rest-stop',      true, true,  true,  'verified','Has refinery'),
('Stanton','MicroTech','MIC-L2 Long Forest Station',          4,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','MicroTech','MIC-L3 Endless Odyssey Station',      5,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','MicroTech','MIC-L4 Red Crossroads Station',       6,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','MicroTech','MIC-L5 Modern Icarus Station',        7,'rest-stop',      true, true,  true,  'verified',NULL),
('Stanton','MicroTech','INS Jericho',                         8,'station',        true, false, false, 'verified','UEE Navy outpost near MIC-L1'),
('Stanton','MicroTech','Shubin Mining Facility SM0-10',       9,'mining-outpost', true, true,  true,  'verified','MicroTech planet surface'),
('Stanton','MicroTech','Shubin Mining Facility SM0-13',      10,'mining-outpost', true, true,  true,  'verified','MicroTech planet surface'),
('Stanton','MicroTech','Shubin Mining Facility SM0-18',      11,'mining-outpost', true, true,  true,  'verified','MicroTech planet surface'),
('Stanton','MicroTech','Shubin Mining SM0-22',               12,'mining-outpost', true, true,  true,  'verified','MicroTech planet surface'),
('Stanton','MicroTech','Rayari Deltana Research Outpost',    13,'research',       true, true,  false, 'verified','MicroTech planet surface (not Euterpe)'),
('Stanton','MicroTech','Greycat Stanton IV Production Complex-A',14,'facility',   true, true,  true,  'verified','Distribution centre; large hangar'),
('Stanton','MicroTech','MicroTech Logistics Depot S4LD01',   15,'facility',       true, true,  false, 'verified',NULL),
('Stanton','MicroTech','MicroTech Logistics Depot S4LD13',   16,'facility',       true, true,  false, 'verified',NULL),
('Stanton','MicroTech','Outpost 54',                         17,'outpost',        true, true,  false, 'verified',NULL),
('Stanton','MicroTech','The Necropolis',                     18,'outpost',        true, false, false, 'verified','MicroTech surface'),
('Stanton','MicroTech','Dunboro',                            19,'settlement',     true, false, false, 'verified','Built around derelict Reclaimer wreck'),

-- Calliope (MicroTech moon 1) ─────────────────────────────────
-- Rayari Anvik + Kaltag are here; SMCa prefix for Shubin
('Stanton','Calliope','Calliope',                             1,'moon',           true, false, false, 'verified',NULL),
('Stanton','Calliope','Rayari Anvik Research Outpost',        2,'research',       true, true,  false, 'verified','On Calliope moon'),
('Stanton','Calliope','Rayari Kaltag Research Outpost',       3,'research',       true, true,  false, 'verified',NULL),
('Stanton','Calliope','Shubin Mining Facility SMCa-6',        4,'mining-outpost', true, true,  true,  'verified',NULL),
('Stanton','Calliope','Shubin Mining Facility SMCa-8',        5,'mining-outpost', true, true,  true,  'verified',NULL),

-- Clio (MicroTech moon 2) ─────────────────────────────────────
-- Rayari Cantwell + McGrath are here; no Shubin facilities on Clio
('Stanton','Clio','Clio',                                     1,'moon',           true, false, false, 'verified','Largest MicroTech moon; liquid oceans'),
('Stanton','Clio','Rayari Cantwell Research Outpost',         2,'research',       true, true,  false, 'verified','Up to 5000 SCU cargo capacity'),
('Stanton','Clio','Rayari McGrath Research Outpost',          3,'research',       true, true,  false, 'verified',NULL),

-- Euterpe (MicroTech moon 3) ──────────────────────────────────
('Stanton','Euterpe','Euterpe',                               1,'moon',           true, false, false, 'verified','Smallest MicroTech moon; frozen oceans'),
('Stanton','Euterpe','Bud''s Growery',                        2,'settlement',     true, true,  false, 'verified',NULL),
('Stanton','Euterpe','Devlin Scrap & Salvage',                3,'salvage',        true, true,  false, 'verified',NULL),

-- Stanton deep space ──────────────────────────────────────────
('Stanton','Deep Space','Magnus Gateway',                     1,'jump-point',     true, false, false, 'verified',NULL),
('Stanton','Deep Space','Pyro Gateway (Stanton)',             2,'jump-point',     true, false, false, 'verified',NULL),
('Stanton','Deep Space','Covalex Hub Gundo',                  3,'facility',       true, false, false, 'community-sourced',NULL),

-- ════════════════════════════════════════════════════════════
-- PYRO
-- ════════════════════════════════════════════════════════════

-- Pyro I ──────────────────────────────────────────────────────
-- Extreme heat; Lazarus hubs are the primary landable points
('Pyro','Pyro I','Pyro I',                                    1,'planet',         true, false, false, 'verified','Extreme; close to Pyro star'),
('Pyro','Pyro I','Rustville',                                 2,'outpost',        true, true,  false, 'verified','Headhunters; confirmed shop terminal'),
('Pyro','Pyro I','Stag''s Rut',                               3,'outpost',        true, true,  false, 'verified','Headhunters; confirmed shop terminal'),
('Pyro','Pyro I','Gray Gardens Depot',                        4,'outpost',        true, true,  false, 'community-sourced','Storage depot'),

-- Pyro II (Monox) ─────────────────────────────────────────────
-- Checkmate is at Pyro II L4 (Monox L4) — confirmed
('Pyro','Pyro II','Monox (Pyro II)',                          1,'station',        true, true,  false, 'verified','Main station for Pyro II / Monox'),
('Pyro','Pyro II','Pyro II',                                  2,'planet',         true, false, false, 'verified','Nickname: Monox; coreless toxic world'),
('Pyro','Pyro II','Checkmate',                                3,'station',        true, true,  true,  'verified','Rough & Ready HQ at Monox L4; full services incl. refinery'),
('Pyro','Pyro II','Arid Reach',                               4,'outpost',        true, true,  false, 'verified','Headhunters; confirmed shop terminal'),
('Pyro','Pyro II','Ostler''s Claim',                          5,'outpost',        true, true,  false, 'verified','Headhunters; confirmed shop terminal'),
('Pyro','Pyro II','Jackson''s Swap',                          6,'salvage',        true, true,  false, 'verified','Citizens for Prosperity; confirmed shop terminal'),
('Pyro','Pyro II','Sunset Mesa',                              7,'salvage',        true, true,  false, 'verified','Citizens for Prosperity; confirmed shop terminal'),
('Pyro','Pyro II','Yang''s Place',                            8,'outpost',        true, true,  false, 'verified','Citizens for Prosperity; confirmed shop terminal'),
('Pyro','Pyro II','Last Ditch',                               9,'outpost',        true, false, false, 'verified','XenoThreat; no confirmed commodity terminal'),
('Pyro','Pyro II','Slowburn Depot',                          10,'outpost',        true, true,  false, 'verified','Independent; commodity terminal confirmed'),

-- Pyro III (Bloom) ────────────────────────────────────────────
-- Orbituary orbits Bloom; Patch City at Bloom L3; Starlight at Bloom L1
('Pyro','Pyro III','Bloom (Pyro III)',                        1,'station',        true, true,  false, 'verified','Main station for Pyro III / Bloom'),
('Pyro','Pyro III','Pyro III',                                2,'planet',         true, false, false, 'verified','Nickname: Bloom; icy breathable world'),
('Pyro','Pyro III','Orbituary',                               3,'station',        true, true,  true,  'verified','Rough & Ready; high orbit above Bloom; refinery + full services'),
('Pyro','Pyro III','Patch City',                              4,'station',        true, true,  false, 'verified','Rough & Ready at Bloom L3'),
('Pyro','Pyro III','Starlight Service Station',               5,'station',        true, true,  false, 'verified','Citizens for Prosperity at Bloom L1'),
('Pyro','Pyro III','Bueno Ravine',                            6,'outpost',        true, true,  false, 'verified','Citizens for Prosperity; confirmed shop terminal'),
('Pyro','Pyro III','Frigid Knot',                             7,'outpost',        true, true,  false, 'verified','Citizens for Prosperity; confirmed shop terminal'),
('Pyro','Pyro III','Narena''s Rest',                          8,'outpost',        true, true,  false, 'verified','Citizens for Prosperity; confirmed shop terminal'),
('Pyro','Pyro III','Shepherd''s Rest',                        9,'settlement',     true, true,  false, 'verified','Citizens for Prosperity farming outpost'),
('Pyro','Pyro III','Carver''s Ridge',                        10,'outpost',        true, true,  false, 'verified','Headhunters; confirmed shop terminal'),
('Pyro','Pyro III','The Golden Riviera',                     11,'outpost',        true, true,  false, 'verified','Headhunters; trespassing hostile'),
('Pyro','Pyro III','Windfall',                               12,'outpost',        true, true,  false, 'verified','Headhunters; confirmed shop terminal'),
('Pyro','Pyro III','The Yard',                               13,'outpost',        true, true,  false, 'verified','Headhunters; trespassing hostile'),
('Pyro','Pyro III','Prospect Depot',                         14,'outpost',        true, true,  false, 'verified','Independent depot; commodity terminal confirmed'),
('Pyro','Pyro III','Shadowfall',                             15,'outpost',        true, false, false, 'verified','XenoThreat; no confirmed commodity terminal'),

-- Pyro IV ─────────────────────────────────────────────────────
('Pyro','Pyro IV','Pyro IV',                                  1,'planet',         true, false, false, 'verified','Rocky toxic protoplanet; no major hub'),
('Pyro','Pyro IV','Chawla''s Beach',                          2,'outpost',        true, false, false, 'verified',NULL),
('Pyro','Pyro IV','Sacren''s Plot',                           3,'outpost',        true, false, false, 'verified','Canyon outpost ~15 km east of Chawla''s Beach'),
('Pyro','Pyro IV','Fallow Field',                             4,'outpost',        true, false, false, 'verified','Headhunters; inside giant impact crater stone arch'),

-- Pyro V (gas giant + L-point stations) ───────────────────────
('Pyro','Pyro V','Pyro V',                                    1,'planet',         true, false, false, 'verified','Gas giant; 6 moons: Ignis, Adir, Fairo, Fuego, Vatra, Vuur'),
('Pyro','Pyro V','Gaslight',                                  2,'station',        true, true,  false, 'verified','Rough & Ready at Pyro V L2'),
('Pyro','Pyro V','Rod''s Fuel ''N Supplies',                  3,'station',        true, true,  false, 'verified','Rough & Ready at Pyro V L4; formerly PYAM-FARSTAT-5-4'),
('Pyro','Pyro V','Rat''s Nest',                               4,'station',        true, true,  false, 'verified','Rough & Ready at Pyro V L5'),

-- Pyro V moons ────────────────────────────────────────────────
('Pyro','Ignis','Ignis',                                      1,'moon',           true, false, false, 'verified','Innermost Pyro V moon; dry canyons'),
('Pyro','Ignis','Kabir''s Post',                              2,'outpost',        true, true,  false, 'verified','Citizens for Prosperity'),
('Pyro','Ignis','Ashland',                                    3,'outpost',        true, false, false, 'verified','Headhunters scrapyard'),

('Pyro','Adir','Adir',                                        1,'moon',           true, false, false, 'verified','Pyro V moon; 700 km obsidian streak'),
('Pyro','Adir','Prophet''s Peak',                             2,'outpost',        true, false, false, 'verified','On southern cliffside of the Obsidian Crack'),

('Pyro','Fairo','Fairo',                                      1,'moon',           true, false, false, 'verified','Pyro V moon; equatorial ocean'),
('Pyro','Fairo','FEO Canyon Depot',                           2,'outpost',        true, true,  false, 'verified','Confirmed commodity trade'),

('Pyro','Fuego','Fuego',                                      1,'moon',           true, false, false, 'verified','Pyro V moon; iron-sulfide surface'),

('Pyro','Vatra','Vatra',                                      1,'moon',           true, false, false, 'verified','Pyro V moon; hydrocarbon lakes; below -100 C'),
('Pyro','Vatra','Seer''s Canyon',                             2,'outpost',        true, false, false, 'verified','Headhunters scrapyard'),

('Pyro','Vuur','Vuur',                                        1,'moon',           true, false, false, 'verified','Pyro V moon; carbon-rich; ~-20 C'),

-- Pyro VI (Terminus) ──────────────────────────────────────────
-- Ruin Station at Terminus L1 is the main Pyro hub
('Pyro','Pyro VI','Terminus (Pyro VI)',                       1,'station',        true, true,  false, 'verified','Primary station for Pyro VI / Terminus'),
('Pyro','Pyro VI','Pyro VI',                                  2,'planet',         true, false, false, 'verified','Nickname: Terminus; outermost Pyro planet'),
('Pyro','Pyro VI','Ruin Station',                             3,'station',        true, true,  true,  'verified','Main Pyro hub at Terminus L1; XenoThreat; Ghost Arena, refinery, marketplace'),
('Pyro','Pyro VI','Endgame',                                  4,'station',        true, true,  false, 'verified','Rough & Ready at Terminus L3'),
('Pyro','Pyro VI','Dudley & Daughters',                       5,'station',        true, true,  false, 'verified','Citizens for Prosperity at Terminus L4'),
('Pyro','Pyro VI','Megumi Refueling',                         6,'station',        true, true,  false, 'verified','Rough & Ready at Terminus L5; fuel focused'),
('Pyro','Pyro VI','Blackrock Exchange',                       7,'outpost',        true, false, false, 'verified','Citizens for Prosperity'),
('Pyro','Pyro VI','Bullock''s Reach',                         8,'outpost',        true, false, false, 'verified','Citizens for Prosperity'),
('Pyro','Pyro VI','Canard View',                              9,'outpost',        true, false, false, 'verified',NULL),
('Pyro','Pyro VI','Kinder Plots',                            10,'outpost',        true, false, false, 'verified',NULL),
('Pyro','Pyro VI','Last Landings',                           11,'outpost',        true, false, false, 'verified',NULL),
('Pyro','Pyro VI','Rough Landing',                           12,'outpost',        true, false, false, 'verified','Headhunters'),
('Pyro','Pyro VI','Scarper''s Turn',                         13,'outpost',        true, false, false, 'verified','XenoThreat'),
('Pyro','Pyro VI','Stonetree',                               14,'outpost',        true, false, false, 'verified',NULL),
('Pyro','Pyro VI','Supply Gap',                              15,'outpost',        true, false, false, 'verified','Citizens for Prosperity'),
('Pyro','Pyro VI','Watcher''s Depot',                        16,'outpost',        true, false, false, 'verified',NULL),

-- Pyro deep space ─────────────────────────────────────────────
('Pyro','Deep Space','Stanton Gateway (Pyro-side)',           1,'jump-point',     true, true,  false, 'verified',NULL),
('Pyro','Deep Space','Nyx Gateway (Pyro-side)',               2,'jump-point',     true, true,  false, 'verified',NULL),
('Pyro','Deep Space','RAB-Alpha',                             3,'outpost',        true, true,  false, 'verified','Former Pyrotechnic Amalgamated base; outlaw'),

-- ════════════════════════════════════════════════════════════
-- NYX
-- ════════════════════════════════════════════════════════════
-- Nyx I, II, III are NOT accessible; all content is in asteroid belts

('Nyx','Delamar','Levski (Delamar)',                          1,'city',           true, true,  true,  'verified','Main Nyx hub; returned Alpha 4.4; People''s Alliance free-town in Glaciem Ring'),
('Nyx','Delamar','Delamar',                                   2,'asteroid',       true, false, false, 'verified','Large asteroid in Glaciem Ring; hosts Levski'),
('Nyx','Keeger Belt','People''s Service Station Alpha',       1,'rest-stop',      true, true,  false, 'verified','People''s Alliance; added Alpha 4.7'),
('Nyx','Keeger Belt','People''s Service Station Delta',       2,'rest-stop',      true, true,  false, 'verified','People''s Alliance; added Alpha 4.7'),
('Nyx','Keeger Belt','People''s Service Station Lambda',      3,'rest-stop',      true, true,  false, 'verified','People''s Alliance; added Alpha 4.7'),
('Nyx','Keeger Belt','People''s Service Station Theta',       4,'rest-stop',      true, true,  false, 'verified','People''s Alliance; added Alpha 4.7'),
('Nyx','Deep Space','Pyro Gateway (Nyx)',                     1,'jump-point',     true, true,  false, 'verified','At Pyro-Nyx jump inside Nyx; full trade services')

ON CONFLICT (system, body, name) DO UPDATE SET
  location_type       = EXCLUDED.location_type,
  is_active           = EXCLUDED.is_active,
  is_trade_terminal   = EXCLUDED.is_trade_terminal,
  is_freight_elevator = EXCLUDED.is_freight_elevator,
  confidence          = EXCLUDED.confidence,
  notes               = COALESCE(EXCLUDED.notes, public.locations.notes);

-- ─────────────────────────────────────────────────────────────
-- SECTION 5: Verification queries (copy-paste to audit)
-- ─────────────────────────────────────────────────────────────
-- Total locations: SELECT COUNT(*) FROM public.locations;
-- Total commodities: SELECT COUNT(*) FROM public.commodities;
-- Trade terminals by system: SELECT system, COUNT(*) FROM public.locations WHERE is_trade_terminal = true GROUP BY system ORDER BY system;
-- Inactive: SELECT system, body, name, notes FROM public.locations WHERE is_active = false ORDER BY system, body;
-- Duplicate check (expect 0): SELECT system, body, name, COUNT(*) FROM public.locations GROUP BY system, body, name HAVING COUNT(*) > 1;
