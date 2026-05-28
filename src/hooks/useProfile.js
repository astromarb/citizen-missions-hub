import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

const SELECT_FIELDS = 'id, callsign, color, avatar_url, home_region, onboarding_complete, auec_balance, auec_balance_verified_at, rsi_handle, badges, banner_panel';

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(SELECT_FIELDS)
        .eq('id', userId)
        .single();
      if (error) console.error('useProfile load:', error);
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
    // Upsert the changes, then reload the full profile so React state
    // always reflects the actual DB row (avoids silent partial-update bugs).
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates }, { onConflict: 'id' });
    if (error) {
      console.error('updateProfile:', error);
      return { error };
    }
    await load();
    return { error: null };
  }, [userId, load]);

  return { profile, loading, checkCallsign, updateProfile, reload: load };
}
