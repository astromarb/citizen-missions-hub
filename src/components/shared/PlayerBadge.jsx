import { PLAYER_COLORS } from '../../data/players.js';
export default function PlayerBadge({ player }) {
  const color = PLAYER_COLORS[player] || '#8b949e';
  return (
    <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, border:`0.5px solid ${color}`, color, background:`${color}22`, fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>
      {player}
    </span>
  );
}
