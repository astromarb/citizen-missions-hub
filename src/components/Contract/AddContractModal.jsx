import { useState, useMemo } from 'react';
import LocationAutocomplete from '../Autocomplete/LocationAutocomplete.jsx';
import CommodityAutocomplete from '../Autocomplete/CommodityAutocomplete.jsx';
import { typeBg } from '../../data/contractTypes.js';

const lbl = {
  display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, color: 'var(--text)',
};

const emptyWp    = () => ({ name: '', body: '' });
const emptyItem  = () => ({ commodity: '', scu: '', toLocation: '' });

function deriveRoute(pickups, dropoffs, systemsMap) {
  const sysFor = (name) => {
    if (!name) return null;
    for (const [sys, locs] of Object.entries(systemsMap)) {
      if (locs.some(l => l.name === name)) return sys;
    }
    return null;
  };

  const fp = pickups.filter(p => p.name?.trim());
  const fd = dropoffs.filter(d => d.name?.trim());
  const pSystems = fp.map(p => sysFor(p.name)).filter(Boolean);
  const dSystems = fd.map(d => sysFor(d.name)).filter(Boolean);
  const allSystems = [...new Set([...pSystems, ...dSystems])];

  if (allSystems.length === 0) return { system: null, type: null };

  // Interstellar always wins — even a single pickup+dropoff across systems
  if (allSystems.length > 1) {
    const from = pSystems[0] || allSystems[0];
    const to   = dSystems.find(s => s !== from) || allSystems.find(s => s !== from) || allSystems[1];
    return { system: `${from} → ${to}`, type: 'Hauling - Interstellar' };
  }

  // Same system — check if all locations share one body (Planetary)
  const allLocs = [...fp, ...fd];
  const bodies  = allLocs.map(l => l.body).filter(Boolean);
  if (bodies.length === allLocs.length && new Set(bodies).size === 1) {
    return { system: allSystems[0], type: 'Hauling - Planetary' };
  }

  // Direct: exactly 1 pickup + 1 dropoff, same system
  if (fp.length === 1 && fd.length === 1) {
    return { system: allSystems[0], type: 'Hauling - Direct' };
  }

  // Same system, different bodies or multiple stops → Solar
  return { system: allSystems[0], type: 'Hauling - Solar' };
}

const MISSION_CATEGORIES = [
  { key: 'hauling',  label: 'Hauling',         available: true },
  { key: 'bounty',   label: 'Bounty Hunting',   available: false },
  { key: 'mining',   label: 'Mining',            available: false },
  { key: 'salvage',  label: 'Salvage',           available: false },
  { key: 'security', label: 'Security',          available: false },
];

export default function AddContractModal({ onSave, onClose, commodities, systemsMap }) {
  const [step,     setStep]     = useState(0);
  const [pickups,  setPickups]  = useState([emptyWp()]);
  const [dropoffs, setDropoffs] = useState([emptyWp()]);
  const [payout,   setPayout]   = useState('');

  // cargoByPickup[i] = array of { commodity, scu } items for pickups[i]
  const [cargoByPickup, setCargoByPickup] = useState([[emptyItem()]]);

  const { system, type } = useMemo(
    () => deriveRoute(pickups, dropoffs, systemsMap || {}),
    [pickups, dropoffs, systemsMap],
  );

  const filledPickups  = pickups.filter(p => p.name?.trim());
  const filledDropoffs = dropoffs.filter(d => d.name?.trim());
  const hasPickup  = filledPickups.length > 0;
  const hasDropoff = filledDropoffs.length > 0;
  const totalSCU   = cargoByPickup.flat().reduce((t, c) => t + (Number(c.scu) || 0), 0);
  const hasAnyCargo = cargoByPickup.flat().some(c => c.commodity && Number(c.scu) > 0);

  const canAdvance = step === 1 ? hasPickup && hasDropoff : hasAnyCargo;
  const totalSteps = 3;

  // ── Cargo helpers ───────────────────────────────────────────
  const updateCargoItem = (pi, ii, patch) =>
    setCargoByPickup(prev =>
      prev.map((g, gi) => gi !== pi ? g : g.map((item, ji) => ji !== ii ? item : { ...item, ...patch }))
    );

  const addCargoItem = (pi) =>
    setCargoByPickup(prev =>
      prev.map((g, gi) => gi !== pi ? g : [...g, emptyItem()])
    );

  const removeCargoItem = (pi, ii) =>
    setCargoByPickup(prev =>
      prev.map((g, gi) => gi !== pi ? g : g.filter((_, ji) => ji !== ii))
    );

  // ── Advance step 1 → 2 ─────────────────────────────────────
  const advanceToCargo = () => {
    const groups = filledPickups.length > 0
      ? filledPickups.map(() => [emptyItem()])
      : [[emptyItem()]];
    setCargoByPickup(groups);
    setStep(2);
  };

  // ── Save ────────────────────────────────────────────────────
  const save = () => {
    const singleDropoff = filledDropoffs.length === 1 ? filledDropoffs[0].name : null;
    const flatCargo = cargoByPickup.flatMap((group, pi) => {
      const pickup = filledPickups[pi];
      return group
        .filter(c => c.commodity && Number(c.scu) > 0)
        .map(c => ({
          commodity:    c.commodity,
          scu:          c.scu,
          fromLocation: pickup?.name                  || null,
          toLocation:   c.toLocation || singleDropoff || null,
        }));
    });

    onSave({
      type:     type     || 'Hauling - Stellar',
      system:   system   || 'Unknown',
      pickups:  filledPickups,
      dropoffs: filledDropoffs,
      cargo:    flatCargo,
      payout:   Number(payout) || 0,
    });
  };

  // ── Style helpers ────────────────────────────────────────────
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
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>STEP {step + 1}/{totalSteps}</div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[0, 1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: step >= s ? '#c41e3a' : 'var(--bg-3)' }} />
          ))}
        </div>

        {/* ── STEP 0: Mission Category ─────────────────────────── */}
        {step === 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
              Select Mission Type
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MISSION_CATEGORIES.map(cat => (
                <button key={cat.key} disabled={!cat.available} onClick={() => cat.available && setStep(1)}
                  style={{
                    width: '100%', padding: '16px 20px', textAlign: 'left',
                    border: `2px solid ${cat.available ? '#c41e3a' : 'var(--bg-3)'}`,
                    background: cat.available ? 'rgba(196,30,58,0.04)' : 'var(--bg-2)',
                    cursor: cat.available ? 'pointer' : 'default',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (cat.available) { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.color = '#fff'; } }}
                  onMouseLeave={e => { if (cat.available) { e.currentTarget.style.background = 'rgba(196,30,58,0.04)'; e.currentTarget.style.color = 'var(--text)'; } }}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {cat.label}
                  </span>
                  {!cat.available && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Coming Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Route ────────────────────────────────────── */}
        {step === 1 && (
          <div>
            {system ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', background: typeBg(type), border: `2px solid ${typeBg(type)}` }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#fff' }}>{type}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.06em' }}>{system}</span>
              </div>
            ) : (hasPickup || hasDropoff) ? (
              <div style={{ marginBottom: 18, padding: '10px 14px', background: 'var(--bg-2)', border: '2px solid #ccc' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Type a location name to auto-detect system</span>
              </div>
            ) : null}

            {[
              ['Pickup Locations', pickups, (i, v) => { const a = [...pickups]; a[i] = v; setPickups(a); }, setPickups, '↑'],
              ['Dropoff Locations', dropoffs, (i, v) => { const a = [...dropoffs]; a[i] = v; setDropoffs(a); }, setDropoffs, '↓'],
            ].map(([label, arr, setter, setArr, arrow]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <span style={lbl}>{arrow} {label}</span>
                {arr.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <LocationAutocomplete
                        value={v}
                        onChange={x => setter(i, x)}
                        placeholder={`Search ${label.split(' ')[0].toLowerCase()} location…`}
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

        {/* ── STEP 2: Cargo ────────────────────────────────────── */}
        {step === 2 && (
          <div>
            {/* Payout */}
            <div style={{ marginBottom: 20 }}>
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

            {/* Per-pickup cargo sections */}
            <div style={{ marginBottom: 4 }}>
              <span style={lbl}>↑ What are you picking up?</span>
            </div>
            {(filledPickups.length > 0 ? filledPickups : [{ name: 'Pickup', body: '' }]).map((pickup, pi) => (
              <div key={pi} style={{ marginBottom: 12, border: '1px solid var(--bg-3)', background: 'var(--bg-2)' }}>
                {/* Location header */}
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg-3)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)' }}>
                    {pickup.name}
                  </span>
                  {pickup.body && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {pickup.body}
                    </span>
                  )}
                </div>
                {/* Cargo rows */}
                <div style={{ padding: '10px 12px' }}>
                  {(cargoByPickup[pi] || [emptyItem()]).map((item, ii) => (
                    <div key={ii} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: filledDropoffs.length > 1 ? 4 : 0 }}>
                        <div style={{ flex: 1 }}>
                          <CommodityAutocomplete
                            value={item.commodity}
                            onChange={v => updateCargoItem(pi, ii, { commodity: v })}
                            commodities={commodities}
                          />
                        </div>
                        <input type="number" min="1"
                          style={{ width: 68, padding: '8px 8px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, textAlign: 'right', fontFamily: 'var(--font-mono)', outline: 'none' }}
                          placeholder="SCU"
                          value={item.scu}
                          onChange={e => updateCargoItem(pi, ii, { scu: e.target.value })}
                        />
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', width: 28, flexShrink: 0 }}>SCU</span>
                        {(cargoByPickup[pi]?.length || 1) > 1 && (
                          <button style={{ background: 'none', border: 'none', color: '#c41e3a', cursor: 'pointer', fontSize: 18, fontWeight: 700, flexShrink: 0 }}
                            onClick={() => removeCargoItem(pi, ii)}>×</button>
                        )}
                      </div>
                      {filledDropoffs.length > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingLeft: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>↓ Drop at:</span>
                          {filledDropoffs.map((d, di) => (
                            <button key={di}
                              onClick={() => updateCargoItem(pi, ii, { toLocation: item.toLocation === d.name ? '' : d.name })}
                              style={{
                                padding: '3px 8px', cursor: 'pointer',
                                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.04em',
                                border: `2px solid ${item.toLocation === d.name ? '#2d8659' : 'var(--border)'}`,
                                background: item.toLocation === d.name ? 'rgba(45,134,89,0.12)' : 'transparent',
                                color: item.toLocation === d.name ? '#2d8659' : 'var(--muted)',
                                whiteSpace: 'nowrap',
                              }}
                            >{d.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '2px 0' }}
                    onClick={() => addCargoItem(pi)}>
                    + Add item
                  </button>
                </div>
              </div>
            ))}

            {/* Route summary */}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-2)', border: '2px solid #000' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Route Summary</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: typeBg(type) }}>{type || 'Hauling'}</span>
                {system && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {system}</span>}
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
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step > 0 && (
            <button style={primaryBtn(!canAdvance)}
              onClick={() => {
                if (!canAdvance) return;
                if (step === 1) advanceToCargo();
                else save();
              }}
            >
              {step < 2 ? 'Continue →' : 'Save Contract'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
