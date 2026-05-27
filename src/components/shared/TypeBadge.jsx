const STYLES = {
  'Hauling - Stellar':      { bg: 'rgba(24,95,165,0.08)',  border: '#185FA5', text: '#185FA5' },
  'Hauling - Interstellar': { bg: 'rgba(15,110,86,0.08)',  border: '#0F6E56', text: '#0F6E56' },
};
export default function TypeBadge({ type }) {
  const s = STYLES[type] ?? { bg: 'rgba(100,100,100,0.08)', border: '#666', text: '#666' };
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px',
      background: s.bg, border: `1.5px solid ${s.border}`, color: s.text,
      fontFamily: 'var(--font-display)', fontWeight: 700,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}
