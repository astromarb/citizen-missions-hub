export default function StatsView({ sessions }) {
  const allSessions = Object.values(sessions);
  const allContracts = allSessions.flatMap(s => s.contracts);
  const totalSCU = allContracts.reduce((t, c) => t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
  const doneCount = allContracts.filter(c => c.done).length;

  // Commodity breakdown (top 8 by SCU)
  const commMap = {};
  allContracts.forEach(c => c.cargo.forEach(ci => {
    commMap[ci.commodity] = (commMap[ci.commodity] || 0) + Number(ci.scu || 0);
  }));
  const topComm = Object.entries(commMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCommSCU = topComm[0]?.[1] || 1;

  // Contract type split
  const stellar = allContracts.filter(c => c.type === 'Hauling - Stellar').length;
  const inter   = allContracts.filter(c => c.type === 'Hauling - Interstellar').length;
  const total   = allContracts.length || 1;

  // Per-player SCU ranking
  const playerMap = {};
  allSessions.forEach(s => s.players.forEach(p => {
    if (!playerMap[p]) playerMap[p] = 0;
    playerMap[p] += s.contracts.reduce((t, c) => t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
  }));
  const topPlayers = Object.entries(playerMap).sort((a, b) => b[1] - a[1]);

  const section = (title) => (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
      {title}
    </div>
  );

  if (allContracts.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20 }}>Stats</div>
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #000', background: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Data Yet</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Log some contracts to see stats here.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20 }}>Stats</div>

      {/* ── Overview strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '2px solid #000', marginBottom: 20 }}>
        {[
          ['Sessions', allSessions.length],
          ['Contracts', allContracts.length],
          ['Completed', doneCount],
          ['Total SCU', totalSCU.toLocaleString()],
        ].map(([label, val], i) => (
          <div key={label} style={{ padding: '16px 12px', textAlign: 'center', borderRight: i < 3 ? '2px solid #000' : 'none', background: i === 3 ? 'rgba(229,0,0,0.05)' : '#fff' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: i === 3 ? '#e50000' : '#000', letterSpacing: '-0.02em', lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* ── Commodity breakdown ── */}
        <div style={{ border: '2px solid #000', padding: '16px', background: '#fff' }}>
          {section('Top Commodities by SCU')}
          {topComm.map(([name, scu]) => (
            <div key={name} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#000', fontWeight: 600 }}>{name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e50000', fontWeight: 700 }}>{scu.toLocaleString()}</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-3)', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, right: `${100 - (scu / maxCommSCU * 100)}%`, background: '#e50000' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ── Contract types ── */}
          <div style={{ border: '2px solid #000', padding: '16px', background: '#fff' }}>
            {section('Contract Types')}
            {[['Stellar', stellar, '#185FA5'], ['Interstellar', inter, '#0F6E56']].map(([label, count, color]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {count} ({Math.round(count / total * 100)}%)
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-3)' }}>
                  <div style={{ height: '100%', width: `${count / total * 100}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Pilot leaderboard ── */}
          {topPlayers.length > 0 && (
            <div style={{ border: '2px solid #000', padding: '16px', background: '#fff', flex: 1 }}>
              {section('Pilot SCU Ranking')}
              {topPlayers.map(([callsign, scu], i) => (
                <div key={callsign} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i === 0 ? '#e50000' : 'var(--muted)', fontWeight: 700, width: 16 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, flex: 1, color: '#000' }}>{callsign}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: i === 0 ? '#e50000' : '#000', fontWeight: 700 }}>
                    {scu.toLocaleString()} SCU
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
