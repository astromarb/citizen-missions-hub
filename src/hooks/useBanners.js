import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const getUrl = (name) => supabase.storage.from('images').getPublicUrl(name).data.publicUrl;

// "alpha-1.png"        → "Alpha Set"
// "Beta-Players-2.png" → "Beta Players Set"
function setNameFromFile(filename) {
  const base  = filename.replace(/\.[^.]+$/, '');
  const parts = base.split('-');
  const last  = parts[parts.length - 1];
  const prefix = /^\d+$/.test(last) ? parts.slice(0, -1) : parts;
  return prefix.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + ' Set';
}

export function useBanners() {
  const [sets,    setSets]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.storage
      .from('images')
      .list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } })
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }

        const imgs = data.filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name));

        const setMap = {};
        imgs.forEach(f => {
          const name = setNameFromFile(f.name);
          if (!setMap[name]) setMap[name] = [];
          setMap[name].push({ id: f.name, src: getUrl(f.name) });
        });

        setSets(Object.entries(setMap).map(([name, banners]) => ({ name, banners })));
        setLoading(false);
      });
  }, []);

  return { sets, loading };
}
