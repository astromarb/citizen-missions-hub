export default function LeaderboardView({ sessions, myProfileId }) {
  const allSessions = Object.values(sessions);

  // Aggregate per-player stats across all sessions
  const statsMap = {};
  allSessions.forEach(sess => {
    const mc = sess.members?.length || 1;
    const sessSCU = sess.contracts.reduce((t, c) =>
      t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
    const sessPayout = sess.contracts.reduce((t, c) => t + (c.payout || 0), 0);

    sess.members?.forEach(m => {
      if (!statsMap[m.id]) statsMap[m.id] = { id: m.id, callsign: m.callsign, color: m.color || '#8b949e', sessions: 0, scu: 0, payout: 0, waypoints: 0 };
      statsMap[m.id].sessions++;
      statsMap[m.id].scu     += Math.floor(sessSCU    / mc);
      statsMap[m.id].payout  += Math.floor(sessPayout / mc);
    });

    sess.contracts.forEach(c => {
      [...c.pickups, ...c.dropoffs].forEach(wp => {
        wp.completions?.forEach(comp => {
          if (comp.status === 'done' && statsMap[comp.profileId]) {
            statsMap[comp.profileId].waypoints++;
          }
        });
      });
    });
  });

  const players = Object.values(statsMap);
  if (players.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20 }}>Leaderboards</div>
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', background: 'var(--bg-1)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Data Yet</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>Complete missions with crew to appear on the boards.</div>
        </div>
      </div>
    );
  }

  const bySCU      = [...players].sort((a, b) => b.scu      - a.scu);
  const byPayout   = [...players].sort((a, b) => b.payout   - a.payout);
  const bySessions = [...players].sort((a, b) => b.sessions - a.sessions);
  const byWaypoints= [...players].sort((a, b) => b.waypoints- a.waypoints);

  const rankMedal = (i) => i === 0 ? '#c41e3a' : i === 1 ? '#555' : i === 2 ? '#7a5c00' : 'var(--muted)';

  function Board({ title, rows, valueKey, format }) {
    return (
      <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)' }}>
        <div style={{
          background: '#1a1a1a', padding: '12px 16px',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
          color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>{title}</div>
        {rows.map((p, i) => {
          const isMe = p.id === myProfileId;
          const val = format(p[valueKey]);
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px',
              borderBottom: '1px solid var(--bg-3)',
              background: isMe ? 'rgba(196,30,58,0.04)' : 'transparent',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13,
                color: rankMedal(i), width: 24, flexShrink: 0, textAlign: 'center',
              }}>
                {i === 0 ? '★' : `${i + 1}`}
              </div>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0, border: '2px solid var(--border)' }} />
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: isMe ? 800 : 700, fontSize: 13,
                color: isMe ? '#c41e3a' : 'var(--text)', textTransform: 'uppercase',
                letterSpacing: '0.04em', flex: 1,
              }}>
                {p.callsign}{isMe ? ' ★' : ''}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13,
                color: i === 0 ? '#c41e3a' : 'var(--text)',
              }}>{val}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const fmt    = (n) => n.toLocaleString();
  const fmtSCU = (n) => `${n.toLocaleString()} SCU`;
  const fmtAUEC= (n) => n > 0 ? `${n.toLocaleString()} aUEC` : '—';

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Leaderboards</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>
          {players.length} pilot{players.length !== 1 ? 's' : ''} · all-time
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Board title="SCU Hauled"       rows={bySCU}       valueKey="scu"      format={fmtSCU}  />
        <Board title="aUEC Earned"      rows={byPayout}    valueKey="payout"   format={fmtAUEC} />
        <Board title="Sessions Flown"   rows={bySessions}  valueKey="sessions" format={fmt}     />
        <Board title="Waypoints Completed" rows={byWaypoints} valueKey="waypoints" format={fmt} />
      </div>
    </div>
  );
}
