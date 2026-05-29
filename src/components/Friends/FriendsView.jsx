import { useState, useEffect, useCallback } from 'react';
import MessagesSection from '@/components/Messages/MessagesSection.jsx';

function Avatar({ profile, size = 36 }) {
  const color = profile?.color || '#8b949e';
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt={profile.callsign} style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}`, flexShrink: 0, objectFit: 'cover' }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, border: `2px solid ${color}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.45, fontFamily: 'var(--font-display)' }}>
        {(profile?.callsign || '?')[0].toUpperCase()}
      </span>
    </div>
  );
}

const sectionLabel = {
  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700,
  marginBottom: 10, marginTop: 20,
};

function FriendBubbles({ friends, onViewProfile }) {
  if (!friends.length) return null;
  const MAX_SHOWN = 50;
  const shown = friends.slice(0, MAX_SHOWN);
  const bubbleSize = friends.length >= 25 ? 40 : 52;
  const fontSize = friends.length >= 25 ? 9 : 10;

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={sectionLabel}>Friends ({friends.length})</div>
      <div style={{
        border: '2px solid #000', background: '#fff', padding: '16px',
        display: 'flex', flexWrap: 'wrap', gap: friends.length >= 25 ? 10 : 14,
      }}>
        {shown.map(f => (
          <button
            key={f.friendshipId}
            onClick={() => onViewProfile?.(f)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: onViewProfile ? 'pointer' : 'default',
              padding: 0,
            }}
          >
            <Avatar profile={f} size={bubbleSize} />
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: fontSize, color: '#000',
              maxWidth: bubbleSize + 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{f.callsign}</span>
          </button>
        ))}
        {friends.length > MAX_SHOWN && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{
              width: bubbleSize, height: bubbleSize, borderRadius: '50%',
              background: 'var(--bg-2)', border: '2px solid #ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--muted)' }}>+{friends.length - MAX_SHOWN}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>more</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FriendsView({ friends, pending, sent, sessionInvites, searchUsers, sendRequest, respond, remove, onViewProfile, onRespondToSessionInvite, conversations, sendMessage, markRead, deleteMessage, myProfileId, isMobile }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const friendIds = new Set(friends.map(f => f.id));
  const sentIds = new Set(sent.map(f => f.id));
  const pendingIds = new Set(pending.map(f => f.id));

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await searchUsers(q);
    setResults(res);
    setSearching(false);
  }, [searchUsers]);

  useEffect(() => {
    const t = setTimeout(() => { if (query) doSearch(query); else setResults([]); }, 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const actionBtn = (label, onClick, variant = 'default') => {
    const styles = {
      default: { border: '2px solid #000', background: '#fff', color: '#000' },
      primary: { border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff' },
      muted:   { border: '2px solid #ccc', background: '#f5f5f5', color: '#999' },
      green:   { border: '2px solid #2D7A1F', background: '#fff', color: '#2D7A1F' },
      danger:  { border: '2px solid #c41e3a', background: '#fff', color: '#c41e3a' },
    };
    const s = styles[variant] || styles.default;
    return (
      <button onClick={onClick} style={{
        ...s, padding: '5px 14px', cursor: 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
        textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
      }}>{label}</button>
    );
  };

  const ProfileRow = ({ profile, actions }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <Avatar profile={profile} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#000' }}>{profile.callsign}</div>
        {profile.home_region && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{profile.home_region}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>{actions}</div>
    </div>
  );

  const pendingInvites = sessionInvites || [];
  const hasPending = pending.length > 0 || pendingInvites.length > 0;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20 }}>Friends</div>

      {/* ── 1. Friend Bubbles ── */}
      <FriendBubbles friends={friends} onViewProfile={onViewProfile} />

      {/* ── Divider ── */}
      <div style={{ borderTop: '2px solid #000', margin: '24px 0' }} />

      {/* ── 2. Messages ── */}
      <MessagesSection
        conversations={conversations}
        sendMessage={sendMessage}
        markRead={markRead}
        deleteMessage={deleteMessage}
        friends={friends}
        myProfileId={myProfileId}
        isMobile={isMobile}
      />

      {/* ── 3. Search ── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: 16, marginTop: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 8 }}>Search Pilots</div>
        <input
          style={{ width: '100%', padding: '9px 12px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          placeholder="Search by callsign…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {searching && (
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Searching…</div>
        )}
        {results.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {results.map(p => {
              const isFriend = friendIds.has(p.id);
              const isPending = pendingIds.has(p.id);
              const isSent = sentIds.has(p.id);
              return (
                <ProfileRow key={p.id} profile={p} actions={
                  isFriend ? [<span key="f" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#2D7A1F' }}>Friends ✓</span>]
                  : isSent ? [<span key="p" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Pending</span>]
                  : isPending ? [<span key="i" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Incoming request</span>]
                  : [actionBtn('+ Add Friend', () => sendRequest(p.id), 'primary')]
                } />
              );
            })}
          </div>
        )}
        {query && !searching && results.length === 0 && (
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>No pilots found.</div>
        )}
      </div>

      {/* ── 4. Sent requests ── */}
      {sent.length > 0 && (
        <div>
          <div style={sectionLabel}>Sent Requests ({sent.length})</div>
          <div style={{ border: '2px solid #000', background: '#fff', padding: '0 16px' }}>
            {sent.map(p => (
              <ProfileRow key={p.friendshipId} profile={p} actions={
                confirmRemoveId === p.friendshipId ? [
                  <span key="lbl" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Cancel request?</span>,
                  <button key="yes" onClick={() => { remove(p.friendshipId); setConfirmRemoveId(null); }} style={{ border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Yes</button>,
                  <button key="no" onClick={() => setConfirmRemoveId(null)} style={{ border: '2px solid #ccc', background: '#f5f5f5', color: '#999', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>No</button>,
                ] : [
                  <span key="s" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Pending</span>,
                  actionBtn('Cancel', () => setConfirmRemoveId(p.friendshipId), 'danger'),
                ]
              } />
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Pending requests + session invites ── */}
      {hasPending && (
        <div style={{ marginBottom: 4 }}>
          <div style={sectionLabel}>
            Incoming{(pending.length + pendingInvites.length) > 0 ? ` (${pending.length + pendingInvites.length})` : ''}
          </div>

          {pendingInvites.length > 0 && (
            <div style={{ border: '2px solid #c41e3a', background: '#fff', padding: '0 16px', marginBottom: 8 }}>
              {pendingInvites.map(inv => {
                const d = inv.session?.date
                  ? new Date(inv.session.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  : 'Unknown date';
                return (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#000' }}>
                        Session Invite · {d}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                        from{' '}
                        <span style={{ color: inv.inviter?.color || '#888', fontWeight: 700 }}>
                          {inv.inviter?.callsign || '?'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {actionBtn('Accept', () => onRespondToSessionInvite?.(inv.id, true, inv.session_id), 'green')}
                      {actionBtn('Decline', () => onRespondToSessionInvite?.(inv.id, false, inv.session_id), 'danger')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pending.length > 0 && (
            <div style={{ border: '2px solid #000', background: '#fff', padding: '0 16px' }}>
              {pending.map(p => (
                <ProfileRow key={p.friendshipId} profile={p} actions={[
                  actionBtn('Accept', () => respond(p.friendshipId, true), 'green'),
                  actionBtn('Decline', () => respond(p.friendshipId, false), 'danger'),
                ]} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 6. All Friends list (bottom) ── */}
      {friends.length > 0 ? (
        <div>
          <div style={sectionLabel}>All Friends ({friends.length})</div>
          <div style={{ border: '2px solid #000', background: '#fff', padding: '0 16px' }}>
            {friends.map(f => (
              <ProfileRow key={f.friendshipId} profile={f} actions={
                confirmRemoveId === f.friendshipId ? [
                  <span key="lbl" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Remove friend?</span>,
                  <button key="confirm" onClick={() => { remove(f.friendshipId); setConfirmRemoveId(null); }} style={{ border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirm</button>,
                  <button key="cancel" onClick={() => setConfirmRemoveId(null)} style={{ border: '2px solid #ccc', background: '#f5f5f5', color: '#999', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cancel</button>,
                ] : [
                  onViewProfile && actionBtn('View Profile', () => onViewProfile(f), 'default'),
                  actionBtn('Remove', () => setConfirmRemoveId(f.friendshipId), 'danger'),
                ].filter(Boolean)
              } />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed #000', background: '#fff', marginTop: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No crew yet</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>Search for pilots above to send friend requests.</div>
        </div>
      )}
    </div>
  );
}
