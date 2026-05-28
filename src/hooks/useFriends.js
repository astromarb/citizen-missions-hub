import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

const profileFields = 'id, callsign, color, avatar_url, home_region, badges';

export function useFriends(userId, enabled = true) {
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId || !enabled) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id, status, requester_id, addressee_id,
        requester:profiles!requester_id(${profileFields}),
        addressee:profiles!addressee_id(${profileFields})
      `);

    if (error) { console.error('useFriends:', error); setLoading(false); return; }

    const accepted = [];
    const incoming = [];
    const outgoing = [];

    for (const row of (data || [])) {
      const iAmRequester = row.requester_id === userId;
      const other = iAmRequester ? row.addressee : row.requester;
      if (!other) continue;
      const entry = { friendshipId: row.id, ...other };

      if (row.status === 'accepted') {
        accepted.push(entry);
      } else if (row.status === 'pending') {
        if (iAmRequester) outgoing.push(entry);
        else incoming.push(entry);
      }
    }

    setFriends(accepted);
    setPending(incoming);
    setSent(outgoing);
    setLoading(false);
  }, [userId, enabled]);

  useEffect(() => { load(); }, [load]);

  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 1) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select(profileFields)
      .ilike('callsign', `%${query}%`)
      .neq('id', userId)
      .limit(20);
    if (error) return [];
    return data || [];
  }, [userId]);

  const sendRequest = useCallback(async (addresseeId) => {
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: userId, addressee_id: addresseeId });
    if (!error) await load();
    return { error };
  }, [userId, load]);

  const respond = useCallback(async (friendshipId, accept) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', friendshipId);
    if (!error) await load();
    return { error };
  }, [load]);

  const remove = useCallback(async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (!error) await load();
    return { error };
  }, [load]);

  return { friends, pending, sent, loading, searchUsers, sendRequest, respond, remove, reload: load };
}
