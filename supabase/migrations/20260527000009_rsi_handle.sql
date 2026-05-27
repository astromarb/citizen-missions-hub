ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rsi_handle TEXT;
