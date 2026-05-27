-- ============================================================
-- Space Stations v4 — wiki category gap-fill
-- Source: starcitizen.tools/Category:Space_stations (May 2026)
-- Run AFTER: 20260527000003_social_features.sql
-- ============================================================
-- Key: ON CONFLICT DO UPDATE so this is safe to re-run.
-- Confidence 'community-sourced' = body/location is best-estimate
--   from naming convention or community docs, not directly verified.
-- ============================================================

INSERT INTO public.locations
  (system, body, name, sort_order,
   location_type, is_active, is_trade_terminal, is_freight_elevator, confidence, notes)
VALUES

-- ════════════════════════════════════════════════════════════
-- STANTON — COMM ARRAYS
-- Naming: ST{planet}-{id}  ST1=Hurston, ST2=Crusader, ST3=ArcCorp, ST4=MicroTech
-- These orbit the planet's region; visitable for CrimeStat hacking missions.
-- ════════════════════════════════════════════════════════════

-- Hurston (5 arrays)
('Stanton','Hurston','Comm Array ST1-02', 30,'comm-array',true,false,false,'verified','UEE comm relay; Hurston orbital region'),
('Stanton','Hurston','Comm Array ST1-13', 31,'comm-array',true,false,false,'verified',NULL),
('Stanton','Hurston','Comm Array ST1-48', 32,'comm-array',true,false,false,'verified',NULL),
('Stanton','Hurston','Comm Array ST1-61', 33,'comm-array',true,false,false,'verified',NULL),
('Stanton','Hurston','Comm Array ST1-92', 34,'comm-array',true,false,false,'verified',NULL),

-- Crusader (4 arrays)
('Stanton','Crusader','Comm Array ST2-28', 10,'comm-array',true,false,false,'verified',NULL),
('Stanton','Crusader','Comm Array ST2-47', 11,'comm-array',true,false,false,'verified',NULL),
('Stanton','Crusader','Comm Array ST2-55', 12,'comm-array',true,false,false,'verified',NULL),
('Stanton','Crusader','Comm Array ST2-76', 13,'comm-array',true,false,false,'verified',NULL),

-- ArcCorp (3 arrays)
('Stanton','ArcCorp','Comm Array ST3-18', 10,'comm-array',true,false,false,'verified',NULL),
('Stanton','ArcCorp','Comm Array ST3-35', 11,'comm-array',true,false,false,'verified',NULL),
('Stanton','ArcCorp','Comm Array ST3-90', 12,'comm-array',true,false,false,'verified',NULL),

-- MicroTech (4 arrays)
('Stanton','MicroTech','Comm Array ST4-22', 25,'comm-array',true,false,false,'verified',NULL),
('Stanton','MicroTech','Comm Array ST4-31', 26,'comm-array',true,false,false,'verified',NULL),
('Stanton','MicroTech','Comm Array ST4-59', 27,'comm-array',true,false,false,'verified',NULL),
('Stanton','MicroTech','Comm Array ST4-64', 28,'comm-array',true,false,false,'verified',NULL),

-- ════════════════════════════════════════════════════════════
-- STANTON — DEEP SPACE / DIPLOMATIC
-- ════════════════════════════════════════════════════════════

-- Jump point to Terra system (canonical but not yet traversable in current build)
('Stanton','Deep Space','Terra Gateway (Stanton)', 4,'jump-point',true,false,false,'verified',
  'Jump point to Terra system; exists canonically in Stanton deep space'),

-- The Ark: multi-species diplomatic + language archive station
-- Run jointly by UEE, Xi''an, Banu, and Kr''thak under the Arkonian Treaty
('Stanton','Deep Space','The Ark', 5,'station',true,false,false,'verified',
  'Multi-species diplomatic station; home of the Universal Language Archive'),

-- ════════════════════════════════════════════════════════════
-- STANTON — BANU EMPORIUMS (additional Wikelo stations)
-- Banu trading asteroid-stations; Selo is near Yela; Dasi + Kinga locations TBC
-- ════════════════════════════════════════════════════════════
('Stanton','Yela','Wikelo Emporium Dasi Station',  5,'station',true,true,false,'community-sourced',
  'Banu asteroid trade station; exact position in Yela belt TBC'),
('Stanton','Yela','Wikelo Emporium Kinga Station', 6,'station',true,true,false,'community-sourced',
  'Banu asteroid trade station; exact position in Yela belt TBC'),

-- ════════════════════════════════════════════════════════════
-- STANTON — UEE NAVY (INS vessels / patrol stations)
-- INS = Imperial Navy Ship; stationed throughout Stanton as patrol outposts.
-- Not trade terminals; relevant as mission destinations or nav waypoints.
-- Exact orbital positions community-sourced from UEE deployment records.
-- ════════════════════════════════════════════════════════════
('Stanton','Deep Space','INS Aniene',    10,'station',true,false,false,'community-sourced','UEE Navy vessel; Stanton patrol'),
('Stanton','Deep Space','INS Dunleavy',  11,'station',true,false,false,'community-sourced','UEE Navy vessel; Stanton patrol'),
('Stanton','Deep Space','INS Flavus',    12,'station',true,false,false,'community-sourced','UEE Navy vessel; Stanton patrol'),
('Stanton','Deep Space','INS Hephaestus',13,'station',true,false,false,'community-sourced','UEE Navy vessel; Stanton patrol'),
('Stanton','Deep Space','INS Malcolm',   14,'station',true,false,false,'community-sourced','UEE Navy vessel; Stanton patrol'),
('Stanton','Deep Space','INS Reilly',    15,'station',true,false,false,'community-sourced','UEE Navy vessel; Stanton patrol'),

-- Other military / advocacy vessels
('Stanton','Deep Space','IAS Hammett',  16,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','IMS Bolliver', 17,'station',true,false,false,'community-sourced',NULL),

-- ════════════════════════════════════════════════════════════
-- STANTON — OB STATIONS (Orbital Buffer / Advocacy outposts)
-- ════════════════════════════════════════════════════════════
('Stanton','Deep Space','OB Heller',          20,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','OB Kobold',          21,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','OB Station Gryphon', 22,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','OB Station Pegasus', 23,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','OP Station Demien',  24,'station',true,false,false,'community-sourced',NULL),

-- ════════════════════════════════════════════════════════════
-- STANTON — MISC STATIONS / FLOTILLAS
-- ════════════════════════════════════════════════════════════
('Stanton','Deep Space','Archangel Station',   30,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','Buloi Sataball Arena',31,'station',true,false,false,'community-sourced','Sataball sports arena; spectator/entertainment station'),
('Stanton','Deep Space','Echo Eleven',         32,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','Encole Station',      33,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','JusticeStar Satellite',34,'station',true,false,false,'community-sourced','UEE correctional/judicial satellite'),
('Stanton','Deep Space','Kedsu Reef',          35,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','TDD Kesner',          36,'station',true,true, false,'community-sourced','Trade & Development Division station'),
('Stanton','Deep Space','Xenia',               37,'station',true,false,false,'community-sourced',NULL),
('Stanton','Deep Space','Yogi Station',        38,'station',true,false,false,'community-sourced',NULL),

-- Flotillas (mobile multi-ship stations)
('Stanton','Deep Space','Bacchus Flotilla', 40,'station',true,false,false,'community-sourced','Mobile flotilla station'),
('Stanton','Deep Space','Lyris Flotilla',   41,'station',true,false,false,'community-sourced','Mobile flotilla station'),
('Stanton','Deep Space','Trise Flotilla',   42,'station',true,false,false,'community-sourced','Mobile flotilla station'),
('Stanton','Deep Space','Yulin Flotilla',   43,'station',true,false,false,'community-sourced','Mobile flotilla station'),

-- ════════════════════════════════════════════════════════════
-- PYRO — PYROTECHNIC AMALGAMATED (PYAM) STATIONS
-- Naming: PYAM-{type}-{planet}-{L-point}
--   SUPVISR-3-4 → supervisor at Pyro III L4
--   SUPVISR-3-5 → supervisor at Pyro III L5
--   EXHANG-0-1  → system-level exchange (0 = whole system)
-- ════════════════════════════════════════════════════════════
('Pyro','Pyro III','PYAM-SUPVISR-3-4', 16,'station',true,false,false,'community-sourced',
  'Pyrotechnic Amalgamated supervisor station at Pyro III L4'),
('Pyro','Pyro III','PYAM-SUPVISR-3-5', 17,'station',true,false,false,'community-sourced',
  'Pyrotechnic Amalgamated supervisor station at Pyro III L5'),
('Pyro','Deep Space','PYAM-EXHANG-0-1', 4,'station',true,true,false,'community-sourced',
  'Pyrotechnic Amalgamated system-level exchange/trade station'),

-- Fortune''s Cross: outlaw station in Pyro
('Pyro','Deep Space','Fortune''s Cross', 5,'station',true,true,false,'community-sourced',
  'Outlaw trade station in Pyro deep space'),

-- Archon Base: Pyro outlaw base
('Pyro','Deep Space','Archon Base', 6,'outpost',true,false,false,'community-sourced',NULL),

-- Pyen''pui.a: Xi''an-style station name; location uncertain — placing in Pyro pending verification
('Pyro','Deep Space','Pyen''pui.a', 7,'station',true,false,false,'community-sourced',
  'Alien-named station; system/body unconfirmed — may belong in Nyx or Xi''an space'),

-- ════════════════════════════════════════════════════════════
-- NYX — SPIDER
-- Major outlaw hub in Nyx system; built into an asteroid in the Glaciem Ring.
-- Separate from Levski; associated with criminal organisations.
-- ════════════════════════════════════════════════════════════
('Nyx','Glaciem Ring','Spider', 3,'station',true,true,false,'community-sourced',
  'Major outlaw station built into asteroid in Nyx Glaciem Ring; criminal hub')

ON CONFLICT (system, body, name) DO UPDATE SET
  location_type       = EXCLUDED.location_type,
  is_active           = EXCLUDED.is_active,
  is_trade_terminal   = EXCLUDED.is_trade_terminal,
  is_freight_elevator = EXCLUDED.is_freight_elevator,
  confidence          = EXCLUDED.confidence,
  notes               = COALESCE(EXCLUDED.notes, public.locations.notes);
