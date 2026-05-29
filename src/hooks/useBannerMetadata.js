import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useBannerMetadata() {
  const [itemMeta, setItemMeta] = useState({});  // { filename: { displayName, description } }
  const [setMeta,  setSetMeta]  = useState({});  // { setName: { description } }
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from('banner_items').select('filename, display_name, description'),
      supabase.from('banner_sets_meta').select('set_name, description'),
    ]).then(([items, sets]) => {
      if (cancelled) return;
      const im = {};
      for (const r of (items.data ?? [])) {
        im[r.filename] = { displayName: r.display_name || '', description: r.description || '' };
      }
      const sm = {};
      for (const r of (sets.data ?? [])) {
        sm[r.set_name] = { description: r.description || '' };
      }
      setItemMeta(im);
      setSetMeta(sm);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return { itemMeta, setMeta, loading };
}
