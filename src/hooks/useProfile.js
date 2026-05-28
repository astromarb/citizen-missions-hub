import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, callsign, color, avatar_url, home_region, onboarding_complete, auec_balance, auec_balance_verified_at, rsi_handle')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
    } catch (e) {
      console.error('useProfile load:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const checkCallsign = useCallback(async (callsign) => {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('callsign', callsign);
    if (userId) query = query.neq('id', userId);
    const { data } = await query;
    return { available: !data || data.length === 0 };
  }, [userId]);

  const updateProfile = useCallback(async (updates) => {
    if (!userId) return { error: new Error('No user') };
    // Use upsert so a new user whose trigger-created profile is missing
    // still gets created with the correct data.
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates }, { onConflict: 'id' })
      .select('id, callsign, color, avatar_url, home_region, onboarding_complete, auec_balance, auec_balance_verified_at, rsi_handle')
      .single();
    if (!error && data) setProfile(data);
    return { error };
  }, [userId]);

  return { profile, loading, checkCallsign, updateProfile, reload: load };
}
