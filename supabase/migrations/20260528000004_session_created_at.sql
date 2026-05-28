-- Add created_at timestamp to sessions so the exact creation time
-- is stored and can be displayed to pilots in their local timezone.
-- ADD COLUMN IF NOT EXISTS is safe to run on projects where Supabase
-- already auto-added this column.
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
