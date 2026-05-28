-- Add player-selectable badge array to profiles.
-- Stores up to MAX_BADGES badge IDs from the PRESET_BADGES list in the frontend.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{}';
