-- Add per-cargo pickup/dropoff location fields.
-- Allows a single contract to have cargo items going to/from different legs.
ALTER TABLE public.cargo_items
  ADD COLUMN IF NOT EXISTS from_location TEXT,
  ADD COLUMN IF NOT EXISTS to_location TEXT;
