import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

// "alpha-1.png"        → "Alpha Set"
// "Beta-Players-2.png" → "Beta Players Set"
function setNameFromFile(filename) {
  const base  = filename.replace(/\.[^.]+$/, '');
  const parts = base.split('-');
  const last  = parts[parts.length - 1];
  const prefix = /^\d+$/.test(last) ? parts.slice(0, -1) : parts;
  return prefix.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + ' Set';
}

function itemUrl(item) {
  if (typeof item === 'string') {
    return supabase.storage.from('images').getPublicUrl(item).data.publicUrl;
  }
  if (item.url) return item.url;
  const base = supabase.storage.from('images').getPublicUrl(item.name).data.publicUrl;
  return item.updatedAt ? `${base}?t=${encodeURIComponent(item.updatedAt)}` : base;
}

function groupIntoSets(fileObjects) {
  const setMap = {};
  fileObjects.forEach((item) => {
    const name = typeof item === 'string' ? item : item.name;
    if (!name) return;
    const setName = setNameFromFile(name);
    if (!setMap[setName]) setMap[setName] = [];
    setMap[setName].push({ id: name, src: itemUrl(item) });
  });
  return Object.entries(setMap).map(([name, banners]) => ({ name, banners }));
}

export function useBanners() {
  const [sets,    setSets]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    setLoading(true);
    supabase.functions
      .invoke('list-banners')
      .then(({ data, error }) => {
        if (error || !data?.files) { setLoading(false); return; }
        setSets(groupIntoSets(data.files));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  return { sets, loading, refresh };
}

// Returns a service-role signed URL for a single banner filename by going
// through the list-banners edge function (client-side createSignedUrl fails
// RLS on public buckets). Falls back to the public URL while loading.
export function useBannerUrl(filename) {
  const [src, setSrc] = useState(() =>
    filename ? supabase.storage.from('images').getPublicUrl(filename).data.publicUrl : null
  );

  useEffect(() => {
    if (!filename) { setSrc(null); return; }
    supabase.functions
      .invoke('list-banners')
      .then(({ data, error }) => {
        if (error || !data?.files) return;
        const match = data.files.find(f =>
          (typeof f === 'string' ? f : f.name) === filename
        );
        if (match?.url) setSrc(match.url);
      })
      .catch(() => {});
  }, [filename]);

  return src;
}
