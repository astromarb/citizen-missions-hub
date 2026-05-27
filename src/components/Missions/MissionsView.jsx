import { useState } from 'react';

function formatDuration(ms) {
  if (!ms || ms <= 0) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function sessionDurationMs(session) {
  if (!session.startedAt) return null;
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  return end - start - (session.totalPausedMs || 0);
}

function SessionDebrief({ session, myProfileId }) {
  const totalSCU = session.contracts.reduce((t, c) =>
    t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
  const totalPayout = session.contracts.reduce((t, c) => t + (c.payout || 0), 0);
  const memberCount = session.members?.length || 1;
  const payoutPerPilot = memberCount > 0 ? Math.floor(totalPayout / memberCount) : 0;
  const durationMs = sessionDurationMs(session);
  const allContracts = session.contracts;

  const pilotStats = {};
  session.members?.forEach(m => {
    pilotStats[m.id] = { pickupDone: 0, pickupTotal: 0, dropoffDone: 0, dropoffTotal: 0 };
  });
  allContracts.forEach(c => {
    c.pickups.forEach(wp => {
      session.members?.forEach(m => {
        if (!pilotStats[m.id]) return;
        pilotStats[m.id].pickupTotal++;
        const comp = wp.completions?.find(x => x.profileId === m.id);
        if (comp?.status === 'done' || comp?.status === 'picked_up') pilotStats[m.id].pickupDone++;
      });
    });
    c.dropoffs.forEach(wp => {
      session.members?.forEach(m => {
        if (!pilotStats[m.id]) return;
        pilotStats[m.id].dropoffTotal++;
        const comp = wp.completions?.find(x => x.profileId === m.id);
        if (comp?.status === 'done') pilotStats[m.id].dropoffDone++;
      });
    });
  });

  const d = new Date(session.date + 'T12:00:00');
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ border: '2px solid #000', background: '#fff', marginBottom: 20 }}>

      {/* Session header */}
      <div style={{ background: '#1a1a1a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{dateLabel}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, letterSpacing: '0.06em' }}>
            {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''}
            {durationMs ? ` · ⏱ ${formatDuration(durationMs)}` : ''}
            {session.endedAt ? ' · COMPLETE' : session.startedAt ? ' · IN PROGRESS' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['TOTAL SCU', totalSCU.toLocaleString()], ['PAYOUT', `${totalPayout.toLocaleString()} aUEC`], ['PER PILOT', `${payoutPerPilot.toLocaleString()} aUEC`]].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#c41e3a', lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Crew performance */}
      {session.members?.length > 0 && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', marginBottom: 12 }}>Crew Performance</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-display)', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  {['Pilot', 'Pickups', 'Dropoffs', 'Payout Share'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.members.map(m => {
                  const stats = pilotStats[m.id] || {};
                  const isMe = m.id === myProfileId;
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0', background: isMe ? 'rgba(196,30,58,0.03)' : 'transparent' }}>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.color || '#8b949e', flexShrink: 0, border: '2px solid #000' }} />
                          <span style={{ fontWeight: isMe ? 800 : 700, color: isMe ? '#c41e3a' : '#000', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {m.callsign}{isMe ? ' (you)' : ''}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        <span style={{ color: stats.pickupDone === stats.pickupTotal && stats.pickupTotal > 0 ? '#2d8659' : '#000', fontWeight: 700 }}>
                          {stats.pickupDone} / {stats.pickupTotal}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        <span style={{ color: stats.dropoffDone === stats.dropoffTotal && stats.dropoffTotal > 0 ? '#2d8659' : '#000', fontWeight: 700 }}>
                          {stats.dropoffDone} / {stats.dropoffTotal}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#2d8659' }}>
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

      {/* Contract breakdown */}
      {allContracts.length > 0 && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', marginBottom: 12 }}>Contract Breakdown</div>
          {allContracts.map(c => {
            const cSCU = c.cargo.reduce((t, ci) => t + Number(ci.scu || 0), 0);
            const isStellar = c.type === 'Hauling - Stellar';
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                padding: '10px 12px', marginBottom: 6,
                background: c.done ? 'rgba(45,134,89,0.05)' : '#f9f9f9',
                border: `1px solid ${c.done ? '#2d8659' : '#ddd'}`,
              }}>
                <span style={{
                  background: isStellar ? '#0066cc' : '#c41e3a',
                  color: '#fff', border: '2px solid #000',
                  padding: '3px 8px',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
                  letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{c.type}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1, color: '#000' }}>
                  {c.system}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#555', fontWeight: 600 }}>{cSCU.toLocaleString()} SCU</span>
                {c.payout > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2d8659', fontWeight: 700 }}>{c.payout.toLocaleString()} aUEC</span>
                )}
                <span style={{ fontSize: 14 }}>{c.done ? '✅' : '⬜'}</span>
              </div>
            );
          })}
        </div>
      )}

      {allContracts.length === 0 && (
        <div style={{ padding: '24px 20px', textAlign: 'center', color: '#bbb', fontFamily: 'var(--font-mono)', fontSize: 12 }}>No contracts logged.</div>
      )}
    </div>
  );
}

export default function MissionsView({ sessions, myProfileId, profile, avatarUrl }) {
  const mySessions = Object.values(sessions)
    .filter(s => s.members?.some(m => m.id === myProfileId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Lifetime stats for the profile card
  const lifetimeSCU = mySessions.reduce((t, s) =>
    t + s.contracts.reduce((ct, c) => ct + c.cargo.reduce((cg, ci) => cg + Number(ci.scu || 0), 0), 0), 0);
  const lifetimePayout = mySessions.reduce((s, sess) => {
    const total = sess.contracts.reduce((t, c) => t + (c.payout || 0), 0);
    const mc = sess.members?.length || 1;
    return s + Math.floor(total / mc);
  }, 0);

  if (!myProfileId) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #000', background: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Profile not loaded</div>
        </div>
      </div>
    );
  }

  const callsign = profile?.callsign || 'Pilot';
  const color = profile?.color || '#8b949e';
  const homeRegion = profile?.home_region || null;

  return (
    <div style={{ padding: 20, display: 'flex', gap: 24, alignItems: 'flex-start' }}>

      {/* ── Profile sidebar ── */}
      <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 20 }}>
        {/* Avatar card */}
        <div style={{ border: '2px solid #000', background: '#fff', marginBottom: 16 }}>
          <div style={{ background: '#1a1a1a', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={callsign}
                style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${color}`, objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: color, border: `3px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff' }}>
                  {callsign[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                {callsign}
              </div>
              {homeRegion && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                  {homeRegion}
                </div>
              )}
            </div>
            <div style={{ width: '100%', height: 3, background: color }} />
          </div>

          {/* Lifetime stats */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: 10 }}>Career Stats</div>
            {[
              ['Sessions', mySessions.length.toLocaleString()],
              ['SCU Hauled', lifetimeSCU.toLocaleString()],
              ['aUEC Earned', lifetimePayout > 0 ? lifetimePayout.toLocaleString() : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#666', letterSpacing: '0.04em' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#000', letterSpacing: '-0.01em' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sessions panel ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
          mySessions.map(s => <SessionDebrief key={s.id} session={s} myProfileId={myProfileId} />)
        )}
      </div>
    </div>
  );
}
