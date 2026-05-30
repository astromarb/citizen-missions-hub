-- ============================================================
-- Badge custom icon support
-- Admins can upload a small image per badge to use as the symbol
-- in place of the default letters. NULL = fall back to letters.
-- ============================================================

ALTER TABLE public.badge_config
  ADD COLUMN IF NOT EXISTS icon_url TEXT;
