import { PLAYER_COLORS } from '../../data/players.js';
export default function PlayerBadge({ player, color: colorProp }) {
  const color = colorProp || PLAYER_COLORS[player] || '#666';
  return (
    <span style={{
      fontSize: 11, padding: '2px 10px',
      border: `2px solid ${color}`, color,
      background: `${color}12`,
      fontFamily: 'var(--font-display)', fontWeight: 700,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
    }}>
      {player}
    </span>
  );
}
