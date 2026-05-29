import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase.js';

export function useMessages(myProfileId, enabled = true) {
  const [inbox, setInbox] = useState([]);
  const [sent,  setSent]  = useState([]);
  const channelRef = useRef(null);

  const load = useCallback(async () => {
    if (!myProfileId) { setInbox([]); setSent([]); return; }

    const [inboxRes, sentRes] = await Promise.all([
      supabase
        .from('messages')
        .select(`id, content, is_system, created_at, read_at,
          sender:profiles!sender_id(id, callsign, color, avatar_url)`)
        .eq('recipient_id', myProfileId)
        .order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select(`id, content, is_system, created_at, read_at,
          recipient:profiles!recipient_id(id, callsign, color, avatar_url)`)
        .eq('sender_id', myProfileId)
        .order('created_at', { ascending: false }),
    ]);

    if (!inboxRes.error) setInbox(inboxRes.data || []);
    if (!sentRes.error)  setSent(sentRes.data  || []);
  }, [myProfileId]);

  useEffect(() => {
    if (!enabled || !myProfileId) return;
    load();
    channelRef.current = supabase
      .channel('messages-' + myProfileId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [load, enabled, myProfileId]);

  const sendMessage = useCallback(async (recipientId, content) => {
    if (!myProfileId || !content.trim()) return false;
    const { error } = await supabase.from('messages').insert({
      sender_id: myProfileId,
      recipient_id: recipientId,
      content: content.trim(),
    });
    if (error) { console.error('sendMessage:', error); return false; }
    await load();
    return true;
  }, [myProfileId, load]);

  const markRead = useCallback(async (messageId) => {
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('read_at', null);
    setInbox(prev => prev.map(m => m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m));
  }, []);

  const unreadCount = inbox.filter(m => !m.read_at).length;

  return { inbox, sent, sendMessage, markRead, unreadCount };
}
