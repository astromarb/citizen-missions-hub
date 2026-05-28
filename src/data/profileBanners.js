import { supabase } from '../lib/supabase.js';

const url = (file) => supabase.storage.from('images').getPublicUrl(file).data.publicUrl;

export const BANNERS = [
  { id: 'asteroid',   label: 'Asteroid Mining Base', src: url('asteroid.png'),   fallbackBg: '#0d1020', textColor: '#fff' },
  { id: 'ice-world',  label: 'Ice World',            src: url('ice-world.png'),  fallbackBg: '#0e1e2e', textColor: '#fff' },
  { id: 'cloud-city', label: 'Cloud City',           src: url('cloud-city.png'), fallbackBg: '#1c1408', textColor: '#fff' },
];

export const getBanner = (id) => BANNERS.find(b => b.id === id) ?? null;
