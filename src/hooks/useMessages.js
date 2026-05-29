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

  // Rate window: 12 messages within 60 seconds
  const recent = (s.recentSends || []).filter(t => now - t < 60000);
  recent.push(now);

  if (recent.length >= 12) {
    const strikes = (s.strikes || 0) + 1;
    saveSpamState({
      strikes,
      recentSends: recent,
      blockedUntil: strikes >= 5 ? now + 600_000 : null, // 10-minute block on 5th strike
    });
    if (strikes >= 5) {
      return { spam: true, blocked: true, message: 'Messaging paused for 10 minutes (rate limit reached).' };
    }
    return { spam: true, warning: `Slow down — sending too many messages too quickly (${strikes}/5 warnings).` };
  }

  saveSpamState({ ...s, recentSends: recent });
  return { ok: true };
}

// Clear any overly-aggressive legacy blocks from the old 3-msg/30s rule
;(() => {
  try {
    const s = JSON.parse(localStorage.getItem('cmh-spam') || '{}');
    if (s.blockedUntil || (s.strikes && s.strikes >= 3)) {
      localStorage.removeItem('cmh-spam');
    }
  } catch {}
})();

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useMessages(myProfileId, enabled = true, onNewMessage = null) {
  const [allMessages, setAllMessages] = useState([]);
  const channelRef        = useRef(null);
  const initialLoadedRef  = useRef(false);
  const onNewMessageRef   = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  const load = useCallback(async () => {
    if (!myProfileId) { setAllMessages([]); return; }
    const { data, error } = await supabase.from('messages')
      .select(`id, content, subject, is_system, is_spam, created_at, read_at, sender_id, recipient_id,
        sender:profiles!sender_id(id, callsign, color, avatar_url),
        recipient:profiles!recipient_id(id, callsign, color, avatar_url)`)
      .or(`sender_id.eq.${myProfileId},recipient_id.eq.${myProfileId}`)
      .order('created_at', { ascending: true });
    if (error) { console.error('useMessages load:', error); return; }
    setAllMessages((data || []).map(m => ({ ...m, _dir: m.sender_id === myProfileId ? 'sent' : 'inbox' })));
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
        if (initialLoadedRef.current && isForMe && notFromMe && onNewMessageRef.current) {
          onNewMessageRef.current(row);
        }
        load();
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
        // Each system broadcast gets its own card so they don't pile into one thread
        key = msg.is_system ? `_system_${msg.id}` : (msg.sender_id || '_unknown');
      } else {
        key = msg.recipient_id;
      }
      if (!map[key]) {
        const profile = msg._dir === 'inbox'
          ? (msg.is_system ? null : msg.sender)
          : msg.recipient;
        map[key] = { key, profile, isSystem: !!msg.is_system, messages: [] };
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
