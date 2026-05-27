import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import { COMMODITIES as STATIC_COMMODITIES } from '@/data/commodities.js';
import { SYSTEMS as STATIC_SYSTEMS } from '@/data/locations.js';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }

    async function load() {
      const [commRes, locRes] = await Promise.all([
        supabase.from('commodities').select('name').order('sort_order').order('name'),
        supabase.from('locations').select('system, body, name').order('sort_order').order('name'),
      ]);

      if (!commRes.error && commRes.data?.length) {
        setCommodities(commRes.data.map(c => c.name));
      }

      if (!locRes.error && locRes.data?.length) {
        const map = {};
        for (const loc of locRes.data) {
          if (!map[loc.system]) map[loc.system] = [];
          map[loc.system].push({ name: loc.name, body: loc.body });
        }
        setSystemsMap(map);
      }

      setLoading(false);
    }
    load();
  }, [enabled]);

  return { commodities, systemsMap, loading };
}
