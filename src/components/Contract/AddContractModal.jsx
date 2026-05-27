import { useState } from 'react';
import { SYSTEMS } from '../../data/locations.js';
import LocationAutocomplete from '../Autocomplete/LocationAutocomplete.jsx';
import CommodityAutocomplete from '../Autocomplete/CommodityAutocomplete.jsx';

const CONTRACT_TYPES = [
  { key: 'Hauling - Stellar',      desc: 'Single-system cargo run within Stanton, Pyro, or Nyx.' },
  { key: 'Hauling - Interstellar', desc: 'Multi-system route crossing a jump point between systems.' },
];

const lbl = {
  display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, color: '#000',
};

const emptyWp = () => ({ name: '', body: '' });

export default function AddContractModal({ onSave, onClose, commodities, systemsMap }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  const [pSys, setPSys] = useState('Stanton');
  const [dSys, setDSys] = useState('Pyro');
  const [pickups,  setPickups]  = useState([emptyWp()]);
  const [dropoffs, setDropoffs] = useState([emptyWp()]);
  const [cargo,    setCargo]    = useState([{ commodity: '', scu: '' }]);

  const isInter = type === 'Hauling - Interstellar';
  const canAdvance = () => {
    if (step === 1) return !!type;
    if (step === 2) return pickups.some(p => p.name?.trim()) && dropoffs.some(d => d.name?.trim());
    if (step === 3) return cargo.some(c => c.commodity && Number(c.scu) > 0);
    return false;
  };

  const save = () => onSave({
    type,
    system: isInter ? `${pSys} → ${dSys}` : pSys,
    pickups:  pickups.filter(p => p.name),
    dropoffs: dropoffs.filter(d => d.name),
    cargo:    cargo.filter(c => c.commodity && c.scu),
  });

  const setPickup   = (i, v) => { const a = [...pickups];  a[i] = v; setPickups(a); };
  const setDropoff  = (i, v) => { const a = [...dropoffs]; a[i] = v; setDropoffs(a); };
  const setCargoCom = (i, v) => { const a = [...cargo]; a[i] = { ...a[i], commodity: v }; setCargo(a); };
  const setCargoSCU = (i, v) => { const a = [...cargo]; a[i] = { ...a[i], scu: v };       setCargo(a); };
  const totalSCU = cargo.reduce((t, c) => t + (Number(c.scu) || 0), 0);

  const primaryBtn = (disabled) => ({
    padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    border: '2px solid #e50000', background: disabled ? 'var(--bg-3)' : '#e50000',
    borderColor: disabled ? '#ccc' : '#e50000',
    color: disabled ? '#999' : '#fff',
    cursor: disabled ? 'default' : 'pointer',
  });
  const secondaryBtn = {
    padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    border: '2px solid #000', background: '#fff', color: '#000', cursor: 'pointer',
  };
  const sysBtn = (active) => ({
    padding: '5px 12px', cursor: 'pointer', fontSize: 11,
    fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase',
    border: `2px solid ${active ? '#000' : '#ccc'}`,
    background: active ? '#000' : '#fff',
    color: active ? '#fff' : '#666',
  });

  // Available systems (from external map or static fallback)
  const sysList = systemsMap && Object.keys(systemsMap).length ? Object.keys(systemsMap) : Object.keys(SYSTEMS);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{ background: '#fff', border: '2px solid #000', padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Add Contract</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>STEP {step}/3</div>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: step >= s ? '#e50000' : 'var(--bg-3)' }} />
          ))}
        </div>

        {/* ── STEP 1: Type ── */}
        {step === 1 && CONTRACT_TYPES.map(({ key, desc }) => (
          <div key={key} onClick={() => setType(key)}
            style={{
              marginBottom: 10, padding: '16px', cursor: 'pointer',
              border: `2px solid ${type === key ? '#e50000' : '#000'}`,
              background: type === key ? 'rgba(229,0,0,0.05)' : '#fff',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: type === key ? '#e50000' : '#000', marginBottom: 4 }}>{key}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{desc}</div>
          </div>
        ))}

        {/* ── STEP 2: Route ── */}
        {step === 2 && (
          <div>
            {isInter && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20, padding: '12px', background: 'var(--bg-2)', border: '2px solid #000' }}>
                {[['Origin', pSys, setPSys], ['Destination', dSys, setDSys]].map(([label, val, setter]) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, color: 'var(--muted)' }}>{label} System</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {sysList.map(s => <button key={s} style={sysBtn(val === s)} onClick={() => setter(s)}>{s}</button>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {[['Pickup', pickups, setPickup, setPickups, isInter ? null : pSys], ['Dropoff', dropoffs, setDropoff, setDropoffs, isInter ? null : pSys]].map(([label, arr, setter, setArr, sys]) => (
              <div key={label} style={{ marginBottom: 18 }}>
                <span style={lbl}>{label} Locations</span>
                {arr.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <LocationAutocomplete
                        value={v}
                        onChange={x => setter(i, x)}
                        filterSystem={sys}
                        placeholder={`${label} location…`}
                        systemsMap={systemsMap}
                      />
                    </div>
                    {arr.length > 1 && (
                      <button style={{ background: 'none', border: 'none', color: '#e50000', cursor: 'pointer', fontSize: 20, fontWeight: 700 }} onClick={() => setArr(arr.filter((_, j) => j !== i))}>×</button>
                    )}
                  </div>
                ))}
                <button style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '4px 0' }}
                  onClick={() => setArr([...arr, emptyWp()])}>
                  + Add {label.toLowerCase()}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 3: Cargo ── */}
        {step === 3 && (
          <div>
            {cargo.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <CommodityAutocomplete value={c.commodity} onChange={v => setCargoCom(i, v)} commodities={commodities} />
                <input type="number" min="1"
                  style={{ width: 80, padding: '8px 10px', background: '#fff', border: '2px solid #000', color: '#000', fontSize: 13, textAlign: 'right', fontFamily: 'var(--font-mono)', outline: 'none' }}
                  placeholder="SCU" value={c.scu}
                  onChange={e => setCargoSCU(i, e.target.value)}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>SCU</span>
                {cargo.length > 1 && (
                  <button style={{ background: 'none', border: 'none', color: '#e50000', cursor: 'pointer', fontSize: 20, fontWeight: 700 }} onClick={() => setCargo(cargo.filter((_, j) => j !== i))}>×</button>
                )}
              </div>
            ))}
            <button style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '4px 0' }}
              onClick={() => setCargo([...cargo, { commodity: '', scu: '' }])}>
              + Add commodity
            </button>

            {/* Route summary */}
            <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-2)', border: '2px solid #000' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Route Summary</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                <span style={{ color: '#e50000' }}>{type}</span>
                <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {isInter ? `${pSys} → ${dSys}` : pSys}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                {pickups.filter(p => p.name).map(p => p.name).join(', ')} → {dropoffs.filter(d => d.name).map(d => d.name).join(', ')}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#e50000', letterSpacing: '-0.02em' }}>
                {totalSCU.toLocaleString()} SCU
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 8 }}>
          <button style={secondaryBtn}
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button style={primaryBtn(!canAdvance())}
            onClick={() => canAdvance() && (step < 3 ? setStep(step + 1) : save())}
          >
            {step < 3 ? 'Continue →' : 'Save Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}
