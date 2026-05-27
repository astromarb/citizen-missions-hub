-- ============================================================
-- SC Mission Board — Reference Tables
-- Run in: Supabase → SQL Editor → New Query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.commodities (
  id          BIGSERIAL   PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  sort_order  INT         NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.locations (
  id          BIGSERIAL   PRIMARY KEY,
  system      TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  sort_order  INT         NOT NULL DEFAULT 0,
  UNIQUE (system, name)
);

ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commodities_select" ON public.commodities FOR SELECT TO authenticated USING (true);
CREATE POLICY "commodities_insert" ON public.commodities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "commodities_update" ON public.commodities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "commodities_delete" ON public.commodities FOR DELETE TO authenticated USING (true);

CREATE POLICY "locations_select" ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "locations_insert" ON public.locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "locations_update" ON public.locations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "locations_delete" ON public.locations FOR DELETE TO authenticated USING (true);

-- ── Commodities seed ──────────────────────────────────────────
INSERT INTO public.commodities (name, sort_order) VALUES
  ('Agricultural Supplies', 1), ('Agricium', 2), ('Aluminum', 3), ('Ammonia', 4),
  ('Aphorite', 5), ('Argon', 6), ('Astatine', 7), ('Audio-Visual Equipment', 8),
  ('Beryl', 9), ('Bexalite', 10), ('Bioplastic', 11), ('Borase', 12),
  ('Carbon', 13), ('Carbon Silk', 14), ('Chlorine', 15), ('CK13 Gid Seed Blend', 16),
  ('Cobalt', 17), ('Compboard', 18), ('Construction Materials', 19), ('Copper', 20),
  ('Corundum', 21), ('Diamond', 22), ('Distilled Spirits', 23), ('Dynaflex', 24),
  ('E''tam', 25), ('Fluorine', 26), ('Foam', 27), ('Fresh Food', 28),
  ('Gold', 29), ('Laranite', 30), ('Medical Supplies', 31), ('Processed Food', 32),
  ('Quantanium', 33), ('Recycled Material Composite', 34), ('Scrap', 35),
  ('Steel', 36), ('Stims', 37), ('Titanium', 38), ('Tungsten', 39),
  ('Waste', 40), ('WiDoW', 41)
ON CONFLICT (name) DO NOTHING;

-- ── Locations seed ────────────────────────────────────────────
INSERT INTO public.locations (system, body, name, sort_order) VALUES
  -- Stanton: ArcCorp
  ('Stanton','ArcCorp','Area 18 (ArcCorp)',1),
  ('Stanton','ArcCorp','ARC-L1 Wide Forest Station',2),
  ('Stanton','ArcCorp','ARC-L2 Lively Pathway Station',3),
  ('Stanton','ArcCorp','ARC-L3 Modern Express Station',4),
  ('Stanton','ArcCorp','ARC-L4 Faint Glen Station',5),
  ('Stanton','ArcCorp','ARC-L5 Yellow Core Station',6),
  ('Stanton','ArcCorp','Baijini Point',7),
  ('Stanton','ArcCorp','ARC Mining 045',8),
  ('Stanton','ArcCorp','ARC Mining 056',9),
  ('Stanton','ArcCorp','ARC Mining 061',10),
  -- Stanton: Hurston
  ('Stanton','Hurston','Lorville (Hurston)',1),
  ('Stanton','Hurston','HUR-L1 Green Glade Station',2),
  ('Stanton','Hurston','HUR-L2 Faithful Dream Station',3),
  ('Stanton','Hurston','HUR-L3 Thundering Express Station',4),
  ('Stanton','Hurston','HUR-L4 Melodic Fields Station',5),
  ('Stanton','Hurston','HUR-L5 High Course Station',6),
  ('Stanton','Hurston','Everus Harbor',7),
  ('Stanton','Hurston','Brio''s Breaker Yard',8),
  ('Stanton','Hurston','Reclamation & Disposal Orinth',9),
  ('Stanton','Hurston','Attritus OLP',10),
  ('Stanton','Hurston','Vivere OLP',11),
  ('Stanton','Hurston','Lamina OLP',12),
  ('Stanton','Hurston','Ruptura OLP',13),
  -- Stanton: MicroTech
  ('Stanton','MicroTech','New Babbage (MicroTech)',1),
  ('Stanton','MicroTech','MIC-L1 Shallow Frontier Station',2),
  ('Stanton','MicroTech','MIC-L2 Long Forest Station',3),
  ('Stanton','MicroTech','MIC-L3 Endless Odyssey Station',4),
  ('Stanton','MicroTech','MIC-L4 Red Crossroads Station',5),
  ('Stanton','MicroTech','MIC-L5 Modern Icarus Station',6),
  ('Stanton','MicroTech','Port Tressler',7),
  ('Stanton','MicroTech','RAYARI Cantwell Research Outpost',8),
  ('Stanton','MicroTech','RAYARI McGrath Research Outpost',9),
  ('Stanton','MicroTech','RAYARI Deltana Research Outpost',10),
  ('Stanton','MicroTech','RAYARI Anvik Research Outpost',11),
  -- Stanton: Crusader
  ('Stanton','Crusader','Orison (Crusader)',1),
  ('Stanton','Crusader','CRU-L1 Ambitious Dream Station',2),
  ('Stanton','Crusader','CRU-L4 Shallow Fields Station',3),
  ('Stanton','Crusader','CRU-L5 Beautiful Glen Station',4),
  ('Stanton','Crusader','Seraphim Station',5),
  -- Stanton: moons
  ('Stanton','Yela','Yela',1),
  ('Stanton','Yela','Grim HEX',2),
  ('Stanton','Yela','INS Jericho',3),
  ('Stanton','Daymar','Daymar',1),
  ('Stanton','Daymar','Shubin Mining SM0-22',2),
  ('Stanton','Cellin','Cellin',1),
  ('Stanton','Aberdeen','Aberdeen',1),
  ('Stanton','Aberdeen','Security Post Kareah',2),
  ('Stanton','Arial','Arial',1),
  ('Stanton','Magda','Magda',1),
  ('Stanton','Ita','Ita',1),
  ('Stanton','Wala','Wala',1),
  ('Stanton','Wala','ICC ScanHub Stanton',2),
  -- Stanton: deep space / system-level
  ('Stanton','Deep Space','Magnus Gateway',1),
  ('Stanton','Deep Space','Pyro Gateway (Stanton)',2),
  ('Stanton','Deep Space','Covalex Hub Gundo',3),
  -- Pyro
  ('Pyro','Pyro IV','Ruin Station',1),
  ('Pyro','Pyro V','Checkmate',1),
  ('Pyro','Deep Space','Orbituary',1),
  ('Pyro','Pyro I','Pyro I',1),
  ('Pyro','Pyro II','Bloom (Pyro II)',1),
  ('Pyro','Pyro III','Monox (Pyro III)',1),
  ('Pyro','Pyro IV','Pyro IV',2),
  ('Pyro','Pyro V','Pyro V',2),
  ('Pyro','Pyro VI','Terminus (Pyro VI)',1),
  ('Pyro','Pyro II','Adir',2),
  ('Pyro','Pyro II','Ignis',3),
  ('Pyro','Pyro III','Fairo',2),
  ('Pyro','Pyro III','Fuego',3),
  ('Pyro','Pyro VI','Vatra',2),
  ('Pyro','Pyro VI','Vuur',3),
  ('Pyro','Deep Space','Akiro Cluster',2),
  -- Nyx
  ('Nyx','Delamar','Levski (Delamar)',1),
  ('Nyx','Delamar','Delamar',2)
ON CONFLICT (system, name) DO NOTHING;
