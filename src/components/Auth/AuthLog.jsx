import { useState } from 'react';

const EVENT_STYLE = {
  SIGNED_IN:       { color: '#3B8B56', label: 'signed in' },
  SIGNED_OUT:      { color: '#E24B4A', label: 'signed out' },
  INITIAL_SESSION: { color: '#378ADD', label: 'session restored' },
  TOKEN_REFRESHED: { color: '#8b949e', label: 'token refreshed' },
};

const fmtTime = (d) =>
  d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function AuthLog({ entries }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9000,
      fontFamily: 'var(--font-mono)', fontSize: 11,
    }}>
      {/* Toggle tab */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none',
          padding: '5px 12px', cursor: 'pointer',
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: open ? '8px 8px 0 0' : 8,
          borderBottom: open ? '1px solid var(--bg-2)' : '1px solid var(--border)',
        }}
      >
        <span style={{ color: 'var(--gold)', fontSize: 9 }}>●</span>
        <span style={{ color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Auth Log</span>
        {entries.length > 0 && (
          <span style={{
            background: 'var(--bg-0)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '0 6px', fontSize: 10, color: 'var(--muted)',
          }}>
            {entries.length}
          </span>
        )}
        <span style={{ fontSize: 9, color: 'var(--muted)', opacity: 0.5 }}>{open ? '▾' : '▴'}</span>
      </div>

      {/* Log panel */}
      {open && (
        <div style={{
          width: 340, maxHeight: 240, overflowY: 'auto',
          background: 'var(--bg-0)', border: '1px solid var(--border)',
          borderTop: 'none', borderRadius: '0 0 8px 8px',
        }}>
          {entries.length === 0 ? (
            <div style={{ padding: '18px 12px', color: 'var(--muted)', letterSpacing: '0.06em', textAlign: 'center' }}>
              NO EVENTS YET
            </div>
          ) : (
            entries.map((e) => {
              const s = EVENT_STYLE[e.event] ?? { color: 'var(--muted)', label: e.event.toLowerCase() };
              return (
                <div key={e.id} style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  padding: '5px 10px', borderBottom: '1px solid var(--bg-2)',
                }}>
                  <span style={{ color: 'var(--muted)', flexShrink: 0, fontSize: 10 }}>
                    {fmtTime(e.time)}
                  </span>
                  <span style={{ color: s.color, flexShrink: 0, minWidth: 110, letterSpacing: '0.04em' }}>
                    {s.label}
                  </span>
                  <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
