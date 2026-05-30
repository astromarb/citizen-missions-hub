-- Add optional custom name to sessions (set by session creator)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS name TEXT CHECK (char_length(name) <= 24);
