import { useState, useMemo } from 'react';
import LocationAutocomplete from '../Autocomplete/LocationAutocomplete.jsx';
import CommodityAutocomplete from '../Autocomplete/CommodityAutocomplete.jsx';

const lbl = {
  display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, color: '#000',
};

const emptyWp = () => ({ name: '', body: '' });

// Derive system string + contract type from selected locations
function deriveRoute(pickups, dropoffs, systemsMap) {
  const sysFor = (name) => {
    if (!name) return null;
    for (const [sys, locs] of Object.entries(systemsMap)) {
      if (locs.some(l => l.name === name)) return sys;
    }
    return null;
  };

  const pSystems = pickups.map(p => sysFor(p.name)).filter(Boolean);
  const dSystems = dropoffs.map(d => sysFor(d.name)).filter(Boolean);
  const allSystems = [...new Set([...pSystems, ...dSystems])];

  if (allSystems.length === 0) return { system: null, type: null };
  if (allSystems.length === 1) return { system: allSystems[0], type: 'Hauling - Stellar' };

  const from = pSystems[0] || allSystems[0];
  const to   = dSystems.find(s => s !== from) || allSystems.find(s => s !== from) || allSystems[1];
  return { system: `${from} → ${to}`, type: 'Hauling - Interstellar' };
}

export default function AddContractModal({ onSave, onClose, commodities, systemsMap }) {
  const [step, setStep]       = useState(1);
  const [pickups,  setPickups]  = useState([emptyWp()]);
  const [dropoffs, setDropoffs] = useState([emptyWp()]);
  const [cargo,    setCargo]    = useState([{ commodity: '', scu: '' }]);

  const { system, type } = useMemo(
    () => deriveRoute(pickups, dropoffs, systemsMap || {}),
    [pickups, dropoffs, systemsMap],
  );

  const hasPickup  = pickups.some(p => p.name?.trim());
  const hasDropoff = dropoffs.some(d => d.name?.trim());
  const canAdvance = step === 1
    ? hasPickup && hasDropoff
    : cargo.some(c => c.commodity && Number(c.scu) > 0);

  const save = () => onSave({
    type:     type     || 'Hauling - Stellar',
    system:   system   || 'Unknown',
    pickups:  pickups.filter(p => p.name),
    dropoffs: dropoffs.filter(d => d.name),
    cargo:    cargo.filter(c => c.commodity && c.scu),
  });

  const setPickup  = (i, v) => { const a = [...pickups];  a[i] = v; setPickups(a); };
  const setDropoff = (i, v) => { const a = [...dropoffs]; a[i] = v; setDropoffs(a); };
  const setCargoCom = (i, v) => { const a = [...cargo]; a[i] = { ...a[i], commodity: v }; setCargo(a); };
  const setCargoSCU = (i, v) => { const a = [...cargo]; a[i] = { ...a[i], scu: v };       setCargo(a); };
  const totalSCU = cargo.reduce((t, c) => t + (Number(c.scu) || 0), 0);

  const primaryBtn = (disabled) => ({
    padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    border: `2px solid ${disabled ? '#ccc' : '#e50000'}`,
    background: disabled ? 'var(--bg-3)' : '#e50000',
    color: disabled ? '#999' : '#fff',
    cursor: disabled ? 'default' : 'pointer',
  });
  const secondaryBtn = {
    padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    border: '2px solid #000', background: '#fff', color: '#000', cursor: 'pointer',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{ background: '#fff', border: '2px solid #000', padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Add Contract</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>STEP {step}/2</div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: step >= s ? '#e50000' : 'var(--bg-3)' }} />
          ))}
        </div>

        {/* ── STEP 1: Route ── */}
        {step === 1 && (
          <div>
            {/* Auto-detected system badge */}
            {system && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', background: 'rgba(229,0,0,0.05)', border: '2px solid #e50000' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#e50000' }}>{type}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>{system}</span>
              </div>
            )}
            {!system && (hasPickup || hasDropoff) && (
              <div style={{ marginBottom: 18, padding: '10px 14px', background: 'var(--bg-2)', border: '2px solid #ccc' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Type a location name to auto-detect system</span>
              </div>
            )}

            {[
              ['Pickup Locations', pickups, setPickup, setPickups, '↑'],
              ['Dropoff Locations', dropoffs, setDropoff, setDropoffs, '↓'],
            ].map(([label, arr, setter, setArr, arrow]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <span style={lbl}>{arrow} {label}</span>
                {arr.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <LocationAutocomplete
                        value={v}
                        onChange={x => setter(i, x)}
                        placeholder={`Search ${label.toLowerCase()}…`}
                        systemsMap={systemsMap}
                      />
                    </div>
                    {arr.length > 1 && (
                      <button style={{ background: 'none', border: 'none', color: '#e50000', cursor: 'pointer', fontSize: 20, fontWeight: 700 }}
                        onClick={() => setArr(arr.filter((_, j) => j !== i))}>×</button>
                    )}
                  </div>
                ))}
                <button style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '4px 0' }}
                  onClick={() => setArr([...arr, emptyWp()])}>
                  + Add {label.split(' ')[0].toLowerCase()}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 2: Cargo ── */}
        {step === 2 && (
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
                  <button style={{ background: 'none', border: 'none', color: '#e50000', cursor: 'pointer', fontSize: 20, fontWeight: 700 }}
                    onClick={() => setCargo(cargo.filter((_, j) => j !== i))}>×</button>
                )}
              </div>
            ))}
            <button style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '4px 0' }}
              onClick={() => setCargo([...cargo, { commodity: '', scu: '' }])}>
              + Add commodity
            </button>

            {/* Summary */}
            <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-2)', border: '2px solid #000' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Route Summary</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                <span style={{ color: '#e50000' }}>{type || 'Hauling'}</span>
                {system && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {system}</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                {pickups.filter(p => p.name).map(p => p.name).join(', ')}
                <span style={{ margin: '0 6px' }}>→</span>
                {dropoffs.filter(d => d.name).map(d => d.name).join(', ')}
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
            onClick={step === 1 ? onClose : () => setStep(1)}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button style={primaryBtn(!canAdvance)}
            onClick={() => canAdvance && (step < 2 ? setStep(2) : save())}
          >
            {step < 2 ? 'Continue →' : 'Save Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}
