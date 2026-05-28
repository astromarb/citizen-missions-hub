import { useIsMobile } from '../../hooks/useIsMobile.js';
import { PLAYER_COLORS } from '../../data/players.js';
import { fmtKey, daysInMonth, firstWeekday } from '../../utils/dateUtils.js';

const TODAY_KEY = fmtKey(new Date());

function sessionAccent(session) {
  if (session.endedAt) {
    return session.contracts.length > 0 && session.contracts.every(c => c.done)
      ? '#2d7a1f' : '#555';
  }
  if (session.pausedAt)  return '#ff9800';
  if (session.startedAt) return '#c41e3a';
  return null;
}

function SessionBar({ session, onClick }) {
  const accent  = sessionAccent(session);
  const members = session.members || [];

  let dots = members.map(m => m.color || PLAYER_COLORS[m.callsign] || '#8b949e');
  if (dots.length === 0 && session.players) {
    dots = session.players.map(cs => PLAYER_COLORS[cs] || '#8b949e');
  }
  const overflow = dots.length > 5 ? dots.length - 4 : 0;
  const visible  = overflow ? dots.slice(0, 4) : dots;

  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '1px 3px 1px 3px',
        background: accent ? `${accent}18` : 'var(--bg-2)',
        borderLeft: `2px solid ${accent || 'var(--border)'}`,
        height: 12, minHeight: 12,
        overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
        transition: 'filter 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.82)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
    >
      {visible.map((col, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: col, border: '1px solid rgba(0,0,0,0.18)',
          flexShrink: 0,
        }} />
      ))}
      {overflow > 0 && (
        <span style={{ fontSize: 6, color: 'var(--muted)', fontFamily: 'var(--font-mono)', lineHeight: 1, flexShrink: 0 }}>
          +{overflow}
        </span>
      )}
    </div>
  );
}

export default function CalendarView({ sessionsByDate, viewDate, myProfileId, onSelectDate, onShowPicker, onNewSession }) {
  const isMobile = useIsMobile();
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const cells = [];
  for (let i = 0; i < firstWeekday(year, month); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth(year, month); d++) cells.push(d);

  const MAX_BARS = isMobile ? 3 : 6;

  return (
    <div style={{ padding: isMobile ? '0 8px 16px' : '0 20px 24px' }}>
      <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)' }}>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid var(--border)', background: 'var(--bg-2)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={d} style={{
              padding: isMobile ? '7px 2px' : '10px 4px', textAlign: 'center',
              fontFamily: 'var(--font-display)', fontSize: isMobile ? 7 : 9, fontWeight: 800,
              letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text)',
              borderRight: i < 6 ? '1px solid var(--border)' : 'none',
            }}>{isMobile ? d[0] : d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return (
              <div key={'e' + i} style={{
                minHeight: isMobile ? 52 : 82,
                background: 'var(--bg-2)', opacity: 0.4,
                borderRight: '1px solid var(--bg-3)', borderBottom: '1px solid var(--bg-3)',
              }} />
            );

            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dateSessions = sessionsByDate[key] || [];
            const isToday  = key === TODAY_KEY;
            const isFuture = key > TODAY_KEY;

            const handleCellClick = () => {
              if (isFuture) return;
              const mine = myProfileId
                ? dateSessions.filter(s => s.members?.some(m => m.id === myProfileId))
                : dateSessions;
              if (mine.length === 1) onSelectDate(mine[0].id);
              else if (mine.length > 1) onShowPicker(key, mine);
              else onNewSession(key);
            };

            const visibleBars = dateSessions.slice(0, MAX_BARS);
            const extraCount  = dateSessions.length - visibleBars.length;

            return (
              <div key={key}
                onClick={handleCellClick}
                style={{
                  minHeight: isMobile ? 52 : 82,
                  padding: isMobile ? '3px 2px' : '5px 3px 3px 3px',
                  cursor: isFuture ? 'default' : 'pointer',
                  border: isToday ? '2px solid #c41e3a' : '1px solid var(--bg-3)',
                  background: isToday ? 'rgba(196,30,58,0.05)' : 'var(--bg-1)',
                  display: 'flex', flexDirection: 'column',
                  opacity: isFuture ? 0.32 : 1,
                  transition: 'background 0.1s',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!isFuture) e.currentTarget.style.background = isToday ? 'rgba(196,30,58,0.09)' : 'var(--bg-2)'; }}
                onMouseLeave={e => { if (!isFuture) e.currentTarget.style.background = isToday ? 'rgba(196,30,58,0.05)' : 'var(--bg-1)'; }}
              >
                {/* Day number */}
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: isMobile ? 9 : 11,
                  color: isToday ? '#c41e3a' : 'var(--text)',
                  lineHeight: 1, marginBottom: 3, paddingLeft: 1, flexShrink: 0,
                }}>{day}</div>

                {/* Session bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  {visibleBars.map(session => (
                    <SessionBar
                      key={session.id}
                      session={session}
                      onClick={() => onSelectDate(session.id)}
                    />
                  ))}
                  {extraCount > 0 && (
                    <div style={{
                      fontSize: 7, color: 'var(--muted)',
                      fontFamily: 'var(--font-mono)', lineHeight: 1,
                      paddingLeft: 3, flexShrink: 0,
                    }}>+{extraCount}</div>
                  )}
                  {dateSessions.length === 0 && !isFuture && (
                    <div style={{
                      marginTop: 'auto',
                      fontSize: isMobile ? 8 : 9, color: 'var(--bg-3)',
                      fontFamily: 'var(--font-mono)', paddingLeft: 1,
                    }}>+</div>
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
