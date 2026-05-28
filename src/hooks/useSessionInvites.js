import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase.js';

export function useSessionInvites(myProfileId, enabled = true) {
  const [incoming, setIncoming] = useState([]);
  const channelRef = useRef(null);

  const load = useCallback(async () => {
    if (!myProfileId) { setIncoming([]); return; }
    const { data, error } = await supabase
      .from('session_invites')
      .select(`
        id, session_id, status, created_at,
        inviter:profiles!inviter_id ( id, callsign, color, avatar_url ),
        session:sessions ( id, date )
      `)
      .eq('invitee_id', myProfileId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!error) setIncoming(data || []);
  }, [myProfileId]);

  useEffect(() => {
    if (!enabled || !myProfileId) return;
    load();
    channelRef.current = supabase
      .channel('session-invites-' + myProfileId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_invites' }, load)
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [load, enabled, myProfileId]);

  const createInvite = useCallback(async (sessionId, inviteeId) => {
    if (!myProfileId) return false;
    const { error } = await supabase.from('session_invites').insert({
      session_id: sessionId,
      inviter_id: myProfileId,
      invitee_id: inviteeId,
    });
    if (error) { console.error('createInvite:', error); return false; }
    return true;
  }, [myProfileId]);

  const respondToInvite = useCallback(async (inviteId, accept, sessionId) => {
    const status = accept ? 'accepted' : 'declined';
    const { error } = await supabase
      .from('session_invites').update({ status }).eq('id', inviteId);
    if (error) { console.error('respondToInvite:', error); return false; }
    if (accept) {
      const { error: spErr } = await supabase
        .from('session_players').insert({ session_id: sessionId, profile_id: myProfileId });
      if (spErr && spErr.code !== '23505') {
        console.error('respondToInvite session_players:', spErr);
        return false;
      }
    }
    await load();
    return accept ? sessionId : true;
  }, [myProfileId, load]);

  return { incoming, createInvite, respondToInvite };
}
