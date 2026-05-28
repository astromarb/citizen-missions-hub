-- Rename city-named locations to their in-game spaceport/port names.
-- Also patch any existing contract_waypoints rows that stored the old names.

UPDATE public.locations SET name = 'Teasa Spaceport'
  WHERE name = 'Lorville (Hurston)' AND body = 'Hurston' AND system = 'Stanton';

UPDATE public.locations SET name = 'Area18'
  WHERE name = 'Area 18 (ArcCorp)' AND body = 'ArcCorp' AND system = 'Stanton';

UPDATE public.locations SET name = 'New Babbage'
  WHERE name = 'New Babbage (MicroTech)' AND body = 'MicroTech' AND system = 'Stanton';

UPDATE public.locations SET name = 'Orison'
  WHERE name = 'Orison (Crusader)' AND body = 'Crusader' AND system = 'Stanton';

-- Back-fill existing waypoints that used the old city-qualified names.
UPDATE public.contract_waypoints SET location_name = 'Teasa Spaceport'
  WHERE location_name = 'Lorville (Hurston)';

UPDATE public.contract_waypoints SET location_name = 'Area18'
  WHERE location_name = 'Area 18 (ArcCorp)';

UPDATE public.contract_waypoints SET location_name = 'New Babbage'
  WHERE location_name = 'New Babbage (MicroTech)';

UPDATE public.contract_waypoints SET location_name = 'Orison'
  WHERE location_name = 'Orison (Crusader)';
