function formatDuration(ms) {
  if (!ms || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function sessionDurationMs(session) {
  if (!session.startedAt) return null;
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt
    ? new Date(session.endedAt).getTime()
    : Date.now();
  return end - start - (session.totalPausedMs || 0);
}

function pilotWaypointStats(session) {
  const stats = {};
  (session.members || []).forEach(m => {
    stats[m.id] = { pickupDone: 0, pickupTotal: 0, dropoffDone: 0, dropoffTotal: 0 };
  });
  session.contracts.forEach(c => {
    c.pickups.forEach(wp => {
      (session.members || []).forEach(m => {
        if (!stats[m.id]) return;
        stats[m.id].pickupTotal++;
        const comp = (wp.completions || []).find(x => x.profileId === m.id);
        if (comp?.status === 'done' || comp?.status === 'picked_up') stats[m.id].pickupDone++;
      });
    });
    c.dropoffs.forEach(wp => {
      (session.members || []).forEach(m => {
        if (!stats[m.id]) return;
        stats[m.id].dropoffTotal++;
        const comp = (wp.completions || []).find(x => x.profileId === m.id);
        if (comp?.status === 'done') stats[m.id].dropoffDone++;
      });
    });
  });
  return stats;
}

const sectionLabel = {
  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#888', fontWeight: 700, marginBottom: 12,
};

function SessionDebrief({ session, myProfileId }) {
  const totalSCU = session.contracts.reduce(
    (t, c) => t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0,
  );
  const totalPayout = session.contracts.reduce((t, c) => t + (c.payout || 0), 0);
  const memberCount = session.members?.length || 1;
  const payoutPerPilot = Math.floor(totalPayout / memberCount);
  const durationMs = sessionDurationMs(session);
  const pilotStats = pilotWaypointStats(session);

  const d = new Date(session.date + 'T12:00:00');
  const dateLabel = d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const statusLabel = session.endedAt
    ? 'COMPLETE'
    : session.startedAt
    ? 'IN PROGRESS'
    : 'NOT STARTED';

  const statusColor = session.endedAt ? '#2d8659' : session.startedAt ? '#ff9800' : '#888';

  return (
    <div style={{ border: '2px solid #000', background: '#fff', marginBottom: 20 }}>

      {/* ── Header ── */}
      <div style={{
        background: '#1a1a1a', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
            color: '#fff', letterSpacing: '-0.01em',
          }}>{dateLabel}</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: '0.06em',
          }}>
            {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''}
            {durationMs ? ` · ⏱ ${formatDuration(durationMs)}` : ''}
            {' · '}
            <span style={{ color: statusColor }}>{statusLabel}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            ['TOTAL SCU', totalSCU.toLocaleString()],
            ['TOTAL PAYOUT', totalPayout > 0 ? `${totalPayout.toLocaleString()} aUEC` : '—'],
            ['PER PILOT', payoutPerPilot > 0 ? `${payoutPerPilot.toLocaleString()} aUEC` : '—'],
          ].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                color: '#c41e3a', lineHeight: 1,
              }}>{v}</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 8,
                color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginTop: 3,
              }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Crew Performance Table ── */}
      {(session.members?.length || 0) > 0 && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5' }}>
          <div style={sectionLabel}>Crew Performance</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  {['Pilot', 'Home Port', 'Pickups', 'Dropoffs', 'Payout Share'].map(h => (
                    <th key={h} style={{
                      padding: '6px 12px', textAlign: 'left',
                      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9,
                      letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.members.map(m => {
                  const st = pilotStats[m.id] || {};
                  const isMe = m.id === myProfileId;
                  const allPickups = st.pickupTotal > 0 && st.pickupDone === st.pickupTotal;
                  const allDropoffs = st.dropoffTotal > 0 && st.dropoffDone === st.dropoffTotal;
                  return (
                    <tr key={m.id} style={{
                      borderBottom: '1px solid #f0f0f0',
                      background: isMe ? 'rgba(196,30,58,0.03)' : 'transparent',
                    }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: m.color || '#8b949e', border: '2px solid #000', flexShrink: 0,
                          }} />
                          <span style={{
                            fontFamily: 'var(--font-display)', fontWeight: isMe ? 800 : 700,
                            fontSize: 13, color: isMe ? '#c41e3a' : '#000',
                            textTransform: 'uppercase', letterSpacing: '0.02em',
                          }}>
                            {m.callsign}{isMe ? ' ★' : ''}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#888' }}>
                        {m.home_region || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
                        <span style={{ color: allPickups ? '#2d8659' : '#000' }}>
                          {st.pickupDone ?? 0} / {st.pickupTotal ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
                        <span style={{ color: allDropoffs ? '#2d8659' : '#000' }}>
                          {st.dropoffDone ?? 0} / {st.dropoffTotal ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#2d8659' }}>
                        {payoutPerPilot > 0 ? `${payoutPerPilot.toLocaleString()} aUEC` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Contract Breakdown ── */}
      <div style={{ padding: '16px 20px' }}>
        <div style={sectionLabel}>Contract Breakdown</div>

        {session.contracts.length === 0 ? (
          <div style={{
            padding: '20px', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, color: '#bbb',
            border: '1px dashed #ddd',
          }}>No contracts logged.</div>
        ) : (
          session.contracts.map(c => {
            const cSCU = c.cargo.reduce((t, ci) => t + Number(ci.scu || 0), 0);
            const isStellar = c.type === 'Hauling - Stellar';
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                padding: '10px 12px', marginBottom: 6,
                background: c.done ? 'rgba(45,134,89,0.04)' : '#f9f9f9',
                border: `1px solid ${c.done ? '#2d8659' : '#ddd'}`,
              }}>
                <span style={{
                  background: isStellar ? '#0066cc' : '#c41e3a',
                  color: '#fff', border: '2px solid #000',
                  padding: '3px 9px',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
                  letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{c.type}</span>

                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1, color: '#000',
                }}>{c.system}</span>

                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: '#555', fontWeight: 600,
                }}>{cSCU.toLocaleString()} SCU</span>

                {c.payout > 0 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2d8659', fontWeight: 700,
                  }}>{c.payout.toLocaleString()} aUEC</span>
                )}

                <span style={{ fontSize: 14 }}>{c.done ? '✅' : '⬜'}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function MissionsView({ sessions, myProfileId }) {
  const mySessions = Object.values(sessions)
    .filter(s => s.members?.some(m => m.id === myProfileId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!myProfileId) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 20 }}>Missions</div>
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #000', background: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Profile not loaded</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Mission Debrief</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>
          {mySessions.length} session{mySessions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {mySessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #000', background: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Missions Yet</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
            Join a session from the Calendar tab to see your mission history here.
          </div>
        </div>
      ) : (
        mySessions.map(s => (
          <SessionDebrief key={s.id} session={s} myProfileId={myProfileId} />
        ))
      )}
    </div>
  );
}
