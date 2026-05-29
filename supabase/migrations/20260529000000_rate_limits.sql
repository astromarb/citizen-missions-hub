-- Add rate-limit timestamp columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS callsign_changed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS home_region_changed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rsi_handle_changed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auec_verification_timestamps TIMESTAMPTZ[] NOT NULL DEFAULT '{}';
