import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import EmptyState from '../shared/EmptyState.jsx';
// SessionDebrief also calls useIsMobile directly so it can adapt card internals
import LandingZoneBadge, { AlphaBadge } from '../shared/LandingZoneBadge.jsx';
import { typeBg, isHaulingType } from '../../data/contractTypes.js';
import { getContractSize } from '../../utils/contractSize.js';
import { getBanner } from '../../data/profileBanners.js';
import { useBannerUrl } from '../../hooks/useBanners.js';
import { calcFleetValue } from '../../data/ships.js';
import { isLightColor } from '../../data/cardThemes.js';

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

function SessionDebrief({ session, myProfileId, onOpenSession, cardTheme }) {
  const isMobile = useIsMobile();
  const totalSCU = session.contracts.reduce((t, c) =>
    t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
  const totalPayout = session.contracts.reduce((t, c) => t + (c.payout || 0), 0);
  const memberCount = session.members?.length || 1;
  const payoutPerPilot = memberCount > 0 ? Math.floor(totalPayout / memberCount) : 0;
  const durationMs = sessionDurationMs(session);

  const d = new Date(session.date + 'T12:00:00');
  const dayOfWeek = d.getDay();
  const themeColor = cardTheme?.colors?.[dayOfWeek] ?? null;
  const headerBg   = themeColor ?? DAY_COLORS[dayOfWeek].bg;
  const headerText = themeColor ? (isLightColor(themeColor) ? '#000' : '#fff') : DAY_COLORS[dayOfWeek].text;
  const isDark = headerText === '#fff';
  const mutedColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const statusText = session.endedAt ? 'COMPLETE' : session.startedAt ? 'IN PROGRESS' : 'SETTING UP';

  return (
    <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', height: '100%', display: 'flex', flexDirection: 'column' }}>

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
            const showSize = isHaulingType(c.type);
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
                {showSize && (
                  <span title={sz.tip} style={{
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, flexShrink: 0,
                    color: 'var(--text)', textDecoration: 'underline', letterSpacing: '0.02em',
                  }}>{'{ '}{sz.label}{' }'}</span>
                )}
                <span style={{ color: 'var(--border)', fontSize: 13, flexShrink: 0 }}>|</span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase',
                  letterSpacing: '0.04em', flex: 1, minWidth: isMobile ? '60px' : 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)',
                }}>{c.system}</span>
                {/* Payout + status grouped so they always wrap together, never split */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: isMobile ? 'auto' : 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{cSCU.toLocaleString()} SCU</span>
                  {c.payout > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2d8659', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.payout.toLocaleString()} aUEC</span>
                  )}
                  {c.done ? (
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
                      color: c.partial ? '#d97706' : '#2d8659',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      border: `1.5px solid ${c.partial ? '#d97706' : '#2d8659'}`,
                      padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {c.partial ? 'PARTIAL' : 'COMPLETE'}
                    </span>
                  ) : (
                    <span style={{ fontSize: 14 }}>⬜</span>
                  )}
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

export default function MissionsView({ sessions, myProfileId, profile, avatarUrl, onOpenSession, cardTheme }) {
  const isMobile = useIsMobile();
  const mySessions = Object.values(sessions)
    .filter(s => s.members?.some(m => m.id === myProfileId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

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

  const netWorth = (Number(profile?.auec_balance) || 0) + calcFleetValue(profile?.owned_ships);

  const statsRows = [
    ['Sessions',         mySessions.length.toLocaleString()],
    ['Contracts',        myContracts.toLocaleString()],
    ['Net Worth (aUEC)', netWorth > 0 ? netWorth.toLocaleString() : '0'],
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
        {isMobile ? (
          /* Mobile: full-square banner, stats overlaid at bottom, badges below */
          <>
            <div style={{ border: '2px solid var(--border)', position: 'relative', overflow: 'hidden', aspectRatio: '1 / 1', background: '#111' }}>
              {bannerSrc ? (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bannerSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: '#1a1a1a' }} />
              )}
              {/* Contrast gradient: subtle at top, heavy at bottom */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 38%, rgba(0,0,0,0.65) 56%, rgba(0,0,0,0.93) 100%)' }} />
              {/* Color accent bar */}
              <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: color, zIndex: 3 }} />
              {/* Top-left: avatar only */}
              <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={callsign} style={{ width: 54, height: 54, borderRadius: '50%', border: `3px solid ${color}`, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: color, border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>{callsign[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              {/* Bottom: stats overlaid on gradient */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 4, zIndex: 2, padding: '10px 14px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  {statsRows.map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {displayBadges.length > 0 && (
              <div style={{
                padding: '10px 0 0',
                display: 'flex', flexDirection: 'row', gap: 6, flexWrap: 'wrap',
                justifyContent: 'center',
                position: 'relative', zIndex: 10,
              }}>
                {displayBadges.map(id => renderBadge(id, 'xs'))}
              </div>
            )}
          </>
        ) : (
          <>
          {/* Desktop: banner bleeds from top, callsign + stats below */}
          <div style={{ border: '2px solid var(--border)', background: bannerObj ? bannerObj.fallbackBg : 'var(--bg-1)', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
            {bannerObj && (
              <>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', backgroundImage: `url(${bannerSrc ?? bannerObj.src})`, backgroundSize: 'cover', backgroundPosition: 'top center', backgroundColor: bannerObj.fallbackBg, zIndex: 0 }} />
                <div style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none', top: '45%', left: 0, right: 0, height: '55%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.72))' }} />
              </>
            )}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ background: bannerObj ? 'transparent' : '#1a1a1a', padding: '24px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={callsign} style={{ width: 90, height: 90, borderRadius: '50%', border: `4px solid ${color}`, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: color, border: `4px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 35, color: '#fff' }}>{callsign[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: bannerObj ? txtCol : '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1, textShadow: shadow }}>{callsign}</div>
                </div>
                <div style={{ width: '100%', height: 4, background: color }} />
              </div>
              <div style={{ padding: '18px 20px' }}>
                {statsRows.map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: `1px solid ${bannerObj ? 'rgba(255,255,255,0.15)' : 'var(--bg-2)'}` }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: bannerObj ? lblCol : 'var(--muted)', letterSpacing: '0.04em', textShadow: shadow }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: bannerObj ? txtCol : 'var(--text)', letterSpacing: '-0.01em', textShadow: shadow }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {displayBadges.length > 0 && (
            <div style={{
              padding: '4px 0',
              display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap',
              justifyContent: 'center', marginBottom: 16,
              marginTop: 4,
              position: 'relative', zIndex: 10,
            }}>
              {displayBadges.map(id => renderBadge(id, 'sm'))}
            </div>
          )}
          </>
        )}
      </div>

      {/* ── Sessions panel ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Mission Log</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em', flex: 1 }}>
            {mySessions.length} session{mySessions.length !== 1 ? 's' : ''}
          </div>
          {callsign && callsign !== 'Pilot' && (
            <button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?user=${encodeURIComponent(callsign.toLowerCase())}`;
                navigator.clipboard?.writeText(url).then(() => {}).catch(() => {});
              }}
              title="Copy shareable profile link"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
                background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
                padding: '4px 8px', letterSpacing: '0.06em', textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >⎘ Copy Profile Link</button>
          )}
        </div>

        {mySessions.length === 0 ? (
          <EmptyState icon="◎" title="No Missions Yet" message="Join a session from the Calendar tab to see your mission history here." />
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mySessions.map(s => <SessionDebrief key={s.id} session={s} myProfileId={myProfileId} onOpenSession={onOpenSession} cardTheme={cardTheme} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            {mySessions.map(s => <SessionDebrief key={s.id} session={s} myProfileId={myProfileId} onOpenSession={onOpenSession} cardTheme={cardTheme} />)}
          </div>
        )}
      </div>
    </div>
  );
}
