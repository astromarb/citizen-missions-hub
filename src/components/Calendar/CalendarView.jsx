import { PLAYER_COLORS } from '../../data/players.js';
import { fmtKey, daysInMonth, firstWeekday } from '../../utils/dateUtils.js';
const TODAY_KEY = fmtKey(new Date());
export default function CalendarView({ sessions, viewDate, onSelectDate, onNewSession }) {
  const year=viewDate.getFullYear(), month=viewDate.getMonth();
  const cells=[];
  for(let i=0;i<firstWeekday(year,month);i++) cells.push(null);
  for(let d=1;d<=daysInMonth(year,month);d++) cells.push(d);
  return (
    <div style={{padding:'10px 16px 24px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:4}}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} style={{textAlign:'center',fontSize:10,color:'var(--muted)',fontFamily:'var(--font-mono)',letterSpacing:'0.07em',paddingBottom:6}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={'e'+i}/>;
          const key=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const session=sessions[key], isToday=key===TODAY_KEY;
          const allDone=session?.contracts.length>0&&session.contracts.every(c=>c.done);
          return (
            <div key={key} onClick={()=>session?onSelectDate(key):onNewSession(key)}
              style={{minHeight:58,padding:'7px 8px',borderRadius:7,cursor:'pointer',border:`1px solid ${isToday?'var(--gold)':session?'var(--bg-2)':'transparent'}`,background:session?'var(--bg-1)':isToday?'rgba(227,179,65,0.04)':'transparent'}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-1)';}} onMouseLeave={e=>{e.currentTarget.style.background=session?'var(--bg-1)':isToday?'rgba(227,179,65,0.04)':'transparent';}}>
              <div style={{fontSize:13,fontFamily:'var(--font-mono)',color:isToday?'var(--gold)':'var(--text)',fontWeight:isToday?'bold':'normal'}}>{day}</div>
              {session&&<div style={{marginTop:4}}><div style={{fontSize:10,color:allDone?'#3B6D11':'var(--muted)',marginBottom:3}}>{session.contracts.length}c {allDone?'✓':''}</div><div style={{display:'flex',gap:2}}>{session.players.slice(0,5).map(p=><span key={p} style={{width:5,height:5,borderRadius:'50%',background:PLAYER_COLORS[p]||'var(--muted)',display:'inline-block'}}/>)}</div></div>}
              {!session&&<div style={{fontSize:9,color:'var(--bg-2)',marginTop:3,fontFamily:'var(--font-mono)'}}>+</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
