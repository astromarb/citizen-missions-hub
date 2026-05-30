export default function EmptyState({ icon = '◎', title, message, action, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 24px', textAlign: 'center', border: '2px dashed var(--border)', background: 'var(--bg-1)',
    }}>
      <div style={{ fontSize: 32, color: 'var(--muted)', marginBottom: 12, opacity: 0.4, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{title}</div>
      {message && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 320, marginBottom: action ? 20 : 0 }}>{message}</div>}
      {action && (
        <button onClick={onAction}
          style={{ padding: '9px 22px', border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.borderColor = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}>
          {action}
        </button>
      )}
    </div>
  );
}
