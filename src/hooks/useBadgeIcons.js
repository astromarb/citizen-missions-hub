import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase.js';

// Module-level cache so every badge on the page shares a single fetch.
let cache = null;
let inflight = null;
// Set of refresh callbacks, one per mounted useBadgeIcon instance.
const listeners = new Set();

async function fetchIcons() {
  if (cache) return cache;
  if (!inflight) {
    inflight = supabase
      .from('badge_config')
      .select('badge_id, icon_url')
      .then(({ data }) => {
        cache = {};
        (data || []).forEach(r => { if (r.icon_url) cache[r.badge_id] = r.icon_url; });
        inflight = null;
        return cache;
      })
      .catch(() => { cache = {}; inflight = null; return cache; });
  }
  return inflight;
}

// Call after an admin saves a new icon, or when realtime signals a change.
export function invalidateBadgeIcons() {
  cache = null;
  inflight = null;
  listeners.forEach(fn => fn());
}

// Subscribe to changes from other users (admin on a different session).
supabase
  .channel('badge_config_realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'badge_config' }, () => {
    invalidateBadgeIcons();
  })
  .subscribe();

// Returns the uploaded icon URL for a badge_id, or null to use letters.
export function useBadgeIcon(badgeId) {
  const [icon, setIcon] = useState(() => cache?.[badgeId] ?? null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick(t => t + 1);
    listeners.add(refresh);
    return () => listeners.delete(refresh);
  }, []);

  useEffect(() => {
    let active = true;
    fetchIcons().then(c => { if (active) setIcon(c?.[badgeId] ?? null); });
    return () => { active = false; };
  }, [badgeId, tick]);

  return icon;
}
