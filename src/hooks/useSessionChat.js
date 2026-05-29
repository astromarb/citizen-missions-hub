import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase.js';

export function useSessionChat(sessionId, myProfileId, enabled = true) {
  const [messages, setMessages] = useState([]);
  const channelRef = useRef(null);

  const load = useCallback(async () => {
    if (!sessionId || !myProfileId) { setMessages([]); return; }
    const { data, error } = await supabase
      .from('session_messages')
      .select(`id, content, created_at, sender_id,
        sender:profiles!sender_id(id, callsign, color, avatar_url)`)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) { console.error('useSessionChat:', error); return; }
    setMessages(data || []);
  }, [sessionId, myProfileId]);

  useEffect(() => {
    if (!enabled || !sessionId || !myProfileId) return;
    load();
    channelRef.current = supabase
      .channel('session-chat-' + sessionId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'session_messages',
        filter: `session_id=eq.${sessionId}`,
      }, () => load())
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'session_messages',
        filter: `session_id=eq.${sessionId}`,
      }, () => load())
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [load, enabled, sessionId, myProfileId]);

  const sendMessage = useCallback(async (content) => {
    if (!sessionId || !myProfileId || !content.trim()) return false;
    const { error } = await supabase.from('session_messages').insert({
      session_id: sessionId,
      sender_id:  myProfileId,
      content:    content.trim().slice(0, 500),
    });
    if (error) { console.error('useSessionChat sendMessage:', error); return false; }
    await load();
    return true;
  }, [sessionId, myProfileId, load]);

  const deleteMessage = useCallback(async (messageId) => {
    const { error } = await supabase.from('session_messages').delete().eq('id', messageId);
    if (!error) setMessages(prev => prev.filter(m => m.id !== messageId));
    return !error;
  }, []);

  return { messages, sendMessage, deleteMessage };
}
