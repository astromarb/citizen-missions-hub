import { PLAYER_COLORS } from '../../data/players.js';
import { fmtKey, daysInMonth, firstWeekday } from '../../utils/dateUtils.js';

const TODAY_KEY = fmtKey(new Date());

export default function CalendarView({ sessions, viewDate, onSelectDate, onNewSession }) {
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const cells = [];
  for (let i = 0; i < firstWeekday(year, month); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth(year, month); d++) cells.push(d);

  return (
    <div style={{ padding: '0 20px 24px' }}>
      {/* Calendar container with hard border */}
      <div style={{ border: '2px solid #000', background: '#fff' }}>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid #000', background: 'var(--bg-2)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={d} style={{
              padding: '10px 4px', textAlign: 'center',
              fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: '#000',
              borderRight: i < 6 ? '1px solid #000' : 'none',
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return (
              <div key={'e' + i} style={{ aspectRatio: '1', background: 'var(--bg-2)', opacity: 0.4, borderRight: '1px solid var(--bg-3)', borderBottom: '1px solid var(--bg-3)' }} />
            );

            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const session = sessions[key], isToday = key === TODAY_KEY;
            const allDone = session?.contracts.length > 0 && session.contracts.every(c => c.done);

            return (
              <div key={key}
                onClick={() => session ? onSelectDate(key) : onNewSession(key)}
                style={{
                  aspectRatio: '1', padding: '6px 8px', cursor: 'pointer',
                  border: isToday ? '2px solid #c41e3a' : '1px solid var(--bg-3)',
                  background: isToday ? 'rgba(196,30,58,0.05)' : session ? '#fff' : '#fff',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'background 0.1s',
                  outline: session && !isToday ? '1px solid #ccc' : 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isToday ? 'rgba(196,30,58,0.1)' : 'var(--bg-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(196,30,58,0.05)' : '#fff'; }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
                  color: isToday ? '#c41e3a' : '#000',
                }}>{day}</div>

                {session && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: allDone ? '#2D7A1F' : '#c41e3a', fontWeight: 700, marginBottom: 2 }}>
                      {session.contracts.length}c{allDone ? ' ✓' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {session.players.slice(0, 5).map(p => (
                        <span key={p} style={{ width: 6, height: 6, borderRadius: '50%', background: PLAYER_COLORS[p] || '#000', display: 'inline-block' }} />
                      ))}
                    </div>
                  </div>
                )}

                {!session && (
                  <div style={{ fontSize: 9, color: 'var(--bg-3)', fontFamily: 'var(--font-mono)' }}>+</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
