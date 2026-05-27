import { PLAYER_COLORS } from '../../data/players.js';
import { fmtKey, daysInMonth, firstWeekday } from '../../utils/dateUtils.js';

const TODAY_KEY = fmtKey(new Date());

export default function CalendarView({ sessionsByDate, viewDate, onSelectDate, onShowPicker, onNewSession }) {
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const cells = [];
  for (let i = 0; i < firstWeekday(year, month); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth(year, month); d++) cells.push(d);

  return (
    <div style={{ padding: '0 20px 24px' }}>
      <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)' }}>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid var(--border)', background: 'var(--bg-2)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={d} style={{
              padding: '10px 4px', textAlign: 'center',
              fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)',
              borderRight: i < 6 ? '1px solid var(--border)' : 'none',
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
            const dateSessions = sessionsByDate[key] || [];
            const isToday = key === TODAY_KEY;
            const isFuture = key > TODAY_KEY;
            const allDone = dateSessions.length > 0 && dateSessions.every(s => s.contracts.length > 0 && s.contracts.every(c => c.done));
            const totalContracts = dateSessions.reduce((t, s) => t + s.contracts.length, 0);
            const allPlayers = [...new Set(dateSessions.flatMap(s => s.players))];

            const handleClick = () => {
              if (isFuture) return;
              if (dateSessions.length === 1) onSelectDate(dateSessions[0].id);
              else if (dateSessions.length > 1) onShowPicker(key, dateSessions);
              else onNewSession(key);
            };

            return (
              <div key={key}
                onClick={handleClick}
                style={{
                  aspectRatio: '1', padding: '6px 8px',
                  cursor: isFuture ? 'default' : 'pointer',
                  border: isToday ? '2px solid #c41e3a' : '1px solid var(--bg-3)',
                  background: isToday ? 'rgba(196,30,58,0.05)' : 'var(--bg-1)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  opacity: isFuture ? 0.35 : 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isFuture) e.currentTarget.style.background = isToday ? 'rgba(196,30,58,0.1)' : 'var(--bg-2)'; }}
                onMouseLeave={e => { if (!isFuture) e.currentTarget.style.background = isToday ? 'rgba(196,30,58,0.05)' : 'var(--bg-1)'; }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
                  color: isToday ? '#c41e3a' : 'var(--text)',
                }}>{day}</div>

                {dateSessions.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: allDone ? '#2D7A1F' : '#c41e3a', fontWeight: 700, marginBottom: 2 }}>
                      {dateSessions.length > 1 ? `${dateSessions.length}×` : ''}{totalContracts}c{allDone ? ' ✓' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {allPlayers.slice(0, 5).map(p => (
                        <span key={p} style={{ width: 6, height: 6, borderRadius: '50%', background: PLAYER_COLORS[p] || 'var(--text)', display: 'inline-block' }} />
                      ))}
                    </div>
                  </div>
                )}

                {dateSessions.length === 0 && !isFuture && (
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
