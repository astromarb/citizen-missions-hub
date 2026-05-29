import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    '[CMH] Missing Supabase env vars.\n' +
    '  VITE_SUPABASE_URL:', url ? '✓' : '✗ MISSING',
    '\n  VITE_SUPABASE_ANON_KEY:', key ? '✓' : '✗ MISSING',
    '\nCheck your Vercel environment variables.'
  );
}

export const supabase = createClient(
  url  || 'https://placeholder.supabase.co',
  key  || 'placeholder-key',
);
