import { useState, useEffect, useRef } from 'react';
import { SFX } from '@/hooks/useSound.js';

const mono    = { fontFamily: 'var(--font-mono)' };
const display = { fontFamily: 'var(--font-display)' };

function fmtTime(ts) {
  const d    = new Date(ts);
  const diff = Date.now() - d;
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function Avatar({ profile, size = 36 }) {
  const color = profile?.color || '#8b949e';
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}`, flexShrink: 0, objectFit: 'cover' }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, border: `2px solid ${color}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ ...display, color: '#fff', fontWeight: 800, fontSize: size * 0.42 }}>
        {(profile?.callsign || '?')[0].toUpperCase()}
      </span>
    </div>
  );
}

function SystemAvatar({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#c41e3a', border: '2px solid #a01830', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: size * 0.48, lineHeight: 1 }}>⚡</span>
    </div>
  );
}

function Bubble({ msg, isMine, isMobile }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fontSize = isMobile ? 12 : 14;

  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 10, gap: 0 }}>
      <div style={{ position: 'relative', maxWidth: '72%' }}>
        <div style={{
          padding: '9px 13px',
          background:    isMine ? '#c41e3a' : 'var(--bg-2)',
          color:         isMine ? '#fff'    : 'var(--text)',
          border:        `2px solid ${isMine ? '#a01830' : 'var(--border)'}`,
          ...mono, fontSize, lineHeight: 1.55,
          wordBreak: 'break-word', whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: 10, marginTop: 5,
          }}>
            <span style={{ fontSize: 9, opacity: 0.55 }}>{fmtTime(msg.created_at)}</span>
            {/* Delete */}
            {confirmDelete ? (
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 9, opacity: 0.7 }}>Delete?</span>
                <button
                  onClick={() => msg._onDelete?.(msg.id)}
                  style={{ ...mono, fontSize: 8, padding: '1px 5px', cursor: 'pointer', background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)', color: 'inherit' }}
                >Yes</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ ...mono, fontSize: 8, padding: '1px 5px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'inherit' }}
                >No</button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: 12, lineHeight: 1, color: 'inherit', padding: 0 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; }}
              >×</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemBubble({ msg, isMobile }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
      <div style={{
        padding: '8px 14px', maxWidth: '80%',
        background: 'rgba(196,30,58,0.08)', border: '1.5px solid rgba(196,30,58,0.3)',
        ...mono, fontSize: isMobile ? 11 : 13, color: 'var(--text)', lineHeight: 1.55,
        textAlign: 'center', wordBreak: 'break-word', whiteSpace: 'pre-wrap',
      }}>
        <div style={{ fontSize: 8, color: '#c41e3a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>⚡ Nexus Hub System</div>
        {msg.content}
        <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>{fmtTime(msg.created_at)}</div>
      </div>
    </div>
  );
}

export default function ChatModal({ conversation, myProfileId, onClose, onSend, onMarkRead, onDelete, isMobile }) {
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);
  const [warn,    setWarn]    = useState(null);
  const scrollRef    = useRef(null);
  const prevLenRef   = useRef(conversation.messages.length);

  // Mark all unread as read when modal opens
  useEffect(() => {
    conversation.messages
      .filter(m => m._dir === 'inbox' && !m.read_at)
      .forEach(m => onMarkRead(m.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.key]);

  // Scroll to bottom on open and on new messages; play sound for incoming
  useEffect(() => {
    const prev = prevLenRef.current;
    prevLenRef.current = conversation.messages.length;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (conversation.messages.length > prev) {
      const newest = conversation.messages[conversation.messages.length - 1];
      if (newest?._dir === 'inbox') SFX.msgIn();
    }
  }, [conversation.messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending || conversation.isSystem) return;
    setSending(true);
    setWarn(null);
    const result = await onSend(conversation.key, text.trim());
    setSending(false);
    if (result?.ok) {
      setText('');
      if (result.warning) { setWarn(result.warning); setTimeout(() => setWarn(null), 5000); }
    } else if (result?.blocked) {
      setWarn(result.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const { profile, isSystem, subject, messages } = conversation;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: isMobile ? 0 : 20,
      }}
    >
      <div style={{
        background: 'var(--bg-1)', border: '2px solid var(--border)',
        width: '100%', maxWidth: 540,
        height: isMobile ? '100dvh' : undefined,
        maxHeight: isMobile ? '100dvh' : '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '12px 16px', borderBottom: '2px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          background: 'var(--bg-0)',
        }}>
          {isSystem ? <SystemAvatar size={34} /> : <Avatar profile={profile} size={34} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...display, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1.2 }}>
              {isSystem ? 'Nexus Hub System' : (profile?.callsign || '—')}
              {isSystem && <span style={{ ...mono, fontSize: 9, background: '#c41e3a', color: '#fff', padding: '1px 5px', letterSpacing: '0.08em', marginLeft: 7 }}>System</span>}
            </div>
            {subject && (
              <div style={{ ...mono, fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                — <span style={{ textDecoration: 'underline' }}>{subject}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, lineHeight: 1, padding: '2px 6px', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
          >×</button>
        </div>

        {/* ── Messages ── */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column' }}
        >
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 11, color: 'var(--muted)' }}>
              No messages yet
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg._dir === 'sent';
            const msgWithDelete = { ...msg, _onDelete: onDelete };
            if (msg.is_system && !msg.sender_id) return <SystemBubble key={msg.id} msg={msg} isMobile={isMobile} />;
            return <Bubble key={msg.id} msg={msgWithDelete} isMine={isMine} isMobile={isMobile} />;
          })}
        </div>

        {/* ── Spam warning ── */}
        {warn && (
          <div style={{
            padding: '8px 16px', background: 'rgba(217,119,6,0.12)', borderTop: '1px solid #d97706',
            ...mono, fontSize: 10, color: '#d97706', lineHeight: 1.5,
          }}>{warn}</div>
        )}

        {/* ── Reply box (not for system) ── */}
        {!isSystem && (
          <div style={{ padding: '12px 16px', borderTop: '2px solid var(--border)', flexShrink: 0, background: 'var(--bg-0)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, 1000))}
                onKeyDown={handleKeyDown}
                placeholder="Reply… (Enter to send, Shift+Enter for newline)"
                rows={2}
                style={{
                  flex: 1, padding: '8px 10px',
                  border: '2px solid var(--border)', background: 'var(--bg-1)',
                  color: 'var(--text)', ...mono, fontSize: isMobile ? 12 : 14,
                  outline: 'none', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                style={{
                  padding: '10px 18px', flexShrink: 0,
                  ...display, fontWeight: 700, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: !text.trim() ? 'default' : 'pointer',
                  border: `2px solid ${!text.trim() ? 'var(--border)' : '#c41e3a'}`,
                  background: !text.trim() ? 'var(--bg-2)' : '#c41e3a',
                  color: !text.trim() ? 'var(--muted)' : '#fff',
                  alignSelf: 'stretch',
                }}
                onMouseEnter={e => { if (text.trim()) { e.currentTarget.style.background = '#a01830'; e.currentTarget.style.borderColor = '#a01830'; } }}
                onMouseLeave={e => { if (text.trim()) { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; } }}
              >{sending ? '…' : 'Send'}</button>
            </div>
            <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>{text.length}/1000</div>
          </div>
        )}
      </div>
    </div>
  );
}
