import { useState, useEffect, useCallback } from 'react';

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

export default function FriendsView({ friends, pending, sent, searchUsers, sendRequest, respond, remove }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

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
      primary: { border: '2px solid #e50000', background: '#e50000', color: '#fff' },
      muted:   { border: '2px solid #ccc', background: '#f5f5f5', color: '#999' },
      green:   { border: '2px solid #2D7A1F', background: '#fff', color: '#2D7A1F' },
      danger:  { border: '2px solid #e50000', background: '#fff', color: '#e50000' },
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20 }}>Crew Network</div>

      {/* Search */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: 16, marginBottom: 4 }}>
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

      {/* Incoming requests */}
      {pending.length > 0 && (
        <div>
          <div style={sectionLabel}>Incoming Requests ({pending.length})</div>
          <div style={{ border: '2px solid #000', background: '#fff', padding: '0 16px' }}>
            {pending.map(p => (
              <ProfileRow key={p.friendshipId} profile={p} actions={[
                actionBtn('Accept', () => respond(p.friendshipId, true), 'green'),
                actionBtn('Decline', () => respond(p.friendshipId, false), 'danger'),
              ]} />
            ))}
          </div>
        </div>
      )}

      {/* Sent requests */}
      {sent.length > 0 && (
        <div>
          <div style={sectionLabel}>Sent Requests ({sent.length})</div>
          <div style={{ border: '2px solid #000', background: '#fff', padding: '0 16px' }}>
            {sent.map(p => (
              <ProfileRow key={p.friendshipId} profile={p} actions={[
                <span key="s" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Pending</span>,
                actionBtn('Cancel', () => remove(p.friendshipId), 'danger'),
              ]} />
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <div style={sectionLabel}>Friends ({friends.length})</div>
        {friends.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed #000', background: '#fff' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No crew yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>Search for pilots above to send friend requests.</div>
          </div>
        ) : (
          <div style={{ border: '2px solid #000', background: '#fff', padding: '0 16px' }}>
            {friends.map(f => (
              <ProfileRow key={f.friendshipId} profile={f} actions={[
                actionBtn('Remove', () => remove(f.friendshipId), 'danger'),
              ]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
