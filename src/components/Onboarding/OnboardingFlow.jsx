import { useState, useEffect } from 'react';

const SWATCH_COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30',
  '#E24B4A', '#c41e3a', '#FFB347', '#4ECDC4',
  '#C44D58', '#556270', '#2ECC71', '#F39C12',
];

const REGIONS = [
  { key: 'New Babbage', label: 'New Babbage', sub: 'MicroTech' },
  { key: 'Area 18',     label: 'Area 18',     sub: 'ArcCorp' },
  { key: 'Orison',      label: 'Orison',      sub: 'Crusader' },
  { key: 'Lorville',    label: 'Lorville',    sub: 'Hurston' },
];

const callsignRegex = /^[a-zA-Z0-9_-]{2,20}$/;

export default function OnboardingFlow({ profile, updateProfile, checkCallsign, onComplete }) {
  const [step, setStep] = useState(1);
  const [callsign, setCallsign] = useState(profile?.callsign || '');
  const [callsignStatus, setCallsignStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [color, setColor] = useState(profile?.color || '#378ADD');
  const [hexInput, setHexInput] = useState(profile?.color || '#378ADD');
  const [region, setRegion] = useState(profile?.home_region || '');
  const [saving, setSaving] = useState(false);

  const validateCallsign = (v) => callsignRegex.test(v);

  const handleCallsignBlur = async () => {
    if (!validateCallsign(callsign)) {
      setCallsignStatus('invalid');
      return;
    }
    setChecking(true);
    const { available } = await checkCallsign(callsign);
    setCallsignStatus(available ? 'available' : 'taken');
    setChecking(false);
  };

  const canNext = () => {
    if (step === 1) return validateCallsign(callsign) && callsignStatus === 'available';
    if (step === 2) return !!color;
    if (step === 3) return !!region;
    return false;
  };

  const handleHexInput = (v) => {
    setHexInput(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v);
  };

  const handleFinish = async () => {
    if (!canNext()) return;
    setSaving(true);
    await updateProfile({ callsign, color, home_region: region, onboarding_complete: true });
    setSaving(false);
    onComplete();
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '2px solid #000', background: '#fff',
    fontFamily: 'var(--font-mono)', fontSize: 14, color: '#000', outline: 'none',
    boxSizing: 'border-box',
  };

  const btnPrimary = (disabled) => ({
    padding: '11px 28px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
    textTransform: 'uppercase', letterSpacing: '0.04em', cursor: disabled ? 'default' : 'pointer',
    border: `2px solid ${disabled ? '#ccc' : '#c41e3a'}`,
    background: disabled ? '#f5f5f5' : '#c41e3a',
    color: disabled ? '#999' : '#fff',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', border: '2px solid #000', padding: 36, width: 440, maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Welcome, Pilot</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em' }}>{step} / 3</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: step >= s ? '#c41e3a' : '#e5e5e5' }} />
          ))}
        </div>

        {/* ── Step 1: Callsign ── */}
        {step === 1 && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Choose your callsign</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>2–20 chars, letters, numbers, _ and - only.</div>
            <input
              style={{ ...inputStyle, borderColor: callsignStatus === 'taken' || callsignStatus === 'invalid' ? '#c41e3a' : '#000' }}
              value={callsign}
              onChange={e => { setCallsign(e.target.value); setCallsignStatus(null); }}
              onBlur={handleCallsignBlur}
              placeholder="e.g. Marvin"
              maxLength={20}
              autoFocus
            />
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, minHeight: 16 }}>
              {checking && <span style={{ color: 'var(--muted)' }}>Checking…</span>}
              {!checking && callsignStatus === 'available' && <span style={{ color: '#2D7A1F' }}>✓ Available</span>}
              {!checking && callsignStatus === 'taken' && <span style={{ color: '#c41e3a' }}>✗ Taken</span>}
              {!checking && callsignStatus === 'invalid' && <span style={{ color: '#c41e3a' }}>✗ Invalid format</span>}
            </div>
          </div>
        )}

        {/* ── Step 2: Color ── */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Pick your crew color</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: color, border: '2px solid #000' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {SWATCH_COLORS.map(c => (
                <button key={c} onClick={() => { setColor(c); setHexInput(c); }}
                  style={{ width: '100%', aspectRatio: '1', border: `2px solid ${color === c ? '#000' : 'transparent'}`, background: c, cursor: 'pointer', outline: color === c ? '2px solid #000' : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: '2px solid #000', flexShrink: 0 }} />
              <input
                style={{ ...inputStyle, width: 'auto', flex: 1 }}
                value={hexInput}
                onChange={e => handleHexInput(e.target.value)}
                placeholder="#c41e3a"
                maxLength={7}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Home Region ── */}
        {step === 3 && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Home region</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {REGIONS.map(r => (
                <button key={r.key} onClick={() => setRegion(r.key)}
                  style={{
                    padding: '20px 14px', border: `2px solid ${region === r.key ? '#c41e3a' : '#000'}`,
                    background: region === r.key ? 'rgba(196,30,58,0.05)' : '#fff',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: region === r.key ? '#c41e3a' : '#000', marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
          {step < 3 ? (
            <button style={btnPrimary(!canNext())} onClick={() => canNext() && setStep(step + 1)}>
              Next →
            </button>
          ) : (
            <button style={btnPrimary(!canNext() || saving)} onClick={handleFinish} disabled={saving}>
              {saving ? 'Saving…' : 'Enter the Verse →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
