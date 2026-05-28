-- Fix handle_new_user trigger to handle callsign uniqueness conflicts.
-- Previously, if two users had the same Discord display name, the INSERT
-- would fail on the callsign UNIQUE constraint, leaving the second user
-- with no profile row. Now we append _2, _3, etc. until we find a free slot.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_callsign TEXT;
  candidate     TEXT;
  suffix        INT := 1;
BEGIN
  base_callsign := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'),  ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'user_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'),      ''),
    split_part(NEW.email, '@', 1),
    'Pilot'
  );

  -- Truncate to 20 chars (max callsign length enforced by the app)
  base_callsign := LEFT(base_callsign, 20);
  candidate     := base_callsign;

  -- Find a unique callsign slot
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, callsign, avatar_url)
      VALUES (
        NEW.id,
        candidate,
        NEW.raw_user_meta_data->>'avatar_url'
      )
      ON CONFLICT (id) DO NOTHING;
      -- If the INSERT succeeded (or was a no-op on id), we're done
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- callsign was taken; try base_callsign_2, _3, …
      suffix    := suffix + 1;
      candidate := LEFT(base_callsign, 17) || '_' || suffix::TEXT;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;
