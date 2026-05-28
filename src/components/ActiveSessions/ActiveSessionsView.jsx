import { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';

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

function ActiveSessionCard({ session, myProfileId, onOpen, now }) {
  const d = new Date(session.date + 'T12:00:00');
  const { bg: headerBg, text: headerText } = DAY_COLORS[d.getDay()];
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
      <div style={{ background: headerBg, padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: headerText, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
            {dateLabel}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em',
            color: isPaused ? '#ff9800' : (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'),
          }}>
            ⏱ {isPaused ? fmtElapsed(now - new Date(session.startedAt).getTime() - (session.totalPausedMs || 0) - (now - new Date(session.pausedAt).getTime())) : fmtElapsed(elapsed)}
          </div>
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: isPaused ? '#ff9800' : (isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)'),
          }}>
            {isPaused ? '⏸ PAUSED' : '● IN PROGRESS'}
          </span>
          {isMySession && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'}`,
              padding: '1px 5px',
            }}>YOU</span>
          )}
        </div>
      </div>

      {/* Crew row */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-3)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Crew</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {session.members?.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${m.id === myProfileId ? '#c41e3a' : (m.color || '#8b949e')}`, flexShrink: 0 }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt={m.callsign} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: m.color || '#8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#fff' }}>{m.callsign?.[0]?.toUpperCase()}</span>
                    </div>
                }
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: m.id === myProfileId ? '#c41e3a' : 'var(--muted)',
              }}>{m.callsign}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 20px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>SCU</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#c41e3a', lineHeight: 1 }}>{totalSCU.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Payout</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#2e7d32', lineHeight: 1 }}>
              {totalPayout > 0 ? `${(totalPayout / 1000).toFixed(1)}k` : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Runs</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text)', lineHeight: 1 }}>
              {completedContracts}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 700 }}>/{session.contracts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {canOpen && (
        <div style={{ padding: '8px 20px 12px', borderTop: '1px solid var(--bg-3)', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Click to open →
          </span>
        </div>
      )}
    </div>
  );
}

export default function ActiveSessionsView({ sessions, myProfileId, onOpenSession }) {
  const isMobile = useIsMobile();
  const now = useTick();

  const activeSessions = Object.values(sessions)
    .filter(s => s.startedAt && !s.endedAt)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
    .slice(0, 6);

  return (
    <div style={{ padding: isMobile ? 12 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Active Sessions</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>
          {activeSessions.length} in progress
        </div>
      </div>

      {activeSessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', background: 'var(--bg-1)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Active Sessions</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
            Sessions appear here once a timer is started.<br />Planning-stage sessions do not show up here.
          </div>
        </div>
      ) : (
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : 'repeat(2, 1fr)',
          gap: 20,
        }}>
          {activeSessions.map(s => (
            <ActiveSessionCard
              key={s.id}
              session={s}
              myProfileId={myProfileId}
              onOpen={onOpenSession}
              now={now}
            />
          ))}
        </div>
      )}

      {activeSessions.length >= 6 && (
        <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.08em' }}>
          Showing 6 most recently started sessions
        </div>
      )}
    </div>
  );
}
