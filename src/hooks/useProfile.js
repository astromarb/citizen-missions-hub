import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

const SELECT_FIELDS = 'id, callsign, color, avatar_url, home_region, onboarding_complete, auec_balance, auec_balance_verified_at, rsi_handle, badges, banner_panel, callsign_changed_at, home_region_changed_at, rsi_handle_changed_at, auec_verification_timestamps, is_admin, owned_ships';

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
    // UPDATE (not upsert) — the trigger always creates the profile row on
    // first sign-in, so a plain update is correct and avoids the NOT NULL
    // callsign violation that upsert hits when RLS hides the existing row
    // from the conflict check.
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) {
      console.error('updateProfile:', error);
      return { error };
    }
    await load();
    return { error: null };
  }, [userId, load]);

  return { profile, loading, checkCallsign, updateProfile, reload: load };
}
