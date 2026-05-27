const scuFor = (sessions, callsign) => {
  let scu = 0, sessCount = 0, contractCount = 0;
  for (const s of Object.values(sessions)) {
    if (!s.players.includes(callsign)) continue;
    sessCount++;
    for (const c of s.contracts) {
      contractCount++;
      scu += c.cargo.reduce((t, ci) => t + Number(ci.scu || 0), 0);
    }
  }
  return { sessCount, contractCount, scu };
};

export default function RosterView({ sessions, profiles }) {
  const sorted = [...profiles].sort((a, b) => {
    const as = scuFor(sessions, a.callsign);
    const bs = scuFor(sessions, b.callsign);
    return bs.scu - as.scu;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Crew Roster</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>
          {profiles.length} member{profiles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {profiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #000', background: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Crew Yet</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Members appear here after logging in with Discord.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {sorted.map(profile => {
            const { sessCount, contractCount, scu } = scuFor(sessions, profile.callsign);
            const color = profile.color || '#8b949e';
            return (
              <div key={profile.id} style={{ border: '2px solid #000', background: '#fff', padding: '16px' }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.callsign}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${color}`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, border: `2px solid ${color}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-display)' }}>
                        {profile.callsign[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.callsign}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                      Pilot
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  {[['Sessions', sessCount], ['Contracts', contractCount], ['SCU', scu.toLocaleString()]].map(([label, val]) => (
                    <div key={label} style={{ textAlign: 'center', padding: '8px 2px', background: 'var(--bg-2)', border: '1px solid var(--bg-3)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#c41e3a', letterSpacing: '-0.02em', lineHeight: 1 }}>{val}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
