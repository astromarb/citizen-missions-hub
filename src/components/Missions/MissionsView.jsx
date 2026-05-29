import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';
// SessionDebrief also calls useIsMobile directly so it can adapt card internals
import LandingZoneBadge, { AlphaBadge } from '../shared/LandingZoneBadge.jsx';
import { typeBg } from '../../data/contractTypes.js';
import { getContractSize } from '../../utils/contractSize.js';
import { getBanner } from '../../data/profileBanners.js';
import { useBannerUrl } from '../../hooks/useBanners.js';

// M  T  W  Th  F  Sa  Su  (JS getDay: 0=Sun)
const DAY_COLORS = [
  { bg: '#e8db7d', text: '#000' }, // Sunday
  { bg: '#19535f', text: '#fff' }, // Monday
  { bg: '#0b7a75', text: '#fff' }, // Tuesday
  { bg: '#d7c9aa', text: '#000' }, // Wednesday
  { bg: '#7b2d26', text: '#fff' }, // Thursday
  { bg: '#f0f3f5', text: '#000' }, // Friday
  { bg: '#c0d684', text: '#000' }, // Saturday
];

const FOREST_GREEN = '#2e7d32';

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

function SessionDebrief({ session, myProfileId, onOpenSession }) {
  const isMobile = useIsMobile();
  const totalSCU = session.contracts.reduce((t, c) =>
    t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
  const totalPayout = session.contracts.reduce((t, c) => t + (c.payout || 0), 0);
  const memberCount = session.members?.length || 1;
  const payoutPerPilot = memberCount > 0 ? Math.floor(totalPayout / memberCount) : 0;
  const durationMs = sessionDurationMs(session);

  const d = new Date(session.date + 'T12:00:00');
  const { bg: headerBg, text: headerText } = DAY_COLORS[d.getDay()];
  const isDark = headerText === '#fff';
  const mutedColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const statusText = session.endedAt ? 'COMPLETE' : session.startedAt ? 'IN PROGRESS' : 'SETTING UP';

  return (
    <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)' }}>

      {/* ── Day-colored header ── */}
      <div style={{ background: headerBg, padding: '12px 16px' }}>
        {/* Row 1: date + OPEN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: headerText, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            {dateLabel}
          </div>
          {onOpenSession && (
            <button
              onClick={() => onOpenSession(session.id)}
              style={{
                padding: '6px 14px', cursor: 'pointer', flexShrink: 0,
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`,
                background: 'transparent',
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
                e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
              }}
            >Open →</button>
          )}
        </div>
        {/* Row 2: contracts + timer + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: mutedColor, letterSpacing: '0.06em' }}>
            {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''}
          </span>
          {durationMs ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: mutedColor, letterSpacing: '0.02em' }}>
              ⏱ {formatDuration(durationMs)}
            </span>
          ) : null}
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: headerText, letterSpacing: '0.04em' }}>
            {statusText}
          </span>
        </div>
      </div>

      {/* ── Stats row: SCU left (red), payouts right-justified (green) ── */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bg-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px 16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 16 : 18, color: '#c41e3a', lineHeight: 1 }}>
            {totalSCU.toLocaleString()}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c41e3a', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
            TOTAL SCU
          </div>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 12 : 20, textAlign: 'right' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 14 : 18, color: FOREST_GREEN, lineHeight: 1 }}>
              {totalPayout.toLocaleString()} aUEC
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: FOREST_GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
              PAYOUT
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 14 : 18, color: FOREST_GREEN, lineHeight: 1, textDecoration: 'underline', textDecorationColor: '#000', textUnderlineOffset: '3px' }}>
              {payoutPerPilot.toLocaleString()} aUEC
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: FOREST_GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
              PER PILOT
            </div>
          </div>
        </div>
      </div>

      {/* ── Crew performance ── */}
      {session.members?.length > 0 && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-3)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
            Crew Performance
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-display)', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Pilot', 'Payout Share'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {session.members.map(m => {
                const isMe = m.id === myProfileId;
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--bg-2)', background: isMe ? 'rgba(196,30,58,0.03)' : 'transparent' }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', border: '2px solid #000', flexShrink: 0 }}>
                          {m.avatar_url
                            ? <img src={m.avatar_url} alt={m.callsign} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', background: m.color || '#8b949e' }} />
                          }
                        </div>
                        <span style={{ fontWeight: isMe ? 800 : 700, color: isMe ? '#c41e3a' : 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {m.callsign}{isMe ? ' (you)' : ''}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 700, fontSize: 13, color: FOREST_GREEN }}>
                      {payoutPerPilot > 0 ? `${payoutPerPilot.toLocaleString()} aUEC` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Contract breakdown ── */}
      {session.contracts.length > 0 && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
            Contract Breakdown
          </div>
          {session.contracts.map(c => {
            const cSCU = c.cargo.reduce((t, ci) => t + Number(ci.scu || 0), 0);
            const sz = getContractSize(cSCU);
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                padding: '10px 12px', marginBottom: 6,
                background: c.done ? 'rgba(45,134,89,0.05)' : 'var(--bg-2)',
                border: `1px solid ${c.done ? '#2d8659' : 'var(--bg-3)'}`,
              }}>
                <span style={{
                  background: typeBg(c.type), color: '#fff', border: '2px solid var(--border)',
                  padding: '3px 8px', flexShrink: 0,
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
                  letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{c.type}</span>
                <span title={sz.tip} style={{
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, flexShrink: 0,
                  color: 'var(--text)', textDecoration: 'underline', letterSpacing: '0.02em',
                }}>{'{ '}{sz.label}{' }'}</span>
                <span style={{ color: 'var(--border)', fontSize: 13, flexShrink: 0 }}>|</span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase',
                  letterSpacing: '0.04em', flex: 1, minWidth: isMobile ? '60px' : 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)',
                }}>{c.system}</span>
                {/* Payout + checkbox grouped so they always wrap together, never split */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: isMobile ? 'auto' : 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{cSCU.toLocaleString()} SCU</span>
                  {c.payout > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2d8659', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.payout.toLocaleString()} aUEC</span>
                  )}
                  <span style={{ fontSize: 14 }}>{c.done ? '✅' : '⬜'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {session.contracts.length === 0 && (
        <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>No contracts logged.</div>
      )}
    </div>
  );
}

export default function MissionsView({ sessions, myProfileId, profile, avatarUrl, onOpenSession }) {
  const isMobile = useIsMobile();
  const mySessions = Object.values(sessions)
    .filter(s => s.members?.some(m => m.id === myProfileId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const lifetimeSCU = mySessions.reduce((t, s) =>
    t + s.contracts.reduce((ct, c) => ct + c.cargo.reduce((cg, ci) => cg + Number(ci.scu || 0), 0), 0), 0);
  const lifetimePayout = mySessions.reduce((s, sess) => {
    const total = sess.contracts.reduce((t, c) => t + (c.payout || 0), 0);
    const mc = sess.members?.length || 1;
    return s + Math.floor(total / mc);
  }, 0);
  const myContracts = mySessions.reduce((t, s) => t + s.contracts.length, 0);

  if (!myProfileId) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', background: 'var(--bg-1)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Profile not loaded</div>
        </div>
      </div>
    );
  }

  const callsign   = profile?.callsign    || 'Pilot';
  const color      = profile?.color       || '#8b949e';
  const homeRegion = profile?.home_region || null;

  const displayBadges = (profile?.badges != null)
    ? profile.badges
    : ['alpha', ...(homeRegion ? ['home_region'] : [])];
  const renderBadge = (id, size) => {
    if (id === 'alpha') return <AlphaBadge key="alpha" size={size} />;
    if (id === 'home_region' && homeRegion) return <LandingZoneBadge key="home_region" region={homeRegion} size={size} />;
    return null;
  };

  const statsRows = [
    ['Sessions',   mySessions.length.toLocaleString()],
    ['Contracts',  myContracts.toLocaleString()],
    ['SCU Hauled', lifetimeSCU.toLocaleString()],
    ['aUEC Earned', lifetimePayout > 0 ? lifetimePayout.toLocaleString() : '—'],
    ...(profile?.auec_balance > 0 ? [['Wallet', `${Number(profile.auec_balance).toLocaleString()} aUEC`]] : []),
  ];

  const bannerObj = profile?.banner_panel ? getBanner(profile.banner_panel) : null;
  const bannerSrc = useBannerUrl(profile?.banner_panel ?? null);

  const txtCol = bannerObj?.textColor ?? '#fff';
  const lblCol = bannerObj ? (txtCol === '#fff' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.6)') : 'var(--muted)';
  const shadow = bannerObj ? '0 1px 4px rgba(0,0,0,0.75)' : 'none';

  return (
    <div style={{ padding: isMobile ? 12 : 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 24, alignItems: 'flex-start' }}>

      {/* ── Profile card ── */}
      <div style={{ width: isMobile ? '100%' : 275, flexShrink: 0, position: isMobile ? 'static' : 'sticky', top: 20 }}>
        <div style={{ border: '2px solid var(--border)', background: bannerObj ? bannerObj.fallbackBg : 'var(--bg-1)', marginBottom: isMobile ? 0 : 16, position: 'relative', overflow: 'hidden' }}>

          {/* Banner bleeds from top, fading into card background */}
          {bannerObj && (
            <>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: isMobile ? 190 : '100%',
                backgroundImage: `url(${bannerSrc ?? bannerObj.src})`,
                backgroundSize: 'cover', backgroundPosition: 'top center',
                backgroundColor: bannerObj.fallbackBg, zIndex: 0,
              }} />
              <div style={{
                position: 'absolute', zIndex: 1, pointerEvents: 'none',
                top: isMobile ? 65 : '45%', left: 0, right: 0,
                height: isMobile ? 140 : '55%',
                background: isMobile ? 'linear-gradient(to bottom, transparent, var(--bg-1))' : 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.72))',
              }} />
            </>
          )}

          <div style={{ position: 'relative', zIndex: 2 }}>
            {isMobile ? (
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={callsign}
                    style={{ width: 58, height: 58, borderRadius: '50%', border: `3px solid ${color}`, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 58, height: 58, borderRadius: '50%', background: color, border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#fff' }}>{callsign[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: bannerObj ? txtCol : '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1, textShadow: shadow }}>{callsign}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  {displayBadges.map(id => renderBadge(id, 'xs'))}
                </div>
                <div style={{ width: 4, alignSelf: 'stretch', background: color, flexShrink: 0 }} />
              </div>
            ) : (
              <div style={{ background: bannerObj ? 'transparent' : '#1a1a1a', padding: '24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={callsign}
                    style={{ width: 90, height: 90, borderRadius: '50%', border: `4px solid ${color}`, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: color, border: `4px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 35, color: '#fff' }}>{callsign[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: bannerObj ? txtCol : '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1, textShadow: shadow }}>{callsign}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {displayBadges.map(id => renderBadge(id, 'sm'))}
                </div>
                <div style={{ width: '100%', height: 4, background: color }} />
              </div>
            )}

            <div style={{ padding: isMobile ? '10px 14px' : '18px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 8 : 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: bannerObj ? lblCol : 'var(--muted)', marginBottom: 8, textShadow: shadow }}>Career Stats</div>
              {isMobile ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {statsRows.map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: bannerObj ? lblCol : 'var(--muted)', letterSpacing: '0.04em', textShadow: shadow }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: bannerObj ? txtCol : 'var(--text)', letterSpacing: '-0.01em', textShadow: shadow }}>{val}</div>
                    </div>
                  ))}
                </div>
              ) : (
                statsRows.map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: `1px solid ${bannerObj ? 'rgba(255,255,255,0.15)' : 'var(--bg-2)'}` }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: bannerObj ? lblCol : 'var(--muted)', letterSpacing: '0.04em', textShadow: shadow }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: bannerObj ? txtCol : 'var(--text)', letterSpacing: '-0.01em', textShadow: shadow }}>{val}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sessions panel ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Mission Log</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>
            {mySessions.length} session{mySessions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {mySessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', background: 'var(--bg-1)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Missions Yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
              Join a session from the Calendar tab to see your mission history here.
            </div>
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mySessions.map(s => <SessionDebrief key={s.id} session={s} myProfileId={myProfileId} onOpenSession={onOpenSession} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {mySessions.map(s => <SessionDebrief key={s.id} session={s} myProfileId={myProfileId} onOpenSession={onOpenSession} />)}
          </div>
        )}
      </div>
    </div>
  );
}
