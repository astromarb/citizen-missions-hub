-- Add Medical and Ship Mining contract types; badge_config table for admin editing

-- 1. Widen type constraint
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_type_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_type_check
  CHECK (type IN (
    'Hauling - Planetary',
    'Hauling - Stellar',
    'Hauling - Interstellar',
    'Salvaging',
    'Refueling',
    'Hand Mining',
    'Trading',
    'Medical',
    'Ship Mining'
  ));

-- 2. Badge configuration table (admin-editable per-badge appearance + description)
CREATE TABLE IF NOT EXISTS public.badge_config (
  badge_id     text PRIMARY KEY,
  label        text NOT NULL DEFAULT '',
  description  text NOT NULL DEFAULT '',
  bg_color     text NOT NULL DEFAULT '#1a1a1a',
  accent_color text NOT NULL DEFAULT '#ffffff',
  shape        text NOT NULL DEFAULT 'square',
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.badge_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badge_config"
  ON public.badge_config FOR SELECT USING (true);

CREATE POLICY "Admins can manage badge_config"
  ON public.badge_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed defaults
INSERT INTO public.badge_config (badge_id, label, description, bg_color, accent_color, shape)
VALUES
  ('alpha',                   'α',           'Been around since the very beginning.',       '#100d00', '#e8c030', 'square'),
  ('home_region_area18',      'AREA18',      'Primary residence: Area 18, ArcCorp.',        '#0b1f0b', '#5dd65d', 'square'),
  ('home_region_lorville',    'LORVILLE',    'Primary residence: Lorville, Hurston.',       '#060d1c', '#4d8fd4', 'square'),
  ('home_region_orison',      'ORISON',      'Primary residence: Orison, Crusader.',        '#040f14', '#2ec9d4', 'square'),
  ('home_region_new_babbage', 'NEW BABBAGE', 'Primary residence: New Babbage, MicroTech.', '#060b1f', '#55aaff', 'square')
ON CONFLICT (badge_id) DO NOTHING;
