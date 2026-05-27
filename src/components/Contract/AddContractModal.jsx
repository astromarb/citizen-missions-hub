import { useState, useMemo } from 'react';
import LocationAutocomplete from '../Autocomplete/LocationAutocomplete.jsx';
import CommodityAutocomplete from '../Autocomplete/CommodityAutocomplete.jsx';

const lbl = {
  display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, color: 'var(--text)',
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
  const [cargo,    setCargo]    = useState([{ commodity: '', scu: '', fromLocation: '', toLocation: '' }]);
  const [payout,   setPayout]   = useState('');

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
    cargo:    cargo.filter(c => c.commodity && c.scu).map(c => ({ ...c, fromLocation: c.fromLocation || null, toLocation: c.toLocation || null })),
    payout:   Number(payout) || 0,
  });

  const setPickup  = (i, v) => { const a = [...pickups];  a[i] = v; setPickups(a); };
  const setDropoff = (i, v) => { const a = [...dropoffs]; a[i] = v; setDropoffs(a); };
  const setCargoCom  = (i, v) => { const a = [...cargo]; a[i] = { ...a[i], commodity: v };    setCargo(a); };
  const setCargoSCU  = (i, v) => { const a = [...cargo]; a[i] = { ...a[i], scu: v };         setCargo(a); };
  const setCargoFrom = (i, v) => { const a = [...cargo]; a[i] = { ...a[i], fromLocation: v }; setCargo(a); };
  const setCargoTo   = (i, v) => { const a = [...cargo]; a[i] = { ...a[i], toLocation: v };   setCargo(a); };

  const pickupNames  = pickups.filter(p => p.name).map(p => p.name);
  const dropoffNames = dropoffs.filter(d => d.name).map(d => d.name);
  const totalSCU = cargo.reduce((t, c) => t + (Number(c.scu) || 0), 0);

  const primaryBtn = (disabled) => ({
    padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    border: `2px solid ${disabled ? '#ccc' : '#c41e3a'}`,
    background: disabled ? 'var(--bg-3)' : '#c41e3a',
    color: disabled ? '#999' : '#fff',
    cursor: disabled ? 'default' : 'pointer',
  });
  const secondaryBtn = {
    padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', cursor: 'pointer',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>

      <div style={{ background: 'var(--bg-1)', border: '2px solid var(--border)', padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Add Contract</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>STEP {step}/2</div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: step >= s ? '#c41e3a' : 'var(--bg-3)' }} />
          ))}
        </div>

        {/* ── STEP 1: Route ── */}
        {step === 1 && (
          <div>
            {/* Auto-detected system badge */}
            {system && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', background: 'rgba(196,30,58,0.05)', border: '2px solid #c41e3a' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#c41e3a' }}>{type}</span>
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
                      <button style={{ background: 'none', border: 'none', color: '#c41e3a', cursor: 'pointer', fontSize: 20, fontWeight: 700 }}
                        onClick={() => setArr(arr.filter((_, j) => j !== i))}>×</button>
                    )}
                  </div>
                ))}
                <button style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '4px 0' }}
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
            {/* Payout */}
            <div style={{ marginBottom: 16 }}>
              <span style={lbl}>Mission Payout (aUEC)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" min="0" step="1000"
                  style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' }}
                  placeholder="e.g. 450000"
                  value={payout}
                  onChange={e => setPayout(e.target.value)}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>aUEC</span>
              </div>
            </div>

            {cargo.map((c, i) => (
              <div key={i} style={{ marginBottom: 10, padding: '10px 12px', border: '1px solid var(--bg-3)', background: 'var(--bg-2)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: (pickupNames.length > 0 || dropoffNames.length > 0) ? 6 : 0 }}>
                  <CommodityAutocomplete value={c.commodity} onChange={v => setCargoCom(i, v)} commodities={commodities} />
                  <input type="number" min="1"
                    style={{ width: 80, padding: '8px 10px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, textAlign: 'right', fontFamily: 'var(--font-mono)', outline: 'none' }}
                    placeholder="SCU" value={c.scu}
                    onChange={e => setCargoSCU(i, e.target.value)}
                  />
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>SCU</span>
                  {cargo.length > 1 && (
                    <button style={{ background: 'none', border: 'none', color: '#c41e3a', cursor: 'pointer', fontSize: 20, fontWeight: 700, marginLeft: 'auto' }}
                      onClick={() => setCargo(cargo.filter((_, j) => j !== i))}>×</button>
                  )}
                </div>
                {(pickupNames.length > 0 || dropoffNames.length > 0) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>FROM</span>
                    <select
                      value={c.fromLocation || ''}
                      onChange={e => setCargoFrom(i, e.target.value)}
                      style={{ flex: 1, padding: '4px 6px', border: '1.5px solid var(--border)', background: 'var(--bg-1)', color: c.fromLocation ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}
                    >
                      <option value="">— any pickup —</option>
                      {pickupNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>→</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>TO</span>
                    <select
                      value={c.toLocation || ''}
                      onChange={e => setCargoTo(i, e.target.value)}
                      style={{ flex: 1, padding: '4px 6px', border: '1.5px solid var(--border)', background: 'var(--bg-1)', color: c.toLocation ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}
                    >
                      <option value="">— any dropoff —</option>
                      {dropoffNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )}
              </div>
            ))}
            <button style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '4px 0' }}
              onClick={() => setCargo([...cargo, { commodity: '', scu: '', fromLocation: '', toLocation: '' }])}>
              + Add commodity
            </button>

            {/* Summary */}
            <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-2)', border: '2px solid #000' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Route Summary</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                <span style={{ color: '#c41e3a' }}>{type || 'Hauling'}</span>
                {system && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {system}</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                {pickups.filter(p => p.name).map(p => p.name).join(', ')}
                <span style={{ margin: '0 6px' }}>→</span>
                {dropoffs.filter(d => d.name).map(d => d.name).join(', ')}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#c41e3a', letterSpacing: '-0.02em' }}>
                {totalSCU.toLocaleString()} SCU
              </div>
              {payout && Number(payout) > 0 && (
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#2d8659', marginTop: 4 }}>
                  {Number(payout).toLocaleString()} aUEC
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 8 }}>
          <button style={secondaryBtn}
            onClick={step === 1 ? onClose : () => setStep(1)}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
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
