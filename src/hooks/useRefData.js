import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import { COMMODITIES as STATIC_COMMODITIES } from '@/data/commodities.js';
import { SYSTEMS as STATIC_SYSTEMS } from '@/data/locations.js';
import { SHIPS as STATIC_SHIPS, shipsByName as STATIC_SHIPS_BY_NAME } from '@/data/ships.js';

// Converts static string arrays to the rich { name, body } format
const staticToRich = (sysMap) => {
  const out = {};
  for (const [sys, locs] of Object.entries(sysMap)) {
    out[sys] = locs.map(name => ({ name, body: '' }));
  }
  return out;
};

export function useRefData(enabled = true) {
  const [commodities, setCommodities] = useState(STATIC_COMMODITIES);
  const [systemsMap, setSystemsMap] = useState(staticToRich(STATIC_SYSTEMS));
  const [ships, setShips] = useState(STATIC_SHIPS);
  const [shipsByName, setShipsByName] = useState(STATIC_SHIPS_BY_NAME);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }

    async function load() {
      const [commRes, locRes, shipRes] = await Promise.all([
        supabase.from('commodities').select('name').order('sort_order').order('name'),
        supabase.from('locations').select('system, body, name, location_type').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('ships').select('name, manufacturer, value').order('sort_order').order('name'),
      ]);

      if (!commRes.error && commRes.data?.length) {
        setCommodities(commRes.data.map(c => c.name));
      }

      if (!shipRes.error && shipRes.data?.length) {
        const list = shipRes.data.map(s => ({ name: s.name, manufacturer: s.manufacturer, value: Number(s.value) || 0 }));
        setShips(list);
        setShipsByName(Object.fromEntries(list.map(s => [s.name, s])));
      }

      const EXCLUDED_TYPES = new Set(['moon', 'comm-array', 'jump-point']);

      if (!locRes.error && locRes.data?.length) {
        const map = {};
        for (const loc of locRes.data) {
          if (EXCLUDED_TYPES.has(loc.location_type)) continue;
          if (!map[loc.system]) map[loc.system] = [];
          map[loc.system].push({ name: loc.name, body: loc.body });
        }
        setSystemsMap(map);
      }

      setLoading(false);
    }
    load();
  }, [enabled]);

  return { commodities, systemsMap, ships, shipsByName, loading };
}
