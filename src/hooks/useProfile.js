import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, callsign, color, avatar_url, home_region, onboarding_complete')
      .eq('id', userId)
      .single();
    if (!error && data) setProfile(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const checkCallsign = useCallback(async (callsign) => {
    const query = supabase
      .from('profiles')
      .select('id')
      .eq('callsign', callsign);
    if (userId) query.neq('id', userId);
    const { data } = await query;
    return { available: !data || data.length === 0 };
  }, [userId]);

  const updateProfile = useCallback(async (updates) => {
    if (!userId) return { error: new Error('No user') };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('id, callsign, color, avatar_url, home_region, onboarding_complete')
      .single();
    if (!error && data) setProfile(data);
    return { error };
  }, [userId]);

  return { profile, loading, checkCallsign, updateProfile, reload: load };
}
