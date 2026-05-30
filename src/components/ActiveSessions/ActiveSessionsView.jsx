import { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { CONTRACT_TYPES } from '../../data/contractTypes.js';
import EmptyState from '../shared/EmptyState.jsx';
import { isLightColor } from '../../data/cardThemes.js';

const DAY_COLORS = [
  { bg: '#e8db7d', text: '#000' },
  { bg: '#19535f', text: '#fff' },
  { bg: '#0b7a75', text: '#fff' },
  { bg: '#d7c9aa', text: '#000' },
  { bg: '#7b2d26', text: '#fff' },
  { bg: '#f0f3f5', text: '#000' },
  { bg: '#c0d684', text: '#000' },
];

function useTick() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function fmtElapsed(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
}

function ActiveSessionCard({ session, myProfileId, onOpen, now, cardTheme }) {
  const isMobile = useIsMobile();
  const d = new Date(session.date + 'T12:00:00');
  const dayOfWeek = d.getDay();
  const themeColor = cardTheme?.colors?.[dayOfWeek] ?? null;
  const headerBg   = themeColor ?? DAY_COLORS[dayOfWeek].bg;
  const headerText = themeColor ? (isLightColor(themeColor) ? '#000' : '#fff') : DAY_COLORS[dayOfWeek].text;
  const isDark = headerText === '#fff';
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const totalSCU = session.contracts.reduce((t, c) =>
    t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
  const totalPayout = session.contracts.reduce((t, c) => t + (c.payout || 0), 0);
  const completedContracts = session.contracts.filter(c => c.done).length;

  const isPaused = !!session.pausedAt;
  const pausedMs = isPaused
    ? (session.totalPausedMs || 0) + (now - new Date(session.pausedAt).getTime())
    : (session.totalPausedMs || 0);
  const elapsed = now - new Date(session.startedAt).getTime() - pausedMs;

  const isMySession = session.members?.some(m => m.id === myProfileId);
  const canOpen = isMySession && onOpen;

  return (
    <div
      onClick={() => canOpen && onOpen(session.id)}
      style={{
        border: '2px solid var(--border)',
        background: 'var(--bg-1)',
        cursor: canOpen ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { if (canOpen) e.currentTarget.style.borderColor = headerBg; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Day-color header */}
      <div style={{ background: headerBg, padding: isMobile ? '14px 20px' : '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 15 : 12, color: headerText, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
            {dateLabel}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: isMobile ? 14 : 11, letterSpacing: '0.04em',
            color: isPaused ? '#ff9800' : (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'),
          }}>
            ⏱ {isPaused ? fmtElapsed(now - new Date(session.startedAt).getTime() - (session.totalPausedMs || 0) - (now - new Date(session.pausedAt).getTime())) : fmtElapsed(elapsed)}
          </div>
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 10 : 8,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: isPaused ? '#ff9800' : (isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)'),
          }}>
            {isPaused ? '⏸ PAUSED' : '● IN PROGRESS'}
          </span>
          {isMySession && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 8, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'}`,
              padding: '1px 5px',
            }}>YOU</span>
          )}
        </div>
      </div>

      {/* Crew row */}
      <div style={{ padding: isMobile ? '16px 20px' : '10px 12px', borderBottom: '1px solid var(--bg-3)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: isMobile ? 10 : 8 }}>Crew</div>
        <div style={{ display: 'flex', gap: isMobile ? 14 : 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {session.members?.map(m => {
            const av = isMobile ? 40 : 28;
            return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: av, height: av, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${m.id === myProfileId ? '#c41e3a' : (m.color || '#8b949e')}`, flexShrink: 0 }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt={m.callsign} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: m.color || '#8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 15 : 11, color: '#fff' }}>{m.callsign?.[0]?.toUpperCase()}</span>
                    </div>
                }
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 9 : 8, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: m.id === myProfileId ? '#c41e3a' : 'var(--muted)',
                maxWidth: av + 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{m.callsign}</span>
            </div>
          );})}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: isMobile ? '16px 20px' : '10px 12px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 12 : 6 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>SCU</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 26 : 18, color: '#c41e3a', lineHeight: 1 }}>{totalSCU.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Payout</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 22 : 15, color: '#2e7d32', lineHeight: 1 }}>
              {totalPayout > 0 ? `${(totalPayout / 1000).toFixed(1)}k` : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Runs</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 26 : 18, color: 'var(--text)', lineHeight: 1 }}>
              {completedContracts}<span style={{ fontSize: isMobile ? 14 : 11, color: 'var(--muted)', fontWeight: 700 }}>/{session.contracts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {canOpen && (
        <div style={{ padding: isMobile ? '8px 20px 12px' : '6px 12px 8px', borderTop: '1px solid var(--bg-3)', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Click to open →
          </span>
        </div>
      )}
    </div>
  );
}

function TrophyCabinet({ contracts }) {
  if (contracts.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em' }}>
          Trophy Cabinet
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em' }}>
          {contracts.length} contract{contracts.length !== 1 ? 's' : ''} completed
        </div>
      </div>

      {/* scrollbar hidden, cards in 2 rows, drag-to-scroll */}
      <div className="no-scrollbar" style={{ overflowX: 'auto', paddingBottom: 4 }}
        onMouseDown={e => {
          const el = e.currentTarget;
          const startX = e.pageX - el.offsetLeft;
          const startScroll = el.scrollLeft;
          const onMove = (ev) => { el.scrollLeft = startScroll - (ev.pageX - el.offsetLeft - startX); };
          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateRows: 'repeat(2, auto)',
          gridAutoFlow: 'column',
          gap: 10,
          paddingBottom: 4, paddingLeft: 2, paddingRight: 2,
          width: 'max-content',
        }}>
          {contracts.map((c, i) => {
            const typeInfo = CONTRACT_TYPES[c.type] || { bg: '#555', color: '#fff' };
            const rot = i % 3 === 0 ? -2 : i % 3 === 1 ? 1.5 : -1;
            const yShift = i % 2 === 0 ? 0 : 5;
            const d = new Date((c.sessionDate || '') + 'T12:00:00');
            const dateLabel = c.sessionDate
              ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—';
            const typeLine = c.type?.split(' - ');
            const typeShort = typeLine?.[0] || c.type || '?';
            const typeSub = typeLine?.[1] || null;

            return (
              <div
                key={`${c.id || i}`}
                title={`${c.type} · ${dateLabel}${c.payout ? ` · ${c.payout.toLocaleString()} aUEC` : ''}`}
                style={{
                  flexShrink: 0,
                  width: 78, height: 100,
                  border: '2px solid var(--border)',
                  background: 'var(--bg-1)',
                  display: 'flex', flexDirection: 'column',
                  transform: `rotate(${rot}deg) translateY(${yShift}px)`,
                  boxShadow: '2px 4px 10px rgba(0,0,0,0.22)',
                  position: 'relative',
                  cursor: 'default',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px)';
                  e.currentTarget.style.boxShadow = '4px 8px 18px rgba(0,0,0,0.35)';
                  e.currentTarget.style.zIndex = '10';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = `rotate(${rot}deg) translateY(${yShift}px)`;
                  e.currentTarget.style.boxShadow = '2px 4px 10px rgba(0,0,0,0.22)';
                  e.currentTarget.style.zIndex = '';
                }}
              >
                {/* Type color strip */}
                <div style={{ height: 20, background: typeInfo.bg, flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 6, gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 800, color: typeInfo.color, letterSpacing: '0.04em', lineHeight: 1 }}>★</span>
                </div>

                {/* Card content */}
                <div style={{ padding: '5px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', lineHeight: 1, letterSpacing: '0.04em' }}>
                    {dateLabel}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9, color: typeInfo.bg, lineHeight: 1.1, textTransform: 'uppercase', wordBreak: 'break-word' }}>
                    {typeShort}
                  </div>
                  {typeSub && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {typeSub}
                    </div>
                  )}
                  {c.payout > 0 && (
                    <div style={{ marginTop: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 7, color: '#2e7d32', lineHeight: 1 }}>
                      {c.payout >= 1000000
                        ? `${(c.payout / 1000000).toFixed(1)}M`
                        : c.payout >= 1000
                          ? `${(c.payout / 1000).toFixed(1)}k`
                          : c.payout} aUEC
                    </div>
                  )}
                  {c.cargo?.length > 0 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', lineHeight: 1 }}>
                      {c.cargo.reduce((t, ci) => t + Number(ci.scu || 0), 0)} SCU
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ActiveSessionsView({ sessions, myProfileId, onOpenSession, cardTheme }) {
  const isMobile = useIsMobile();
  const now = useTick();

  const activeSessions = Object.values(sessions)
    .filter(s => s.startedAt && !s.endedAt)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
    .slice(0, 8);

  const completedContracts = Object.values(sessions)
    .flatMap(s =>
      (s.contracts || [])
        .filter(c => c.done)
        .map(c => ({ ...c, sessionDate: s.date, sessionId: s.id }))
    )
    .sort((a, b) => {
      if (a.sessionDate > b.sessionDate) return -1;
      if (a.sessionDate < b.sessionDate) return 1;
      return 0;
    });

  return (
    <div style={{ padding: isMobile ? 12 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Active Sessions</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>
          {activeSessions.length} in progress
        </div>
      </div>

      {activeSessions.length === 0 ? (
        <EmptyState icon="▦" title="No Active Sessions" message="Start a session from the Calendar tab to begin tracking contracts and crew." />
      ) : (
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : 'repeat(4, minmax(0, 1fr))',
          gap: isMobile ? 16 : 12,
        }}>
          {activeSessions.map(s => (
            <ActiveSessionCard
              key={s.id}
              session={s}
              myProfileId={myProfileId}
              onOpen={onOpenSession}
              now={now}
              cardTheme={cardTheme}
            />
          ))}
        </div>
      )}

      {activeSessions.length >= 8 && (
        <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.08em' }}>
          Showing 8 most recently started sessions
        </div>
      )}

      {/* ── Trophy Cabinet ── */}
      <TrophyCabinet contracts={completedContracts} />
    </div>
  );
}
