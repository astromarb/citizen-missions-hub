ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auec_balance        BIGINT,
  ADD COLUMN IF NOT EXISTS auec_balance_verified_at TIMESTAMPTZ;
