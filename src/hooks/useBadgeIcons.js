import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase.js';

// Module-level cache so every badge on the page shares a single fetch.
let cache = null;      // { [badge_id]: icon_url }
let inflight = null;

async function fetchIcons() {
  if (cache) return cache;
  if (!inflight) {
    inflight = supabase
      .from('badge_config')
      .select('badge_id, icon_url')
      .then(({ data }) => {
        cache = {};
        (data || []).forEach(r => { if (r.icon_url) cache[r.badge_id] = r.icon_url; });
        return cache;
      })
      .catch(() => { cache = {}; return cache; });
  }
  return inflight;
}

// Call after an admin saves a new icon so badges refresh without reload.
export function invalidateBadgeIcons() {
  cache = null;
  inflight = null;
}

// Returns the uploaded icon URL for a badge_id, or null to use letters.
export function useBadgeIcon(badgeId) {
  const [icon, setIcon] = useState(() => cache?.[badgeId] ?? null);
  useEffect(() => {
    let active = true;
    fetchIcons().then(c => { if (active) setIcon(c?.[badgeId] ?? null); });
    return () => { active = false; };
  }, [badgeId]);
  return icon;
}
