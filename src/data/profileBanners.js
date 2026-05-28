import { supabase } from '../lib/supabase.js';

// Returns a banner descriptor for any filename stored in the images bucket.
// profile.banner_panel now stores the raw filename (e.g. "alpha-1.png").
export const getBanner = (filename) => {
  if (!filename) return null;
  return {
    id:         filename,
    src:        supabase.storage.from('images').getPublicUrl(filename).data.publicUrl,
    fallbackBg: '#0a0a0a',
    textColor:  '#fff',
  };
};
