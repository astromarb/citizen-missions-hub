const STYLES = {
  'Hauling - Stellar':      { bg: '#0066cc', color: '#fff', border: '#0066cc' },
  'Hauling - Interstellar': { bg: '#c41e3a', color: '#fff', border: '#c41e3a' },
};

export default function TypeBadge({ type }) {
  const s = STYLES[type] ?? { bg: '#555', color: '#fff', border: '#555' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      background: s.bg,
      border: `2px solid #000`,
      color: s.color,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}
