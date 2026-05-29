import { useState } from 'react';
import ChatModal from './ChatModal.jsx';

const mono    = { fontFamily: 'var(--font-mono)' };
const display = { fontFamily: 'var(--font-display)' };

function fmtTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts);
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ConvAvatar({ profile, isSystem, size = 38 }) {
  if (isSystem) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#c41e3a', border: '2px solid #a01830', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: size * 0.48, lineHeight: 1 }}>⚡</span>
      </div>
    );
  }
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

function ConversationCard({ conv, onClick }) {
  const { profile, isSystem, subject, lastMsg, unreadCount } = conv;
  const name    = isSystem ? 'Nexus Hub System' : (profile?.callsign || '—');
  const preview = lastMsg?.content ?? '';
  const isMine  = lastMsg?._dir === 'sent';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
        background: unreadCount > 0 ? 'rgba(96,165,250,0.06)' : 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = unreadCount > 0 ? 'rgba(96,165,250,0.06)' : 'transparent'; }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ConvAvatar profile={profile} isSystem={isSystem} size={38} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 10, height: 10, borderRadius: '50%',
            background: '#60a5fa', border: '2px solid var(--bg-1)',
          }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
            <span style={{ ...display, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)', whiteSpace: 'nowrap' }}>
              {name}
            </span>
            {isSystem && (
              <span style={{ ...mono, fontSize: 8, background: '#c41e3a', color: '#fff', padding: '1px 4px', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>SYS</span>
            )}
            {subject && (
              <span style={{ ...mono, fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                — <span style={{ textDecoration: 'underline' }}>{subject}</span>
              </span>
            )}
          </div>
          <span style={{ ...mono, fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {fmtTime(lastMsg?.created_at)}
          </span>
        </div>
        <div style={{ ...mono, fontSize: 11, color: unreadCount > 0 ? 'var(--text)' : 'var(--muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isMine && <span style={{ opacity: 0.6 }}>You: </span>}
          {preview}
        </div>
      </div>
    </div>
  );
}

function ComposePane({ friends, onSend, onClose }) {
  const [query,   setQuery]   = useState('');
  const [target,  setTarget]  = useState(null);
  const [text,    setText]    = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [warn,    setWarn]    = useState(null);

  const filtered = (friends || []).filter(f =>
    !query.trim() || f.callsign?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const handleSend = async () => {
    if (!target || !text.trim() || sending) return;
    setSending(true);
    setWarn(null);
    const result = await onSend(target.id, text.trim(), subject.trim() || null);
    setSending(false);
    if (result?.ok) {
      setDone(true);
      if (result.warning) setWarn(result.warning);
      setTimeout(() => { setDone(false); setTarget(null); setText(''); setSubject(''); setQuery(''); setWarn(null); }, 2000);
    } else if (result?.blocked) {
      setWarn(result.message);
    }
  };

  return (
    <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', padding: '16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ ...display, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)' }}>New Message</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>×</button>
      </div>

      {/* To */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>To</div>
        {target ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: '2px solid #60a5fa', background: 'rgba(96,165,250,0.06)' }}>
            <span style={{ ...display, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: 'var(--text)' }}>{target.callsign}</span>
            <button onClick={() => { setTarget(null); setQuery(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14 }}>×</button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search crew by callsign…"
              autoFocus
              style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', ...mono, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
            {query && filtered.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, border: '2px solid var(--border)', borderTop: 'none', background: 'var(--bg-1)', maxHeight: 180, overflowY: 'auto' }}>
                {filtered.map(f => (
                  <button key={f.id || f.friendshipId} onClick={() => { setTarget(f); setQuery(''); }}
                    style={{ width: '100%', padding: '8px 10px', border: 'none', borderBottom: '1px solid var(--border)', background: 'none', cursor: 'pointer', ...display, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: 'var(--text)', textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >{f.callsign}</button>
                ))}
              </div>
            )}
            {query && filtered.length === 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, border: '2px solid var(--border)', borderTop: 'none', background: 'var(--bg-1)', padding: '10px', ...mono, fontSize: 10, color: 'var(--muted)' }}>No crew found</div>
            )}
          </div>
        )}
      </div>

      {/* Subject (optional) */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Subject <span style={{ opacity: 0.5 }}>(optional)</span></div>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value.slice(0, 100))}
          placeholder="e.g. Cargo run debrief"
          style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', ...mono, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Body */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, 1000))}
        placeholder="Write your message…"
        rows={3}
        disabled={!target}
        style={{
          width: '100%', padding: '7px 10px', border: '2px solid var(--border)',
          background: target ? 'var(--bg-0)' : 'var(--bg-2)', color: 'var(--text)',
          ...mono, fontSize: 12, outline: 'none', resize: 'vertical',
          boxSizing: 'border-box', lineHeight: 1.5, marginBottom: 8,
          opacity: target ? 1 : 0.5,
        }}
      />

      {warn && <div style={{ ...mono, fontSize: 10, color: '#d97706', marginBottom: 8, lineHeight: 1.5 }}>{warn}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...mono, fontSize: 9, color: 'var(--muted)' }}>{text.length}/1000</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {done && <span style={{ ...mono, fontSize: 10, color: '#2d8659' }}>Sent ✓</span>}
          <button
            onClick={handleSend}
            disabled={!target || !text.trim() || sending}
            style={{
              padding: '8px 18px', ...display, fontWeight: 700, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              cursor: (!target || !text.trim()) ? 'default' : 'pointer',
              border: `2px solid ${(!target || !text.trim()) ? 'var(--border)' : '#c41e3a'}`,
              background: (!target || !text.trim()) ? 'var(--bg-2)' : '#c41e3a',
              color: (!target || !text.trim()) ? 'var(--muted)' : '#fff',
            }}
          >{sending ? 'Sending…' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesSection({ conversations, sendMessage, markRead, deleteMessage, friends, myProfileId, isMobile }) {
  const [openConv,  setOpenConv]  = useState(null);
  const [composing, setComposing] = useState(false);

  const unread = (conversations || []).reduce((t, c) => t + c.unreadCount, 0);

  // When a new message arrives for an open conversation, keep it open with fresh data
  const activeConv = openConv
    ? (conversations || []).find(c => c.key === openConv.key) ?? openConv
    : null;

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>Messages</div>
          {unread > 0 && (
            <span style={{ background: '#60a5fa', color: '#fff', ...mono, fontSize: 8, padding: '2px 6px', borderRadius: 2 }}>{unread}</span>
          )}
        </div>
        <button
          onClick={() => setComposing(c => !c)}
          style={{
            padding: '5px 12px', cursor: 'pointer',
            border: '2px solid var(--border)', background: composing ? 'var(--bg-2)' : 'var(--bg-1)',
            ...display, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = composing ? 'var(--bg-2)' : 'var(--bg-1)'; }}
        >+ Compose</button>
      </div>

      {composing && (
        <ComposePane friends={friends} onSend={sendMessage} onClose={() => setComposing(false)} />
      )}

      {/* Conversation list */}
      <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)' }}>
        {(!conversations || conversations.length === 0) ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', ...mono, fontSize: 11, color: 'var(--muted)' }}>
            No messages yet. Use + Compose to start a conversation.
          </div>
        ) : (
          conversations.map(conv => (
            <ConversationCard
              key={conv.key}
              conv={conv}
              onClick={() => setOpenConv(conv)}
            />
          ))
        )}
      </div>

      {/* Chat modal */}
      {activeConv && (
        <ChatModal
          conversation={activeConv}
          myProfileId={myProfileId}
          isMobile={isMobile}
          onClose={() => setOpenConv(null)}
          onSend={sendMessage}
          onMarkRead={markRead}
          onDelete={deleteMessage}
        />
      )}
    </div>
  );
}
