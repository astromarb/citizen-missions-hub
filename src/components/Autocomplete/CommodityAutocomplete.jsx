import { useState, useRef, useEffect } from 'react';
import { COMMODITIES } from '../../data/commodities.js';
const inp = { width:'100%', boxSizing:'border-box', padding:'7px 10px', background:'var(--bg-0)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:6, fontSize:13, outline:'none' };
export default function CommodityAutocomplete({ value, onChange }) {
  const [q,setQ]=useState(value||''); const [open,setOpen]=useState(false); const ref=useRef();
  useEffect(()=>{setQ(value||'');},[value]);
  const hits=COMMODITIES.filter(c=>c.toLowerCase().includes(q.toLowerCase())).slice(0,8);
  useEffect(()=>{const fn=e=>{if(!ref.current?.contains(e.target))setOpen(false);}; document.addEventListener('mousedown',fn); return()=>document.removeEventListener('mousedown',fn);},[]);
  return (
    <div style={{position:'relative',flex:1}} ref={ref}>
      <input style={inp} value={q} onChange={e=>{setQ(e.target.value);onChange('');setOpen(true);}} onFocus={()=>setOpen(true)} placeholder="Search commodity…" />
      {open&&hits.length>0&&(
        <div style={{position:'absolute',top:'calc(100% + 3px)',left:0,right:0,zIndex:300,background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:6,maxHeight:200,overflowY:'auto'}}>
          {hits.map(c=>(
            <div key={c} onMouseDown={()=>{onChange(c);setQ(c);setOpen(false);}} style={{padding:'7px 12px',cursor:'pointer',fontSize:12,color:'var(--text)',borderBottom:'1px solid var(--bg-2)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{c}</div>
          ))}
        </div>
      )}
    </div>
  );
}
