import PlayerBadge from '../shared/PlayerBadge.jsx';
import TypeBadge from '../shared/TypeBadge.jsx';
import { keyToLabel } from '../../utils/dateUtils.js';

// Handles both { name, body } objects and plain strings (legacy)
const wpName = (w) => (typeof w === 'object' ? w.name : w) || '';

export default function SessionView({ session, onBack, onAddContract, onToggleDone, onDeleteContract, playerColors }) {
  const label = keyToLabel(session.date);
  const totalSCU = session.contracts.reduce((t, c) => t + c.cargo.reduce((s, x) => s + Number(x.scu || 0), 0), 0);

  return (
    <div>
      {/* Session header */}
      <div style={{ padding: '16px 20px', borderBottom: '2px solid #000', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: '#fff' }}>
        <button onClick={onBack}
          style={{ border: '2px solid #000', background: '#fff', color: '#000', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.02em', textTransform: 'uppercase' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
        >← Calendar</button>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: '#000' }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.06em' }}>
            {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''} · {totalSCU.toLocaleString()} SCU
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {session.players.map(p => <PlayerBadge key={p} player={p} color={playerColors?.[p]} />)}
        </div>

        <button onClick={onAddContract}
          style={{ border: '2px solid #e50000', background: '#e50000', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.borderColor = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#e50000'; e.currentTarget.style.borderColor = '#e50000'; }}
        >+ Add Contract</button>
      </div>

      {/* Contract list */}
      <div style={{ padding: '16px 20px' }}>
        {session.contracts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #000', background: '#fff' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Contracts Yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Hit "Add Contract" to log your first run.</div>
          </div>
        )}

        {session.contracts.map(contract => (
          <div key={contract.id}
            style={{ border: '2px solid #000', background: '#fff', padding: '12px 14px', marginBottom: 8, opacity: contract.done ? 0.55 : 1, transition: 'border-color 0.15s' }}
            onMouseEnter={e => { if (!contract.done) e.currentTarget.style.borderColor = '#e50000'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#000'; }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

              {/* Done toggle */}
              <button onClick={() => onToggleDone(session.id, contract.id)}
                title={contract.done ? 'Mark active' : 'Mark complete'}
                style={{
                  width: 20, height: 20, flexShrink: 0, marginTop: 2,
                  border: `2px solid ${contract.done ? '#2D7A1F' : '#000'}`,
                  background: contract.done ? '#2D7A1F' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {contract.done && <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>✓</span>}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Type badge + system */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <TypeBadge type={contract.type} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {contract.system}
                  </span>
                </div>

                {/* Route */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#000', marginBottom: 8 }}>
                  <span style={{ color: 'var(--muted)' }}>↑ </span>
                  {contract.pickups.map(wpName).join(', ')}
                  <span style={{ color: 'var(--muted)', margin: '0 8px' }}>→</span>
                  <span style={{ color: 'var(--muted)' }}>↓ </span>
                  {contract.dropoffs.map(wpName).join(', ')}
                </div>

                {/* Cargo pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {contract.cargo.map((c, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px',
                      background: 'rgba(229,0,0,0.07)', border: '1.5px solid #e50000', color: '#e50000',
                      fontWeight: 700,
                    }}>
                      {c.commodity} · {c.scu} SCU
                    </span>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button onClick={() => onDeleteContract(session.id, contract.id)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1, fontWeight: 700 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e50000'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
              >×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
