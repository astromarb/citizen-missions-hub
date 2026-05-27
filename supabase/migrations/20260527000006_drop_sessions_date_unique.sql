-- Remove the UNIQUE constraint on sessions.date.
-- Multiple sessions per day are now supported (keyed by id in the app).
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_date_key;
