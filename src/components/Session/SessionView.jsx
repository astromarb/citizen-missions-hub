import PlayerBadge from '../shared/PlayerBadge.jsx';
import TypeBadge from '../shared/TypeBadge.jsx';
import { keyToLabel } from '../../utils/dateUtils.js';
export default function SessionView({ session, onBack, onAddContract, onToggleDone, onDeleteContract }) {
  const label=keyToLabel(session.date);
  const totalSCU=session.contracts.reduce((t,c)=>t+c.cargo.reduce((s,x)=>s+Number(x.scu||0),0),0);
  return (
    <div>
      <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
        <button onClick={onBack} style={{background:'none',border:'1px solid var(--border)',color:'var(--muted)',padding:'5px 12px',borderRadius:6,cursor:'pointer',fontSize:12,fontFamily:'var(--font-mono)'}}>← Calendar</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:'var(--font-mono)',fontSize:15,color:'var(--text)'}}>{label}</div>
          <div style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-mono)',marginTop:2}}>{session.contracts.length} contract{session.contracts.length!==1?'s':''} · {totalSCU.toLocaleString()} SCU</div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{session.players.map(p=><PlayerBadge key={p} player={p}/>)}</div>
        <button onClick={onAddContract} style={{padding:'8px 16px',border:'1px solid var(--gold)',background:'var(--gold-dim)',color:'var(--gold)',borderRadius:6,cursor:'pointer',fontSize:12,fontFamily:'var(--font-mono)'}}>+ Add Contract</button>
      </div>
      <div style={{padding:'16px 20px'}}>
        {session.contracts.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:'var(--muted)',fontFamily:'var(--font-mono)',fontSize:12,letterSpacing:'0.06em'}}>NO CONTRACTS LOGGED — HIT "ADD CONTRACT" TO START</div>}
        {session.contracts.map(contract=>(
          <div key={contract.id} style={{background:'var(--bg-1)',border:'1px solid var(--bg-2)',borderRadius:8,padding:'12px 14px',marginBottom:10,opacity:contract.done?0.6:1}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <button onClick={()=>onToggleDone(session.id,contract.id)} style={{width:20,height:20,borderRadius:'50%',flexShrink:0,marginTop:2,border:`1.5px solid ${contract.done?'#3B6D11':'var(--border)'}`,background:contract.done?'#3B6D11':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {contract.done&&<span style={{fontSize:10,color:'#97C459'}}>✓</span>}
              </button>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7,flexWrap:'wrap'}}><TypeBadge type={contract.type}/><span style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>{contract.system}</span></div>
                <div style={{fontSize:12,color:'var(--text)',fontFamily:'var(--font-mono)',marginBottom:7}}><span style={{color:'var(--muted)'}}>↑ </span>{contract.pickups.join(', ')}<span style={{color:'var(--muted)',margin:'0 8px'}}>→</span><span style={{color:'var(--muted)'}}>↓ </span>{contract.dropoffs.join(', ')}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{contract.cargo.map((c,i)=><span key={i} style={{fontSize:11,padding:'2px 9px',borderRadius:4,background:'var(--gold-dim)',border:'0.5px solid var(--border)',color:'var(--gold)',fontFamily:'var(--font-mono)'}}>{c.commodity} · {c.scu} SCU</span>)}</div>
              </div>
              <button onClick={()=>onDeleteContract(session.id,contract.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:16,padding:'0 4px',lineHeight:1}}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
