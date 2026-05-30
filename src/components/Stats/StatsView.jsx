import LeaderboardView from '../Leaderboard/LeaderboardView.jsx';

export default function StatsView({ sessions, myProfileId, profiles = [], friends = [] }) {
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

  // Contract type split (normalise legacy types)
  const normaliseType = (t) => {
    if (t === 'Hauling - Stellar') return 'Hauling - Solar';
    if (t === 'Hauling - Local')   return 'Hauling - Planetary';
    return t;
  };
  const typeCounts = {};
  allContracts.forEach(c => {
    const t = normaliseType(c.type);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const total = allContracts.length || 1;
  const TYPE_ROWS = [
    ['Direct',        'Hauling - Direct',       '#6750a4'],
    ['Interstellar',  'Hauling - Interstellar',  '#0066cc'],
    ['Solar',         'Hauling - Solar',         '#e07028'],
    ['Planetary',     'Hauling - Planetary',     '#2e7d32'],
  ];

  // Top haul partners — count sessions shared with each co-pilot
  const partnerSessions = {};
  const partnerProfiles = {};
  allSessions.forEach(s => {
    if (!s.members?.some(m => m.id === myProfileId)) return;
    s.members.forEach(m => {
      if (m.id === myProfileId) return;
      partnerSessions[m.id] = (partnerSessions[m.id] || 0) + 1;
      if (!partnerProfiles[m.id]) partnerProfiles[m.id] = m;
    });
  });
  const topPartners = Object.entries(partnerSessions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ ...partnerProfiles[id], count }));

  const section = (title) => (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
      {title}
    </div>
  );

  const leaderboards = (
    <LeaderboardView sessions={sessions} myProfileId={myProfileId} profiles={profiles} friends={friends} />
  );

  if (allContracts.length === 0) {
    return (
      <>
        <div style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20 }}>Stats</div>
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', background: 'var(--bg-1)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Data Yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Log some contracts to see stats here.</div>
          </div>
        </div>
        {leaderboards}
      </>
    );
  }

  return (
    <>
    <div style={{ padding: '20px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20 }}>Stats</div>

      {/* ── Overview strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '2px solid var(--border)', marginBottom: 20 }}>
        {[
          ['Sessions', allSessions.length],
          ['Contracts', allContracts.length],
          ['Completed', doneCount],
          ['Total SCU', totalSCU.toLocaleString()],
        ].map(([label, val], i) => (
          <div key={label} style={{ padding: '16px 12px', textAlign: 'center', borderRight: i < 3 ? '2px solid var(--border)' : 'none', background: i === 3 ? 'rgba(196,30,58,0.05)' : 'var(--bg-1)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: i === 3 ? '#c41e3a' : 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* ── Commodity breakdown ── */}
        <div style={{ border: '2px solid var(--border)', padding: '16px', background: 'var(--bg-1)' }}>
          {section('Top Commodities by SCU')}
          {topComm.map(([name, scu]) => (
            <div key={name} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c41e3a', fontWeight: 700 }}>{scu.toLocaleString()}</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-3)', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, right: `${100 - (scu / maxCommSCU * 100)}%`, background: '#c41e3a' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ── Contract types ── */}
          <div style={{ border: '2px solid var(--border)', padding: '16px', background: 'var(--bg-1)' }}>
            {section('Contract Types')}
            {TYPE_ROWS.map(([label, key, color]) => {
              const count = typeCounts[key] || 0;
              if (count === 0) return null;
              return (
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
              );
            })}
          </div>

          {/* ── Top haul partners ── */}
          <div style={{ border: '2px solid var(--border)', padding: '16px', background: 'var(--bg-1)', flex: 1 }}>
            {section('Top Haul Partners')}
            {topPartners.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', padding: '12px 0' }}>
                No co-pilots logged yet.
              </div>
            ) : topPartners.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', marginBottom: 6,
                background: i === 0 ? 'rgba(46,125,50,0.06)' : 'var(--bg-2)',
                border: i === 0 ? '1px solid #2e7d32' : '1px solid var(--bg-3)',
              }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.color || '#8b949e', border: '2px solid var(--border)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>
                  {i + 1}. {p.callsign}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2e7d32', fontWeight: 700 }}>
                  {p.count} session{p.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    {leaderboards}
    </>
  );
}
