import { useState } from 'react';
import { SYSTEMS } from '../../data/locations.js';
import LocationAutocomplete from '../Autocomplete/LocationAutocomplete.jsx';
import CommodityAutocomplete from '../Autocomplete/CommodityAutocomplete.jsx';
const CONTRACT_TYPES=[{key:'Hauling - Stellar',desc:'Single-system cargo run within Stanton, Pyro, or Nyx.'},{key:'Hauling - Interstellar',desc:'Multi-system route crossing a jump point between systems.'}];
export default function AddContractModal({ onSave, onClose }) {
  const [step,setStep]=useState(1),[type,setType]=useState(''),[pSys,setPSys]=useState('Stanton'),[dSys,setDSys]=useState('Pyro');
  const [pickups,setPickups]=useState(['']),[dropoffs,setDropoffs]=useState(['']),[cargo,setCargo]=useState([{commodity:'',scu:''}]);
  const isInter=type==='Hauling - Interstellar';
  const canAdvance=()=>{if(step===1)return!!type;if(step===2)return pickups.some(p=>p.trim())&&dropoffs.some(d=>d.trim());if(step===3)return cargo.some(c=>c.commodity&&Number(c.scu)>0);return false;};
  const save=()=>onSave({id:'c'+Date.now(),type,system:isInter?`${pSys} → ${dSys}`:pSys,pickups:pickups.filter(Boolean),dropoffs:dropoffs.filter(Boolean),cargo:cargo.filter(c=>c.commodity&&c.scu),done:false});
  const setPickup=(i,v)=>{const a=[...pickups];a[i]=v;setPickups(a);};
  const setDropoff=(i,v)=>{const a=[...dropoffs];a[i]=v;setDropoffs(a);};
  const setCargoCom=(i,v)=>{const a=[...cargo];a[i]={...a[i],commodity:v};setCargo(a);};
  const setCargoSCU=(i,v)=>{const a=[...cargo];a[i]={...a[i],scu:v};setCargo(a);};
  const totalSCU=cargo.reduce((t,c)=>t+(Number(c.scu)||0),0);
  const aBtn=(p,d)=>({padding:'8px 22px',borderRadius:6,fontSize:13,cursor:d?'default':'pointer',fontFamily:'var(--font-mono)',border:`1px solid ${p?'var(--gold)':'var(--border)'}`,background:p?'var(--gold-dim)':'transparent',color:p?'var(--gold)':'var(--muted)',opacity:d?0.4:1});
  const sysBtn=active=>({padding:'5px 12px',borderRadius:5,cursor:'pointer',fontSize:12,fontFamily:'var(--font-mono)',border:`1px solid ${active?'var(--gold)':'var(--border)'}`,background:active?'var(--gold-dim)':'transparent',color:active?'var(--gold)':'var(--muted)'});
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'var(--bg-0)',border:'1px solid var(--border)',borderRadius:12,padding:26,width:500,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--muted)',letterSpacing:'0.12em',textTransform:'uppercase'}}><span style={{color:'var(--gold)'}}>//</span> ADD CONTRACT</div>
          <div style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>Step {step}/3</div>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:22}}>{[1,2,3].map(s=><div key={s} style={{flex:1,height:2,borderRadius:2,background:step>=s?'var(--gold)':'var(--bg-2)'}}/>)}</div>

        {step===1&&CONTRACT_TYPES.map(({key,desc})=>(
          <div key={key} onClick={()=>setType(key)} style={{marginBottom:10,padding:'14px 16px',borderRadius:8,cursor:'pointer',border:`1px solid ${type===key?'var(--gold)':'var(--border)'}`,background:type===key?'var(--gold-dim)':'var(--bg-1)'}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:14,color:type===key?'var(--gold)':'var(--text)',marginBottom:4}}>{key}</div>
            <div style={{fontSize:11,color:'var(--muted)'}}>{desc}</div>
          </div>
        ))}

        {step===2&&<div>
          {isInter&&<div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:18,padding:'12px 14px',background:'var(--bg-1)',borderRadius:8,border:'1px solid var(--border)'}}>
            {[['Origin',pSys,setPSys],['Destination',dSys,setDSys]].map(([lbl,val,setter])=>(
              <div key={lbl}><div style={{fontSize:10,color:'var(--muted)',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:6}}>{lbl} System</div>
              <div style={{display:'flex',gap:6}}>{Object.keys(SYSTEMS).map(s=><button key={s} style={sysBtn(val===s)} onClick={()=>setter(s)}>{s}</button>)}</div></div>
            ))}
          </div>}
          {[['Pickup',pickups,setPickup,setPickups,isInter?null:pSys],['Dropoff',dropoffs,setDropoff,setDropoffs,isInter?null:pSys]].map(([lbl,arr,setter,setArr,sys])=>(
            <div key={lbl} style={{marginBottom:16}}>
              <div style={{fontSize:10,color:'var(--muted)',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:6}}>{lbl} Locations</div>
              {arr.map((v,i)=>(
                <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                  <div style={{flex:1}}><LocationAutocomplete value={v} onChange={x=>setter(i,x)} filterSystem={sys} placeholder={`${lbl} location…`}/></div>
                  {arr.length>1&&<button style={{background:'none',border:'none',color:'#da3633',cursor:'pointer',fontSize:18}} onClick={()=>setArr(arr.filter((_,j)=>j!==i))}>×</button>}
                </div>
              ))}
              <button style={{background:'none',border:'none',color:'#58a6ff',cursor:'pointer',fontSize:12,padding:'4px 0'}} onClick={()=>setArr([...arr,''])}>+ Add {lbl.toLowerCase()}</button>
            </div>
          ))}
        </div>}

        {step===3&&<div>
          {cargo.map((c,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
              <CommodityAutocomplete value={c.commodity} onChange={v=>setCargoCom(i,v)}/>
              <input type="number" min="1" style={{width:80,padding:'7px 10px',background:'var(--bg-0)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:6,fontSize:13,textAlign:'right'}} placeholder="SCU" value={c.scu} onChange={e=>setCargoSCU(i,e.target.value)}/>
              <span style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>SCU</span>
              {cargo.length>1&&<button style={{background:'none',border:'none',color:'#da3633',cursor:'pointer',fontSize:18}} onClick={()=>setCargo(cargo.filter((_,j)=>j!==i))}>×</button>}
            </div>
          ))}
          <button style={{background:'none',border:'none',color:'#58a6ff',cursor:'pointer',fontSize:12,padding:'4px 0'}} onClick={()=>setCargo([...cargo,{commodity:'',scu:''}])}>+ Add commodity</button>
          <div style={{marginTop:18,padding:'12px 14px',background:'var(--bg-1)',borderRadius:8,border:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--font-mono)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>Route Summary</div>
            <div style={{fontSize:12,fontFamily:'var(--font-mono)',color:'var(--text)',marginBottom:4}}><span style={{color:'var(--gold)'}}>{type}</span><span style={{color:'var(--muted)'}}> · {isInter?`${pSys} → ${dSys}`:pSys}</span></div>
            <div style={{fontSize:12,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>{pickups.filter(Boolean).join(', ')} → {dropoffs.filter(Boolean).join(', ')}</div>
            <div style={{marginTop:8,fontSize:14,color:'var(--gold)',fontFamily:'var(--font-mono)',fontWeight:'bold'}}>{totalSCU.toLocaleString()} SCU total</div>
          </div>
        </div>}

        <div style={{display:'flex',justifyContent:'space-between',marginTop:22}}>
          <button style={aBtn(false,false)} onClick={step===1?onClose:()=>setStep(step-1)}>{step===1?'Cancel':'← Back'}</button>
          <button style={aBtn(true,!canAdvance())} onClick={()=>canAdvance()&&(step<3?setStep(step+1):save())}>{step<3?'Continue →':'Save Contract'}</button>
        </div>
      </div>
    </div>
  );
}
