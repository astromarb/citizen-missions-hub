import { useState } from 'react';

const EVENT_STYLE = {
  SIGNED_IN:       { color: '#2D7A1F', label: 'signed in' },
  SIGNED_OUT:      { color: '#e50000', label: 'signed out' },
  INITIAL_SESSION: { color: '#185FA5', label: 'session restored' },
  TOKEN_REFRESHED: { color: '#666666', label: 'token refreshed' },
};

const fmtTime = (d) =>
  d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function AuthLog({ entries }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, zIndex: 9000,
      fontFamily: 'var(--font-mono)', fontSize: 11,
    }}>
      {/* Toggle tab */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none',
          padding: '5px 12px', cursor: 'pointer',
          background: open ? '#000' : '#fff',
          border: '2px solid #000',
          borderBottom: open ? '2px solid #000' : '2px solid #000',
        }}
      >
        <span style={{ color: '#e50000', fontSize: 9 }}>●</span>
        <span style={{ color: open ? '#fff' : '#000', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Auth Log</span>
        {entries.length > 0 && (
          <span style={{
            background: open ? '#fff' : '#000', border: '1px solid',
            borderColor: open ? '#fff' : '#000',
            padding: '0 6px', fontSize: 10,
            color: open ? '#000' : '#fff',
          }}>
            {entries.length}
          </span>
        )}
        <span style={{ fontSize: 9, color: open ? '#fff' : '#666', opacity: 0.7 }}>{open ? '▾' : '▴'}</span>
      </div>

      {/* Log panel */}
      {open && (
        <div style={{
          width: 340, maxHeight: 240, overflowY: 'auto',
          background: '#fff', border: '2px solid #000',
          borderTop: 'none',
        }}>
          {entries.length === 0 ? (
            <div style={{ padding: '18px 12px', color: 'var(--muted)', letterSpacing: '0.06em', textAlign: 'center', textTransform: 'uppercase', fontSize: 10 }}>
              No Events Yet
            </div>
          ) : (
            entries.map((e) => {
              const s = EVENT_STYLE[e.event] ?? { color: 'var(--muted)', label: e.event.toLowerCase() };
              return (
                <div key={e.id} style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  padding: '5px 10px', borderBottom: '1px solid var(--bg-3)',
                }}
                  onMouseEnter={(el) => { el.currentTarget.style.background = 'var(--bg-2)'; }}
                  onMouseLeave={(el) => { el.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ color: 'var(--muted)', flexShrink: 0, fontSize: 10 }}>
                    {fmtTime(e.time)}
                  </span>
                  <span style={{ color: s.color, flexShrink: 0, minWidth: 110, letterSpacing: '0.04em', fontWeight: 700 }}>
                    {s.label}
                  </span>
                  <span style={{ color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.name}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
