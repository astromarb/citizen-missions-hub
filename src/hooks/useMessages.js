import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase.js';

// ── Spam tracking (localStorage-backed) ──────────────────────────────────────
function loadSpamState() {
  try { return JSON.parse(localStorage.getItem('cmh-spam') || '{}'); } catch { return {}; }
}
function saveSpamState(s) {
  try { localStorage.setItem('cmh-spam', JSON.stringify(s)); } catch {}
}

// Returns { ok } | { spam, warning } | { spam, blocked, message }
function checkSpam() {
  const now  = Date.now();
  const s    = loadSpamState();

  // Hard block active?
  if (s.blockedUntil && now < s.blockedUntil) {
    const mins = Math.ceil((s.blockedUntil - now) / 60000);
    return { blocked: true, message: `Messaging blocked for ${mins} more minute${mins !== 1 ? 's' : ''} (spam limit reached).` };
  }

  // Rate window: 3 messages within 30 seconds
  const recent = (s.recentSends || []).filter(t => now - t < 30000);
  recent.push(now);

  if (recent.length >= 3) {
    const strikes = (s.strikes || 0) + 1;
    saveSpamState({
      strikes,
      recentSends: recent,
      blockedUntil: strikes >= 3 ? now + 3_600_000 : null, // 1-hour block on 3rd strike
    });
    if (strikes >= 3) {
      return { spam: true, blocked: true, message: 'You have been blocked from messaging for 1 hour due to repeated spam.' };
    }
    return { spam: true, warning: `Spam warning (${strikes}/3 strikes). A third violation will block messaging for 1 hour.` };
  }

  saveSpamState({ ...s, recentSends: recent });
  return { ok: true };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useMessages(myProfileId, enabled = true, onNewMessage = null) {
  const [allMessages, setAllMessages] = useState([]);
  const channelRef        = useRef(null);
  const initialLoadedRef  = useRef(false);
  const onNewMessageRef   = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  const load = useCallback(async () => {
    if (!myProfileId) { setAllMessages([]); return; }

    const [inboxRes, sentRes] = await Promise.all([
      supabase.from('messages')
        .select('id, content, subject, is_system, is_spam, created_at, read_at, sender_id, recipient_id, sender:profiles!sender_id(id, callsign, color, avatar_url)')
        .eq('recipient_id', myProfileId)
        .order('created_at', { ascending: true }),
      supabase.from('messages')
        .select('id, content, subject, is_system, is_spam, created_at, read_at, sender_id, recipient_id, recipient:profiles!recipient_id(id, callsign, color, avatar_url)')
        .eq('sender_id', myProfileId)
        .order('created_at', { ascending: true }),
    ]);

    const inbox = (inboxRes.data || []).map(m => ({ ...m, _dir: 'inbox' }));
    const sent  = (sentRes.data  || []).map(m => ({ ...m, _dir: 'sent' }));
    const merged = [...inbox, ...sent].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    setAllMessages(merged);
  }, [myProfileId]);

  useEffect(() => {
    if (!enabled || !myProfileId) return;

    load().then(() => { initialLoadedRef.current = true; });

    channelRef.current = supabase
      .channel('messages-' + myProfileId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row       = payload.new;
        const isForMe   = row.recipient_id === myProfileId;
        const notFromMe = row.sender_id !== myProfileId;
        load().then(() => {
          if (initialLoadedRef.current && isForMe && notFromMe && onNewMessageRef.current) {
            onNewMessageRef.current(row);
          }
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, load)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, load)
      .subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [load, enabled, myProfileId]);

  // ── Derive conversations ──────────────────────────────────────────────────
  const conversations = useMemo(() => {
    if (!myProfileId) return [];
    const map = {};

    allMessages.forEach(msg => {
      let key;
      if (msg._dir === 'inbox') {
        key = (msg.is_system && !msg.sender_id) ? '_system' : (msg.sender_id || '_system');
      } else {
        key = msg.recipient_id;
      }
      if (!map[key]) {
        const profile = msg._dir === 'inbox'
          ? (msg.is_system && !msg.sender_id ? null : msg.sender)
          : msg.recipient;
        map[key] = { key, profile, isSystem: key === '_system', messages: [] };
      }
      map[key].messages.push(msg);
    });

    return Object.values(map)
      .map(conv => ({
        ...conv,
        lastMsg:      conv.messages[conv.messages.length - 1],
        unreadCount:  conv.messages.filter(m => m._dir === 'inbox' && !m.read_at).length,
        subject:      conv.messages.find(m => m.subject)?.subject ?? null,
      }))
      .sort((a, b) => new Date(b.lastMsg?.created_at) - new Date(a.lastMsg?.created_at));
  }, [allMessages, myProfileId]);

  const unreadCount = conversations.reduce((t, c) => t + c.unreadCount, 0);

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (recipientId, content, subject = null) => {
    if (!myProfileId || !content.trim()) return { ok: false };

    const spamResult = checkSpam();
    if (spamResult.blocked) return { ok: false, blocked: true, message: spamResult.message };

    const { error } = await supabase.from('messages').insert({
      sender_id:    myProfileId,
      recipient_id: recipientId,
      content:      content.trim(),
      ...(subject?.trim() ? { subject: subject.trim() } : {}),
      is_spam:      !!(spamResult.spam),
    });

    if (error) { console.error('sendMessage:', error); return { ok: false }; }
    await load();
    if (spamResult.spam) return { ok: true, warning: spamResult.warning };
    return { ok: true };
  }, [myProfileId, load]);

  const markRead = useCallback(async (messageId) => {
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('read_at', null);
    setAllMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m
    ));
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) { console.error('deleteMessage:', error); return false; }
    setAllMessages(prev => prev.filter(m => m.id !== messageId));
    return true;
  }, []);

  return { conversations, sendMessage, markRead, deleteMessage, unreadCount };
}
