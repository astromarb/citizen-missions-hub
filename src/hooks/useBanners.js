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

function groupIntoSets(filenames) {
  const setMap = {};
  filenames.forEach(name => {
    const setName = setNameFromFile(name);
    if (!setMap[setName]) setMap[setName] = [];
    setMap[setName].push({ id: name, src: getUrl(name) });
  });
  return Object.entries(setMap).map(([name, banners]) => ({ name, banners }));
}

export function useBanners() {
  const [sets,    setSets]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use the list-banners edge function which runs with service-role
    // to bypass storage RLS that prevents client-side bucket listing.
    supabase.functions
      .invoke('list-banners')
      .then(({ data, error }) => {
        if (error || !data?.files) { setLoading(false); return; }
        setSets(groupIntoSets(data.files));
        setLoading(false);
      });
  }, []);

  return { sets, loading };
}
