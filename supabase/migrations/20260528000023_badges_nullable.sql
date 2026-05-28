-- Make badges nullable so NULL = "never configured" (show earned fallback)
-- and [] = "explicitly set to none" (show nothing).
ALTER TABLE public.profiles
  ALTER COLUMN badges DROP NOT NULL,
  ALTER COLUMN badges SET DEFAULT NULL;

-- Rows with '{}' are the factory default — treat them as unconfigured.
UPDATE public.profiles SET badges = NULL WHERE badges = '{}';
