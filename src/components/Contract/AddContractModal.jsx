import { useState, useMemo } from 'react';
import LocationAutocomplete from '../Autocomplete/LocationAutocomplete.jsx';
import CommodityAutocomplete from '../Autocomplete/CommodityAutocomplete.jsx';
import { typeBg } from '../../data/contractTypes.js';

const lbl = {
  display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, color: 'var(--text)',
};

const emptyWp   = () => ({ name: '', body: '' });
const emptyItem = () => ({ commodity: '', scu: '' });
const emptySalvageMaterial = () => ({ commodity: 'RMC', scu: '' });

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

  if (allSystems.length > 1) {
    const from = pSystems[0] || allSystems[0];
    const to   = dSystems.find(s => s !== from) || allSystems.find(s => s !== from) || allSystems[1];
    return { system: `${from} → ${to}`, type: 'Hauling - Interstellar' };
  }

  const allLocs = [...fp, ...fd];
  const bodies  = allLocs.map(l => l.body).filter(Boolean);
  if (bodies.length === allLocs.length && new Set(bodies).size === 1) {
    return { system: allSystems[0], type: 'Hauling - Planetary' };
  }

  return { system: allSystems[0], type: 'Hauling - Stellar' };
}

function deriveSalvageSystem(location, systemsMap) {
  if (!location?.name) return null;
  for (const [sys, locs] of Object.entries(systemsMap || {})) {
    if (locs.some(l => l.name === location.name)) return sys;
  }
  return null;
}

const MISSION_CATEGORIES = [
  { key: 'hauling',  label: 'Hauling',       available: true },
  { key: 'salvage',  label: 'Salvage',        available: true },
  { key: 'bounty',   label: 'Bounty Hunting', available: false },
  { key: 'mining',   label: 'Mining',         available: false },
  { key: 'security', label: 'Security',       available: false },
];

export default function AddContractModal({ onSave, onClose, commodities, systemsMap }) {
  const [step,          setStep]          = useState(0);
  const [category,      setCategory]      = useState(null);

  // ── Hauling state ───────────────────────────────────────────────
  const [pickups,       setPickups]       = useState([emptyWp()]);
  const [dropoffs,      setDropoffs]      = useState([emptyWp()]);
  const [payout,        setPayout]        = useState('');
  const [cargoByPickup, setCargoByPickup] = useState([[emptyItem()]]);
  const [distribution,  setDistribution]  = useState({});

  // ── Salvage state ───────────────────────────────────────────────
  const [salvageLocation,  setSalvageLocation]  = useState(emptyWp());
  const [salvageClaimCost, setSalvageClaimCost] = useState('');
  const [salvageMaterials, setSalvageMaterials] = useState([emptySalvageMaterial()]);
  const [salvageSellLoc,   setSalvageSellLoc]   = useState(emptyWp());
  const [salvageSalePrice, setSalvageSalePrice] = useState('');
  const [salvageRefining,  setSalvageRefining]  = useState('');

  const { system, type } = useMemo(
    () => deriveRoute(pickups, dropoffs, systemsMap || {}),
    [pickups, dropoffs, systemsMap],
  );

  // ── Hauling derived ─────────────────────────────────────────────
  const filledPickups  = pickups.filter(p => p.name?.trim());
  const filledDropoffs = dropoffs.filter(d => d.name?.trim());
  const hasPickup      = filledPickups.length > 0;
  const hasDropoff     = filledDropoffs.length > 0;
  const multiDropoff   = filledDropoffs.length > 1;
  const totalSCU       = cargoByPickup.flat().reduce((t, c) => t + (Number(c.scu) || 0), 0);
  const hasAnyCargo    = cargoByPickup.flat().some(c => c.commodity && Number(c.scu) > 0);

  const haulingSteps = multiDropoff ? 4 : 3;

  // ── Salvage derived ─────────────────────────────────────────────
  const salvageSystem = deriveSalvageSystem(salvageLocation, systemsMap);
  const hasSalvageLoc = !!salvageLocation.name?.trim();
  const hasSalvageMaterials = salvageMaterials.some(m => Number(m.scu) > 0);
  const salvageSteps = 4; // category → location+cost → materials → sell run

  const totalSteps = category === 'salvage' ? salvageSteps : haulingSteps;

  const canAdvance =
    category === 'salvage'
      ? step === 1 ? hasSalvageLoc
        : step === 2 ? true  // materials optional at creation
        : step === 3 ? (Number(salvageSalePrice) > 0)
        : true
      : step === 1 ? hasPickup && hasDropoff
      : step === 2 ? hasAnyCargo
      : true;

  // ── Cargo helpers (hauling) ──────────────────────────────────────
  const updateCargoItem = (pi, ii, patch) =>
    setCargoByPickup(prev =>
      prev.map((g, gi) => gi !== pi ? g : g.map((item, ji) => ji !== ii ? item : { ...item, ...patch }))
    );

  const addCargoItem = (pi) =>
    setCargoByPickup(prev => prev.map((g, gi) => gi !== pi ? g : [...g, emptyItem()]));

  const removeCargoItem = (pi, ii) =>
    setCargoByPickup(prev => prev.map((g, gi) => gi !== pi ? g : g.filter((_, ji) => ji !== ii)));

  // ── Salvage material helpers ─────────────────────────────────────
  const updateSalvageMaterial = (i, patch) =>
    setSalvageMaterials(prev => prev.map((m, mi) => mi === i ? { ...m, ...patch } : m));

  const addSalvageMaterial = () =>
    setSalvageMaterials(prev => [...prev, emptySalvageMaterial()]);

  const removeSalvageMaterial = (i) =>
    setSalvageMaterials(prev => prev.filter((_, mi) => mi !== i));

  // ── Step advances ─────────────────────────────────────────────────
  const advanceToCargo = () => {
    const groups = filledPickups.length > 0 ? filledPickups.map(() => [emptyItem()]) : [[emptyItem()]];
    setCargoByPickup(groups);
    setStep(2);
  };

  const advanceToDistribution = () => {
    const dist = {};
    filledPickups.forEach((_, pi) => {
      dist[pi] = {};
      (cargoByPickup[pi] || []).forEach((item, ii) => {
        if (!item.commodity || !Number(item.scu)) return;
        dist[pi][ii] = Object.fromEntries(filledDropoffs.map((_, di) => [di, '']));
      });
    });
    setDistribution(dist);
    setStep(3);
  };

  const splitEvenly = (pi, ii) => {
    const total = Number(cargoByPickup[pi]?.[ii]?.scu || 0);
    const count = filledDropoffs.length;
    if (!count || !total) return;
    const base = Math.floor(total / count);
    const rem  = total - base * count;
    setDistribution(prev => ({
      ...prev,
      [pi]: {
        ...prev[pi],
        [ii]: Object.fromEntries(filledDropoffs.map((_, di) => [di, String(di === 0 ? base + rem : base)])),
      },
    }));
  };

  // ── Save ────────────────────────────────────────────────────────
  const save = () => {
    if (category === 'salvage') {
      const materialCargo = salvageMaterials
        .filter(m => Number(m.scu) > 0)
        .map(m => ({ commodity: m.commodity, scu: Number(m.scu), fromLocation: salvageLocation.name || null, toLocation: salvageSellLoc.name || null, source: 'material' }));

      const pickupWp  = salvageLocation.name ? [salvageLocation] : [];
      const dropoffWp = salvageSellLoc.name  ? [salvageSellLoc]  : [];

      onSave({
        type:         'Salvaging',
        system:       salvageSystem || salvageLocation.body || 'Unknown',
        pickups:      pickupWp,
        dropoffs:     dropoffWp,
        cargo:        materialCargo,
        payout:       Number(salvageSalePrice) || 0,
        claimCost:    Number(salvageClaimCost) || 0,
        refiningCost: Number(salvageRefining) || 0,
      });
      return;
    }

    // Hauling save
    let flatCargo;
    if (multiDropoff) {
      flatCargo = [];
      filledPickups.forEach((pickup, pi) => {
        (cargoByPickup[pi] || []).forEach((item, ii) => {
          if (!item.commodity || !Number(item.scu)) return;
          filledDropoffs.forEach((dropoff, di) => {
            const scu = Number(distribution[pi]?.[ii]?.[di] || 0);
            if (scu > 0) flatCargo.push({ commodity: item.commodity, scu, fromLocation: pickup.name, toLocation: dropoff.name });
          });
        });
      });
    } else {
      const singleDropoff = filledDropoffs[0]?.name || null;
      flatCargo = cargoByPickup.flatMap((group, pi) => {
        const pickup = filledPickups[pi];
        return group
          .filter(c => c.commodity && Number(c.scu) > 0)
          .map(c => ({ commodity: c.commodity, scu: c.scu, fromLocation: pickup?.name || null, toLocation: singleDropoff }));
      });
    }
    onSave({
      type:     type   || 'Hauling - Stellar',
      system:   system || 'Unknown',
      pickups:  filledPickups,
      dropoffs: filledDropoffs,
      cargo:    flatCargo,
      payout:   Number(payout) || 0,
    });
  };

  // ── Style helpers ────────────────────────────────────────────────
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

  const onBack = () => {
    if (step === 1) { setCategory(null); setStep(0); }
    else setStep(s => s - 1);
  };

  const handleNext = () => {
    if (!canAdvance) return;
    if (category === 'salvage') {
      if (step < salvageSteps - 1) setStep(s => s + 1);
      else save();
    } else {
      if (step === 1) advanceToCargo();
      else if (step === 2 && multiDropoff) advanceToDistribution();
      else save();
    }
  };

  const isFinalStep = category === 'salvage'
    ? step === salvageSteps - 1
    : step === haulingSteps - 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
      <div style={{ background: 'var(--bg-1)', border: '2px solid var(--border)', padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Add Contract</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>STEP {step + 1} / {totalSteps}</div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {Array.from({ length: totalSteps }, (_, i) => i).map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: step >= s ? '#c41e3a' : 'var(--bg-3)' }} />
          ))}
        </div>

        {/* ── STEP 0: Mission Category ── */}
        {step === 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' }}>
              Select Mission Type
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MISSION_CATEGORIES.map(cat => (
                <button key={cat.key} disabled={!cat.available}
                  onClick={() => { if (cat.available) { setCategory(cat.key); setStep(1); } }}
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
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat.label}</span>
                  {!cat.available && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Coming Soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SALVAGE STEP 1: Location + Claim Cost ── */}
        {category === 'salvage' && step === 1 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 18, textTransform: 'uppercase' }}>
              Salvage Site
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={lbl}>Wreck / Site Location</span>
              <LocationAutocomplete
                value={salvageLocation}
                onChange={setSalvageLocation}
                placeholder="Search location…"
                systemsMap={systemsMap}
              />
              {salvageSystem && (
                <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                  System: {salvageSystem}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={lbl}>Claim Cost (aUEC)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" min="0" step="1000"
                  style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' }}
                  placeholder="0 if free / open wreck"
                  value={salvageClaimCost}
                  onChange={e => setSalvageClaimCost(e.target.value)}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>aUEC</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SALVAGE STEP 2: Materials Collected ── */}
        {category === 'salvage' && step === 2 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
              Materials Collected
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Record RMC / CMATS harvested. Skip if adding live during the session.
            </div>

            {salvageMaterials.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <select
                  value={m.commodity}
                  onChange={e => updateSalvageMaterial(i, { commodity: e.target.value })}
                  style={{ padding: '8px 10px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none', minWidth: 90 }}
                >
                  <option value="RMC">RMC</option>
                  <option value="CMATS">CMATS</option>
                </select>
                <input
                  type="number" min="0"
                  style={{ width: 80, padding: '8px 8px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, textAlign: 'right', fontFamily: 'var(--font-mono)', outline: 'none' }}
                  placeholder="SCU"
                  value={m.scu}
                  onChange={e => updateSalvageMaterial(i, { scu: e.target.value })}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', width: 28, flexShrink: 0 }}>SCU</span>
                {salvageMaterials.length > 1 && (
                  <button style={{ background: 'none', border: 'none', color: '#c41e3a', cursor: 'pointer', fontSize: 18, fontWeight: 700, flexShrink: 0 }}
                    onClick={() => removeSalvageMaterial(i)}>×</button>
                )}
              </div>
            ))}

            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '2px 0', marginBottom: 16 }}
              onClick={addSalvageMaterial}>
              + Add material type
            </button>
          </div>
        )}

        {/* ── SALVAGE STEP 3: First Sell Run ── */}
        {category === 'salvage' && step === 3 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
              First Sell Run
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              More sell runs can be added live during the session.
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={lbl}>Sell / Refinery Location</span>
              <LocationAutocomplete
                value={salvageSellLoc}
                onChange={setSalvageSellLoc}
                placeholder="Search location…"
                systemsMap={systemsMap}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={lbl}>Sale Price (aUEC)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" min="0" step="1000"
                  style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' }}
                  placeholder="e.g. 250000"
                  value={salvageSalePrice}
                  onChange={e => setSalvageSalePrice(e.target.value)}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>aUEC</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={lbl}>Refining / Unloading Cost (aUEC)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" min="0" step="100"
                  style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' }}
                  placeholder="0 if none"
                  value={salvageRefining}
                  onChange={e => setSalvageRefining(e.target.value)}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>aUEC</span>
              </div>
            </div>

            {/* Summary */}
            {Number(salvageSalePrice) > 0 && (
              <div style={{ padding: '12px 14px', background: 'var(--bg-2)', border: '2px solid #000', marginTop: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Run Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Number(salvageClaimCost) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      <span style={{ color: 'var(--muted)' }}>Claim cost</span>
                      <span style={{ color: '#c41e3a' }}>−{Number(salvageClaimCost).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    <span style={{ color: 'var(--muted)' }}>Sale price</span>
                    <span style={{ color: '#2d8659' }}>+{Number(salvageSalePrice).toLocaleString()}</span>
                  </div>
                  {Number(salvageRefining) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      <span style={{ color: 'var(--muted)' }}>Refining cost</span>
                      <span style={{ color: '#c41e3a' }}>−{Number(salvageRefining).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid var(--bg-3)', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>
                    <span>Net</span>
                    <span style={{ color: (() => { const n = Number(salvageSalePrice) - Number(salvageClaimCost || 0) - Number(salvageRefining || 0); return n >= 0 ? '#2d8659' : '#c41e3a'; })() }}>
                      {(Number(salvageSalePrice) - Number(salvageClaimCost || 0) - Number(salvageRefining || 0)).toLocaleString()} aUEC
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HAULING STEP 1: Route ── */}
        {category === 'hauling' && step === 1 && (
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

        {/* ── HAULING STEP 2: Cargo + Payout ── */}
        {category === 'hauling' && step === 2 && (
          <div>
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

            <div style={{ marginBottom: 4 }}>
              <span style={lbl}>↑ What are you picking up?</span>
            </div>
            {(filledPickups.length > 0 ? filledPickups : [{ name: 'Pickup', body: '' }]).map((pickup, pi) => (
              <div key={pi} style={{ marginBottom: 12, border: '1px solid var(--bg-3)', background: 'var(--bg-2)' }}>
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
                <div style={{ padding: '10px 12px' }}>
                  {(cargoByPickup[pi] || [emptyItem()]).map((item, ii) => (
                    <div key={ii} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
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
                  ))}
                  <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, textDecoration: 'underline', padding: '2px 0' }}
                    onClick={() => addCargoItem(pi)}>
                    + Add item
                  </button>
                </div>
              </div>
            ))}

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

        {/* ── HAULING STEP 3: Distribution (multi-dropoff) ── */}
        {category === 'hauling' && step === 3 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em', marginBottom: 18, lineHeight: 1.6 }}>
              Assign how many SCU of each cargo type go to each dropoff. Use <strong>Split Evenly</strong> to divide automatically.
            </div>
            {filledPickups.map((pickup, pi) => {
              const items = (cargoByPickup[pi] || []).filter(c => c.commodity && Number(c.scu) > 0);
              if (!items.length) return null;
              return (
                <div key={pi} style={{ marginBottom: 20 }}>
                  {filledPickups.length > 1 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, padding: '6px 10px', background: 'var(--bg-2)', border: '1px solid var(--bg-3)' }}>
                      ↑ Picked up at: {pickup.name}
                    </div>
                  )}
                  {items.map((item, ii) => {
                    const totalItemSCU = Number(item.scu);
                    const assigned = filledDropoffs.reduce((sum, _, di) => sum + (Number(distribution[pi]?.[ii]?.[di]) || 0), 0);
                    const remaining = totalItemSCU - assigned;
                    return (
                      <div key={ii} style={{ marginBottom: 12, border: '1px solid var(--bg-3)', background: 'var(--bg-2)' }}>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.commodity}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{totalItemSCU.toLocaleString()} SCU total</span>
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          {filledDropoffs.map((dropoff, di) => (
                            <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', flexShrink: 0 }}>↓</span>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {dropoff.name}
                              </span>
                              <input
                                type="number" min="0" max={totalItemSCU}
                                style={{ width: 68, padding: '6px 8px', background: 'var(--bg-1)', border: '2px solid var(--border)', color: 'var(--text)', fontSize: 13, textAlign: 'right', fontFamily: 'var(--font-mono)', outline: 'none' }}
                                placeholder="SCU"
                                value={distribution[pi]?.[ii]?.[di] ?? ''}
                                onChange={e => setDistribution(prev => ({
                                  ...prev,
                                  [pi]: { ...prev[pi], [ii]: { ...prev[pi]?.[ii], [di]: e.target.value } },
                                }))}
                              />
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', width: 28, flexShrink: 0 }}>SCU</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <button
                              onClick={() => splitEvenly(pi, ii)}
                              style={{ padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2d8659'; e.currentTarget.style.color = '#2d8659'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
                            >⇌ Split Evenly</button>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: remaining === 0 ? '#2d8659' : remaining < 0 ? '#c41e3a' : 'var(--muted)' }}>
                              {remaining === 0 ? '✓ All assigned' : remaining > 0 ? `${remaining} unassigned` : `${Math.abs(remaining)} over`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 8 }}>
          <button style={secondaryBtn}
            onClick={step === 0 ? onClose : onBack}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step > 0 && (
            <button style={primaryBtn(!canAdvance)} onClick={handleNext}>
              {isFinalStep ? 'Save Contract' : 'Continue →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
