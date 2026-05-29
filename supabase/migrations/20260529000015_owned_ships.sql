-- Add owned_ships JSONB column to profiles for fleet net worth tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS owned_ships JSONB NOT NULL DEFAULT '[]';
