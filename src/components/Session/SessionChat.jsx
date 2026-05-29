import { useState, useEffect, useRef } from 'react';
import { useSessionChat } from '@/hooks/useSessionChat.js';
import { useIsMobile } from '@/hooks/useIsMobile.js';
import { SFX } from '@/hooks/useSound.js';

const mono    = { fontFamily: 'var(--font-mono)' };
const display = { fontFamily: 'var(--font-display)' };

function fmtTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts);
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function SenderAvatar({ profile, size = 28 }) {
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

function MessageBubble({ msg, isMine, onDelete, isMobile }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const otherBorderColor = msg.sender?.color || 'var(--border)';
  const fontSize = isMobile ? 12 : 14;

  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8, gap: 6, alignItems: 'flex-end' }}>
      {!isMine && <SenderAvatar profile={msg.sender} size={26} />}
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 2 }}>
        {!isMine && (
          <span style={{ ...display, fontSize: isMobile ? 9 : 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: msg.sender?.color || 'var(--muted)', paddingLeft: 2 }}>
            {msg.sender?.callsign || '?'}
          </span>
        )}
        <div style={{
          padding: '7px 11px',
          background:    isMine ? '#c41e3a' : 'var(--bg-2)',
          color:         isMine ? '#fff'    : 'var(--text)',
          border:        `2px solid ${isMine ? '#a01830' : otherBorderColor}`,
          ...mono, fontSize, lineHeight: 1.5, wordBreak: 'break-word',
        }}>
          {msg.content}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 9, opacity: 0.5 }}>{fmtTime(msg.created_at)}</span>
            {isMine && (
              confirmDel ? (
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 8, opacity: 0.7 }}>Delete?</span>
                  <button onClick={() => onDelete?.(msg.id)} style={{ ...mono, fontSize: 8, padding: '1px 5px', cursor: 'pointer', background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)', color: 'inherit' }}>Yes</button>
                  <button onClick={() => setConfirmDel(false)} style={{ ...mono, fontSize: 8, padding: '1px 5px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'inherit' }}>No</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDel(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.35, fontSize: 12, lineHeight: 1, color: 'inherit', padding: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.35'; }}
                >×</button>
              )
            )}
          </div>
        </div>
      </div>
      {isMine && <SenderAvatar profile={msg.sender} size={26} />}
    </div>
  );
}

export default function SessionChat({ session, myProfileId, isSessionMember }) {
  const isMobile   = useIsMobile();
  const isActive   = !!session.startedAt && !session.endedAt;
  const isArchived = !!session.endedAt;
  const isPreFlight = !session.startedAt;

  const { messages, sendMessage, deleteMessage } = useSessionChat(
    session.id,
    myProfileId,
    isSessionMember
  );

  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef  = useRef(null);
  const prevLenRef = useRef(messages.length);

  useEffect(() => {
    const prev = prevLenRef.current;
    prevLenRef.current = messages.length;
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (messages.length > prev) {
      const newest = messages[messages.length - 1];
      if (newest?.sender_id !== myProfileId) SFX.msgIn();
    }
  }, [messages.length, myProfileId]);

  const handleSend = async () => {
    if (!text.trim() || sending || !isActive) return;
    setSending(true);
    await sendMessage(text.trim());
    setSending(false);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const statusDot = isActive
    ? { label: 'LIVE', color: '#2d8659', dot: '#4ade80' }
    : isArchived
    ? { label: 'ARCHIVED', color: 'var(--muted)', dot: '#666' }
    : { label: 'PRE-FLIGHT', color: 'var(--muted)', dot: '#666' };

  return (
    <div style={{ background: 'var(--bg-1)', border: `2px solid ${isActive ? '#2d8659' : 'var(--border)'}` }}>

      {/* Header */}
      <div style={{
        padding: '10px 16px', borderBottom: `2px solid ${isActive ? '#2d8659' : 'var(--border)'}`,
        background: isActive ? 'rgba(45,134,89,0.07)' : 'var(--bg-0)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Mission Comms</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDot.dot, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ ...mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: statusDot.color }}>{statusDot.label}</span>
          </span>
        </div>
        {messages.length > 0 && (
          <span style={{ ...mono, fontSize: 8, color: 'var(--muted)' }}>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ minHeight: 80, maxHeight: isMobile ? 640 : 320, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column' }}
      >
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
            {isPreFlight
              ? 'Comms open when session is started.'
              : isArchived
              ? 'No messages were sent during this session.'
              : 'No messages yet — say something.'}
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={msg.sender_id === myProfileId}
            onDelete={deleteMessage}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Input — only when session is active and user is a member */}
      {isActive && isSessionMember && (
        <div style={{ padding: '10px 14px', borderTop: `2px solid ${isActive ? '#2d8659' : 'var(--border)'}`, background: 'var(--bg-0)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              placeholder="Comms… (Enter to send)"
              rows={2}
              style={{
                flex: 1, padding: '7px 10px',
                border: '2px solid var(--border)', background: 'var(--bg-1)',
                color: 'var(--text)', ...mono, fontSize: isMobile ? 12 : 14,
                outline: 'none', resize: 'none', lineHeight: 1.45, boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                padding: '10px 16px', flexShrink: 0,
                ...display, fontWeight: 700, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                cursor: !text.trim() ? 'default' : 'pointer',
                border: `2px solid ${!text.trim() ? 'var(--border)' : '#2d8659'}`,
                background: !text.trim() ? 'var(--bg-2)' : '#2d8659',
                color: !text.trim() ? 'var(--muted)' : '#fff',
                alignSelf: 'stretch',
              }}
              onMouseEnter={e => { if (text.trim()) { e.currentTarget.style.background = '#1e5c40'; e.currentTarget.style.borderColor = '#1e5c40'; } }}
              onMouseLeave={e => { if (text.trim()) { e.currentTarget.style.background = '#2d8659'; e.currentTarget.style.borderColor = '#2d8659'; } }}
            >{sending ? '…' : 'Send'}</button>
          </div>
          <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', marginTop: 3, textAlign: 'right' }}>{text.length}/500</div>
        </div>
      )}

      {/* Archived footer */}
      {isArchived && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', ...mono, fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
          ■ Session ended — comms archived
        </div>
      )}
    </div>
  );
}
