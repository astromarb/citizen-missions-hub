import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase.js';

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

  // RSI handle
  const [rsiHandle,      setRsiHandle]      = useState(profile?.rsi_handle || '');
  const [rsiHandleSaved, setRsiHandleSaved] = useState(false);

  // aUEC balance verification
  const [auecScanning,  setAuecScanning]  = useState(false);
  const [auecExtracted, setAuecExtracted] = useState(null);
  const [auecScanError, setAuecScanError] = useState(null);
  const [auecManual,    setAuecManual]    = useState('');
  const [auecSaved,     setAuecSaved]     = useState(false);
  const auecFileRef = useRef(null);

  const flash = (setter) => { setter(true); setTimeout(() => setter(false), 2000); };

  const saveRsiHandle = async () => {
    if (!rsiHandle.trim()) return;
    setSaving(true);
    await updateProfile({ rsi_handle: rsiHandle.trim().toUpperCase() });
    setSaving(false);
    flash(setRsiHandleSaved);
  };

  const handleAuecScan = async (file) => {
    if (!file || !rsiHandle.trim()) return;
    setAuecScanning(true);
    setAuecScanError(null);
    setAuecExtracted(null);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('extract-auec-balance', {
        body: { imageBase64: base64, mimeType: file.type, rsiHandle: rsiHandle.trim() },
      });

      if (error) throw error;

      const amount = data?.amount ?? 0;
      if (amount >= 1000) {
        setAuecExtracted(amount);
      } else {
        setAuecScanError(`Couldn't detect a balance for "${rsiHandle.trim()}" in that image. Make sure your RSI handle and aUEC balance are both visible, or enter your balance manually below.`);
      }
    } catch {
      setAuecScanError('Scan failed — please try again');
    } finally {
      setAuecScanning(false);
      if (auecFileRef.current) auecFileRef.current.value = '';
    }
  };

  const saveAuecBalance = async (amount) => {
    if (!amount || amount <= 0) return;
    setSaving(true);
    await updateProfile({
      auec_balance: amount,
      auec_balance_verified_at: new Date().toISOString(),
      ...(rsiHandle.trim() ? { rsi_handle: rsiHandle.trim().toUpperCase() } : {}),
    });
    setAuecExtracted(null);
    setAuecManual('');
    setAuecScanError(null);
    setSaving(false);
    flash(setAuecSaved);
  };

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
        border: `2px solid ${disabled ? '#ccc' : '#c41e3a'}`,
        background: disabled ? '#f5f5f5' : '#c41e3a',
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
            placeholder="#c41e3a"
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
                padding: '16px 12px', border: `2px solid ${region === r.key ? '#c41e3a' : '#000'}`,
                background: region === r.key ? 'rgba(196,30,58,0.05)' : '#fff',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: region === r.key ? '#c41e3a' : '#000', marginBottom: 2 }}>{r.label}</div>
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
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px', marginBottom: 16 }}>
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
          {!checking && callsignStatus === 'taken' && <span style={{ color: '#c41e3a' }}>✗ Taken</span>}
          {!checking && callsignStatus === 'invalid' && <span style={{ color: '#c41e3a' }}>✗ 2–20 chars, letters/numbers/_/- only</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {saveBtn(saveCallsign, callsignStatus !== 'available')}
          <SavedBadge visible={callsignSaved} />
        </div>
      </div>
      {/* ── aUEC Balance Verification ── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px' }}>
        {sectionTitle('aUEC Balance Verification')}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>
          Enter your RSI handle, then upload a screenshot where your HUD is visible.
          AI vision locates your handle in the image and reads the aUEC balance next to it.
        </div>

        {/* RSI handle input */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            RSI Handle
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={rsiHandle}
              onChange={e => setRsiHandle(e.target.value)}
              placeholder="e.g. DIRTYNARWHAL"
              maxLength={32}
              style={{
                flex: 1, padding: '9px 12px', border: '2px solid #000',
                fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}
            />
            {saveBtn(saveRsiHandle, !rsiHandle.trim())}
            <SavedBadge visible={rsiHandleSaved} />
          </div>
        </div>

        {/* Current verified balance */}
        {profile?.auec_balance > 0 && profile?.auec_balance_verified_at && (
          <div style={{ padding: '12px 14px', background: 'rgba(45,134,89,0.06)', border: '2px solid #2d8659', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#2d8659', letterSpacing: '-0.01em' }}>
              {Number(profile.auec_balance).toLocaleString()} aUEC
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Last verified {new Date(profile.auec_balance_verified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* Scan result awaiting confirmation */}
        {auecExtracted !== null && (
          <div style={{ padding: '14px', background: 'rgba(196,30,58,0.04)', border: '2px solid #c41e3a', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Detected balance</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#c41e3a', letterSpacing: '-0.02em', marginBottom: 14 }}>
              {auecExtracted.toLocaleString()} aUEC
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => saveAuecBalance(auecExtracted)}
                disabled={saving}
                style={{
                  padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: saving ? 'default' : 'pointer',
                  border: '2px solid #2d8659', background: '#2d8659', color: '#fff',
                }}
              >Confirm & Save</button>
              <button
                onClick={() => { setAuecExtracted(null); setAuecScanError(null); }}
                style={{
                  padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                  border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)',
                }}
              >Wrong — Retry</button>
            </div>
          </div>
        )}

        {/* Error + manual fallback */}
        {auecScanError && auecExtracted === null && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c41e3a', marginBottom: 10, letterSpacing: '0.02em' }}>
              {auecScanError}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number" min="0"
                value={auecManual}
                onChange={e => setAuecManual(e.target.value)}
                placeholder="Enter balance manually"
                style={{ flex: 1, padding: '8px 10px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>aUEC</span>
              <button
                onClick={() => saveAuecBalance(parseInt(auecManual, 10))}
                disabled={!auecManual || saving}
                style={{
                  padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  cursor: !auecManual ? 'default' : 'pointer',
                  border: `2px solid ${auecManual ? '#c41e3a' : '#ccc'}`,
                  background: auecManual ? '#c41e3a' : '#f5f5f5',
                  color: auecManual ? '#fff' : '#999',
                  flexShrink: 0,
                }}
              >Save</button>
            </div>
          </div>
        )}

        {/* Upload button (hidden when result is pending) */}
        {auecExtracted === null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => auecFileRef.current?.click()}
              disabled={auecScanning || !rsiHandle.trim()}
              style={{
                padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                cursor: (auecScanning || !rsiHandle.trim()) ? 'default' : 'pointer',
                border: `2px solid ${(auecScanning || !rsiHandle.trim()) ? '#ccc' : '#000'}`,
                background: (auecScanning || !rsiHandle.trim()) ? '#f5f5f5' : '#000',
                color: (auecScanning || !rsiHandle.trim()) ? '#999' : '#fff',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 14 }}>{auecScanning ? '⏳' : '📷'}</span>
              <span>{auecScanning ? 'Scanning…' : profile?.auec_balance ? 'Update Screenshot' : 'Upload Screenshot'}</span>
            </button>
            <input
              ref={auecFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => handleAuecScan(e.target.files?.[0])}
            />
            <SavedBadge visible={auecSaved} />
          </div>
        )}
        {!rsiHandle.trim() && auecExtracted === null && (
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c41e3a', letterSpacing: '0.04em' }}>
            Enter your RSI handle above to enable scanning.
          </div>
        )}

        <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', lineHeight: 1.7, letterSpacing: '0.02em' }}>
          <strong style={{ color: 'var(--text)' }}>How it works:</strong> upload any screenshot where your RSI handle and ≡ aUEC balance are visible. Direct game screenshots and phone photos of your monitor both work.
        </div>
      </div>

    </div>
  );
}
