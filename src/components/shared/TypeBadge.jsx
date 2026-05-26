const STYLES = {
  'Hauling - Stellar':       { bg:'rgba(24,95,165,0.25)',  border:'#185FA5', text:'#85B7EB' },
  'Hauling - Interstellar':  { bg:'rgba(15,110,86,0.25)',  border:'#0F6E56', text:'#5DCAA5' },
};
export default function TypeBadge({ type }) {
  const s = STYLES[type] ?? { bg:'rgba(136,136,136,0.2)', border:'#8b949e', text:'#8b949e' };
  return (
    <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:s.bg, border:`0.5px solid ${s.border}`, color:s.text }}>
      {type}
    </span>
  );
}
