import { useState } from 'react';

const SWATCH_COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
  '#E24B4A', '#e50000', '#FFB347', '#4ECDC4',
  '#C44D58', '#556270', '#2ECC71', '#F39C12',
];

const REGIONS = [
  { key: 'New Babbage', label: 'New Babbage', sub: 'MicroTech' },
  { key: 'Area 18',     label: 'Area 18',     sub: 'ArcCorp' },
  { key: 'Orison',      label: 'Orison',      sub: 'Crusader' },
  { key: 'Lorville',    label: 'Lorville',    sub: 'Hurston' },
];

const callsignRegex = /^[a-zA-Z0-9_-]{2,20}$/;

function SavedBadge({ visible }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, color: '#2D7A1F',
      opacity: visible ? 1 : 0, transition: 'opacity 0.4s', marginLeft: 8,
    }}>Saved ✓</span>
  );
}

export default function SettingsView({ profile, updateProfile, checkCallsign }) {
  const [color, setColor] = useState(profile?.color || '#378ADD');
  const [hexInput, setHexInput] = useState(profile?.color || '#378ADD');
  const [colorSaved, setColorSaved] = useState(false);

  const [region, setRegion] = useState(profile?.home_region || '');
  const [regionSaved, setRegionSaved] = useState(false);

  const [callsign, setCallsign] = useState(profile?.callsign || '');
  const [callsignStatus, setCallsignStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [callsignSaved, setCallsignSaved] = useState(false);

  const [saving, setSaving] = useState(false);

  const flash = (setter) => { setter(true); setTimeout(() => setter(false), 2000); };

  const handleHexInput = (v) => {
    setHexInput(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v);
  };

  const saveColor = async () => {
    setSaving(true);
    await updateProfile({ color });
    setSaving(false);
    flash(setColorSaved);
  };

  const saveRegion = async () => {
    if (!region) return;
    setSaving(true);
    await updateProfile({ home_region: region });
    setSaving(false);
    flash(setRegionSaved);
  };

  const handleCallsignBlur = async () => {
    if (!callsignRegex.test(callsign)) { setCallsignStatus('invalid'); return; }
    setChecking(true);
    const { available } = await checkCallsign(callsign);
    setCallsignStatus(available ? 'available' : 'taken');
    setChecking(false);
  };

  const saveCallsign = async () => {
    if (!callsignRegex.test(callsign) || callsignStatus !== 'available') return;
    setSaving(true);
    await updateProfile({ callsign });
    setSaving(false);
    flash(setCallsignSaved);
  };

  const sectionTitle = (title) => (
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', marginBottom: 14 }}>{title}</div>
  );

  const saveBtn = (onClick, disabled) => (
    <button onClick={onClick} disabled={disabled || saving}
      style={{
        padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
        textTransform: 'uppercase', letterSpacing: '0.04em', cursor: disabled ? 'default' : 'pointer',
        border: `2px solid ${disabled ? '#ccc' : '#e50000'}`,
        background: disabled ? '#f5f5f5' : '#e50000',
        color: disabled ? '#999' : '#fff',
      }}
    >Save</button>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 24 }}>Settings</div>

      {/* ── Color ── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px', marginBottom: 16 }}>
        {sectionTitle('Crew Color')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, border: '2px solid #000' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Preview</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 14 }}>
          {SWATCH_COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setHexInput(c); }}
              style={{ width: '100%', aspectRatio: '1', border: `2px solid ${color === c ? '#000' : 'transparent'}`, background: c, cursor: 'pointer', outline: color === c ? '2px solid #000' : 'none', outlineOffset: 2 }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <input
            style={{ flex: 1, padding: '8px 10px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }}
            value={hexInput}
            onChange={e => handleHexInput(e.target.value)}
            placeholder="#e50000"
            maxLength={7}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {saveBtn(saveColor, false)}
          <SavedBadge visible={colorSaved} />
        </div>
      </div>

      {/* ── Home Region ── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px', marginBottom: 16 }}>
        {sectionTitle('Home Region')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {REGIONS.map(r => (
            <button key={r.key} onClick={() => setRegion(r.key)}
              style={{
                padding: '16px 12px', border: `2px solid ${region === r.key ? '#e50000' : '#000'}`,
                background: region === r.key ? 'rgba(229,0,0,0.05)' : '#fff',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: region === r.key ? '#e50000' : '#000', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.sub}</div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {saveBtn(saveRegion, !region)}
          <SavedBadge visible={regionSaved} />
        </div>
      </div>

      {/* ── Callsign ── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px' }}>
        {sectionTitle('Callsign')}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 10 }}>
          Current: <strong style={{ color: '#000' }}>{profile?.callsign}</strong>
        </div>
        <input
          style={{ width: '100%', padding: '9px 12px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 6 }}
          value={callsign}
          onChange={e => { setCallsign(e.target.value); setCallsignStatus(null); }}
          onBlur={handleCallsignBlur}
          maxLength={20}
          placeholder="New callsign"
        />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, minHeight: 16, marginBottom: 12 }}>
          {checking && <span style={{ color: 'var(--muted)' }}>Checking…</span>}
          {!checking && callsignStatus === 'available' && <span style={{ color: '#2D7A1F' }}>✓ Available</span>}
          {!checking && callsignStatus === 'taken' && <span style={{ color: '#e50000' }}>✗ Taken</span>}
          {!checking && callsignStatus === 'invalid' && <span style={{ color: '#e50000' }}>✗ 2–20 chars, letters/numbers/_/- only</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {saveBtn(saveCallsign, callsignStatus !== 'available')}
          <SavedBadge visible={callsignSaved} />
        </div>
      </div>
    </div>
  );
}
