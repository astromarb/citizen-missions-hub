import { useState, useEffect } from 'react';
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
  // Prefer signed URL (bypasses CDN cache), fall back to public URL
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

  useEffect(() => {
    supabase.functions
      .invoke('list-banners')
      .then(({ data, error }) => {
        if (error || !data?.files) { setLoading(false); return; }
        setSets(groupIntoSets(data.files));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { sets, loading };
}
