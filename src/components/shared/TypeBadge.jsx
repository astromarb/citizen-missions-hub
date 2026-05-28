import { typeBg, typeColor } from '../../data/contractTypes.js';

export default function TypeBadge({ type }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      background: typeBg(type),
      border: '2px solid #000',
      color: typeColor(type),
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
