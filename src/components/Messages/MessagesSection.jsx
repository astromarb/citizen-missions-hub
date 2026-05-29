import { useState, useRef, useEffect } from 'react';

const mono = { fontFamily: 'var(--font-mono)' };
const display = { fontFamily: 'var(--font-display)' };

function Avatar({ profile, size = 32 }) {
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

function SystemAvatar({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#c41e3a', border: '2px solid #a01830', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize: size * 0.5, lineHeight: 1 }}>⚡</span>
    </div>
  );
}

function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60000) return 'just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MessageRow({ msg, side, onExpand, expanded, onMarkRead }) {
  const isSystem = msg.is_system;
  const senderProfile = side === 'inbox' ? msg.sender : null;
  const otherProfile  = side === 'sent'  ? msg.recipient : null;
  const profile       = senderProfile || otherProfile;
  const isUnread = side === 'inbox' && !msg.read_at;

  const handleExpand = () => {
    onExpand(msg.id);
    if (isUnread && side === 'inbox') onMarkRead(msg.id);
  };

  return (
    <div
      onClick={handleExpand}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: expanded ? 'var(--bg-2)' : isUnread ? 'rgba(196,30,58,0.04)' : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--bg-2)'; }}
      onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = isUnread ? 'rgba(196,30,58,0.04)' : 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {isSystem ? <SystemAvatar size={32} /> : <Avatar profile={profile} size={32} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...display, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)' }}>
                {isSystem ? 'Nexus Hub System' : (profile?.callsign || '—')}
              </span>
              {isSystem && (
                <span style={{ ...mono, fontSize: 8, background: '#c41e3a', color: '#fff', padding: '1px 5px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>System</span>
              )}
              {isUnread && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c41e3a', flexShrink: 0, display: 'inline-block' }} />
              )}
            </div>
            <span style={{ ...mono, fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtTime(msg.created_at)}</span>
          </div>
          <div style={{
            ...mono, fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5,
            overflow: expanded ? 'visible' : 'hidden',
            whiteSpace: expanded ? 'pre-wrap' : 'nowrap',
            textOverflow: expanded ? 'unset' : 'ellipsis',
            maxWidth: '100%',
          }}>
            {msg.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposePane({ friends, onSend, onClose }) {
  const [query,   setQuery]   = useState('');
  const [target,  setTarget]  = useState(null);
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const textRef = useRef(null);

  const filtered = (friends || []).filter(f =>
    !query.trim() || f.callsign?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const handleSend = async () => {
    if (!target || !text.trim() || sending) return;
    setSending(true);
    const ok = await onSend(target.id, text.trim());
    setSending(false);
    if (ok) {
      setDone(true);
      setTimeout(() => { setDone(false); setTarget(null); setText(''); setQuery(''); }, 1600);
    }
  };

  useEffect(() => {
    if (target && textRef.current) textRef.current.focus();
  }, [target]);

  return (
    <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ ...display, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)' }}>New Message</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>×</button>
      </div>

      {/* To field */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>To</div>
        {target ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '2px solid #c41e3a', background: 'rgba(196,30,58,0.05)' }}>
            <Avatar profile={target} size={22} />
            <span style={{ ...display, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: 'var(--text)' }}>{target.callsign}</span>
            <button onClick={() => { setTarget(null); setQuery(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, lineHeight: 1 }}>×</button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search crew by callsign…"
              autoFocus
              style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', ...mono, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
            {query && filtered.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, border: '2px solid var(--border)', borderTop: 'none', background: 'var(--bg-1)', maxHeight: 200, overflowY: 'auto' }}>
                {filtered.map(f => (
                  <button
                    key={f.id || f.friendshipId}
                    onClick={() => { setTarget(f); setQuery(''); }}
                    style={{ width: '100%', padding: '9px 10px', border: 'none', borderBottom: '1px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Avatar profile={f} size={24} />
                    <span style={{ ...display, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: 'var(--text)' }}>{f.callsign}</span>
                  </button>
                ))}
              </div>
            )}
            {query && filtered.length === 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, border: '2px solid var(--border)', borderTop: 'none', background: 'var(--bg-1)', padding: '10px', ...mono, fontSize: 10, color: 'var(--muted)' }}>
                No crew found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message body */}
      <textarea
        ref={textRef}
        value={text}
        onChange={e => setText(e.target.value.slice(0, 1000))}
        placeholder="Write your message…"
        rows={3}
        disabled={!target}
        style={{
          width: '100%', padding: '8px 10px', border: '2px solid var(--border)',
          background: target ? 'var(--bg-0)' : 'var(--bg-2)', color: 'var(--text)',
          ...mono, fontSize: 12, outline: 'none', resize: 'vertical',
          boxSizing: 'border-box', lineHeight: 1.5, marginBottom: 10,
          opacity: target ? 1 : 0.5,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...mono, fontSize: 9, color: 'var(--muted)' }}>{text.length}/1000</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {done && <span style={{ ...mono, fontSize: 10, color: '#2d8659' }}>Sent ✓</span>}
          <button
            onClick={handleSend}
            disabled={!target || !text.trim() || sending}
            style={{
              padding: '8px 20px', ...display, fontWeight: 700, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: (!target || !text.trim()) ? 'default' : 'pointer',
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

export default function MessagesSection({ inbox, sent, sendMessage, markRead, friends }) {
  const [tab,      setTab]      = useState('inbox');
  const [expanded, setExpanded] = useState(null);
  const [composing, setComposing] = useState(false);

  const unread = (inbox || []).filter(m => !m.read_at).length;

  const tabBtn = (key, label, badge) => (
    <button
      key={key}
      onClick={() => { setTab(key); setExpanded(null); }}
      style={{
        padding: '8px 14px', border: 'none', cursor: 'pointer',
        ...display, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
        background: 'transparent',
        color: tab === key ? '#c41e3a' : 'var(--muted)',
        borderBottom: tab === key ? '3px solid #c41e3a' : '3px solid transparent',
        marginBottom: -2,
        transition: 'color 0.15s',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{
          marginLeft: 5, background: '#c41e3a', color: '#fff',
          ...mono, fontSize: 8, padding: '1px 5px', borderRadius: 2,
        }}>{badge}</span>
      )}
    </button>
  );

  const messages = tab === 'inbox' ? (inbox || []) : (sent || []);

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
          Messages
        </div>
        <button
          onClick={() => { setComposing(c => !c); }}
          style={{
            padding: '5px 12px', cursor: 'pointer',
            border: '2px solid var(--border)', background: composing ? 'var(--bg-2)' : 'var(--bg-1)',
            ...display, fontWeight: 700, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = composing ? 'var(--bg-2)' : 'var(--bg-1)'; }}
        >+ Compose</button>
      </div>

      {composing && (
        <div style={{ marginBottom: 12 }}>
          <ComposePane friends={friends} onSend={sendMessage} onClose={() => setComposing(false)} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)' }}>
        <div style={{
          display: 'flex', borderBottom: '2px solid var(--border)',
          background: 'var(--bg-0)', padding: '0 4px',
        }}>
          {tabBtn('inbox', 'Inbox', unread)}
          {tabBtn('sent',  'Sent',  0)}
        </div>

        {messages.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', ...mono, fontSize: 11, color: 'var(--muted)' }}>
            {tab === 'inbox' ? 'No messages received yet.' : 'No messages sent yet.'}
          </div>
        ) : (
          <div>
            {messages.map(msg => (
              <MessageRow
                key={msg.id}
                msg={msg}
                side={tab}
                expanded={expanded === msg.id}
                onExpand={id => setExpanded(prev => prev === id ? null : id)}
                onMarkRead={markRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
