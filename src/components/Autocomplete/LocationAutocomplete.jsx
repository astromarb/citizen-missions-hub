import { useState, useRef, useEffect } from 'react';
import { SYSTEMS } from '../../data/locations.js';
const inp = { width:'100%', boxSizing:'border-box', padding:'7px 10px', background:'var(--bg-0)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:6, fontSize:13, fontFamily:'var(--font-mono)', outline:'none' };
export default function LocationAutocomplete({ value, onChange, filterSystem, placeholder }) {
  const [q,setQ]=useState(value||''); const [open,setOpen]=useState(false); const ref=useRef();
  useEffect(()=>{setQ(value||'');},[value]);
  const pool=filterSystem?(SYSTEMS[filterSystem]||[]).map(l=>({l,s:filterSystem})):Object.entries(SYSTEMS).flatMap(([s,arr])=>arr.map(l=>({l,s})));
  const hits=pool.filter(({l})=>l.toLowerCase().includes(q.toLowerCase())).slice(0,9);
  useEffect(()=>{const fn=e=>{if(!ref.current?.contains(e.target))setOpen(false);}; document.addEventListener('mousedown',fn); return()=>document.removeEventListener('mousedown',fn);},[]);
  return (
    <div style={{position:'relative'}} ref={ref}>
      <input style={inp} value={q} onChange={e=>{setQ(e.target.value);onChange('');setOpen(true);}} onFocus={()=>setOpen(true)} placeholder={placeholder||'Search location…'} />
      {open&&hits.length>0&&(
        <div style={{position:'absolute',top:'calc(100% + 3px)',left:0,right:0,zIndex:300,background:'var(--bg-1)',border:'1px solid var(--border)',borderRadius:6,maxHeight:220,overflowY:'auto'}}>
          {hits.map(({l,s})=>(
            <div key={l+s} onMouseDown={()=>{onChange(l);setQ(l);setOpen(false);}} style={{padding:'7px 12px',cursor:'pointer',fontSize:12,fontFamily:'var(--font-mono)',display:'flex',justifyContent:'space-between',borderBottom:'1px solid var(--bg-2)',color:'var(--text)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span>{l}</span><span style={{fontSize:10,color:'var(--muted)'}}>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
