import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import LandingZoneBadge, { AlphaBadge } from '../shared/LandingZoneBadge.jsx';
import { getBanner } from '../../data/profileBanners.js';
import { useBanners } from '../../hooks/useBanners.js';

// ── Color palette ─────────────────────────────────────────────────────────────
const COLOR_ROWS = [
  { label: 'Red',     colors: ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'] },
  { label: 'Orange',  colors: ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#7c2d12'] },
  { label: 'Amber',   colors: ['#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', '#d97706', '#b45309', '#78350f'] },
  { label: 'Lime',    colors: ['#ecfccb', '#d9f99d', '#bef264', '#a3e635', '#84cc16', '#65a30d', '#365314'] },
  { label: 'Green',   colors: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#166534'] },
  { label: 'Emerald', colors: ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#065f46'] },
  { label: 'Cyan',    colors: ['#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#164e63'] },
  { label: 'Blue',    colors: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e3a8a'] },
  { label: 'Violet',  colors: ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#4c1d95'] },
  { label: 'Pink',    colors: ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#9d174d'] },
  { label: 'Slate',   colors: ['#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b'] },
];

const isLight = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
};

// ── Badge definitions ─────────────────────────────────────────────────────────
const MAX_BADGES = 5;

const BADGE_DEFS = [
  { id: 'alpha',       label: 'Alpha Tester', desc: 'Early access' },
  { id: 'home_region', label: 'Home Region',  desc: 'Set home region' },
];

// ── Misc ──────────────────────────────────────────────────────────────────────
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

function SaveError({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c41e3a',
      marginTop: 6, letterSpacing: '0.02em', lineHeight: 1.4,
    }}>
      ✗ {msg}
    </div>
  );
}

export default function SettingsView({ profile, updateProfile, checkCallsign }) {
  // ── Colour ─────────────────────────────────────────────────────────────────
  const [color,      setColor]      = useState(profile?.color || '#3b82f6');
  const [hexInput,   setHexInput]   = useState(profile?.color || '#3b82f6');
  const [colorSaved, setColorSaved] = useState(false);
  const [colorError, setColorError] = useState(null);

  // ── Home region ─────────────────────────────────────────────────────────────
  const [region,      setRegion]      = useState(profile?.home_region || '');
  const [regionSaved, setRegionSaved] = useState(false);
  const [regionError, setRegionError] = useState(null);

  // ── Callsign ────────────────────────────────────────────────────────────────
  const [callsign,       setCallsign]       = useState(profile?.callsign || '');
  const [callsignStatus, setCallsignStatus] = useState(null);
  const [checking,       setChecking]       = useState(false);
  const [callsignSaved,  setCallsignSaved]  = useState(false);
  const [callsignError,  setCallsignError]  = useState(null);

  // ── Badges ──────────────────────────────────────────────────────────────────
  const earnedBadgeIds = [
    'alpha',
    ...(profile?.home_region ? ['home_region'] : []),
  ];

  const [selectedBadges, setSelectedBadges] = useState(() => {
    if (profile?.badges != null) return [...profile.badges];
    return [...earnedBadgeIds];
  });
  const [badgesSaved, setBadgesSaved] = useState(false);
  const [badgesError, setBadgesError] = useState(null);

  // ── Banner panel ─────────────────────────────────────────────────────────────
  const [bannerPanel, setBannerPanel] = useState(profile?.banner_panel || null);
  const [bannerSaved, setBannerSaved] = useState(false);
  const [bannerError, setBannerError] = useState(null);
  const { sets: bannerSets, loading: bannersLoading, refresh: refreshBanners } = useBanners();

  // ── RSI handle ──────────────────────────────────────────────────────────────
  const [rsiHandle,      setRsiHandle]      = useState(profile?.rsi_handle || '');
  const [rsiHandleSaved, setRsiHandleSaved] = useState(false);
  const [rsiHandleError, setRsiHandleError] = useState(null);

  // ── aUEC balance ────────────────────────────────────────────────────────────
  const [auecScanning,  setAuecScanning]  = useState(false);
  const [auecExtracted, setAuecExtracted] = useState(null);
  const [auecScanError, setAuecScanError] = useState(null);
  const [auecManual,    setAuecManual]    = useState('');
  const [auecSaved,     setAuecSaved]     = useState(false);
  const [auecError,     setAuecError]     = useState(null);
  const auecFileRef = useRef(null);

  const [saving, setSaving] = useState(false);

  const flash = (setter) => { setter(true); setTimeout(() => setter(false), 2000); };

  // ── Re-sync local state when profile reloads (e.g. after a successful save) ─
  useEffect(() => {
    if (!profile) return;
    setColor(profile.color || '#3b82f6');
    setHexInput(profile.color || '#3b82f6');
    setRegion(profile.home_region || '');
    setRsiHandle(profile.rsi_handle || '');
    setBannerPanel(profile.banner_panel || null);
    const earned = ['alpha', ...(profile.home_region ? ['home_region'] : [])];
    setSelectedBadges(profile.badges != null ? [...profile.badges] : [...earned]);
  // Only resync on first load or when user data changes server-side.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // ── Save handlers ─────────────────────────────────────────────────────────────
  const saveColor = async () => {
    setColorError(null);
    setSaving(true);
    const { error } = await updateProfile({ color });
    setSaving(false);
    if (error) setColorError(error.message || 'Save failed');
    else flash(setColorSaved);
  };

  const saveBadges = async () => {
    setBadgesError(null);
    setSaving(true);
    const { error } = await updateProfile({ badges: selectedBadges });
    setSaving(false);
    if (error) setBadgesError(error.message || 'Save failed');
    else flash(setBadgesSaved);
  };

  const saveRegion = async () => {
    if (!region) return;
    setRegionError(null);
    setSaving(true);
    const { error } = await updateProfile({ home_region: region });
    setSaving(false);
    if (error) setRegionError(error.message || 'Save failed');
    else flash(setRegionSaved);
  };

  const saveRsiHandle = async () => {
    if (!rsiHandle.trim()) return;
    setRsiHandleError(null);
    setSaving(true);
    const { error } = await updateProfile({ rsi_handle: rsiHandle.trim().toUpperCase() });
    setSaving(false);
    if (error) setRsiHandleError(error.message || 'Save failed');
    else flash(setRsiHandleSaved);
  };

  const saveAuecBalance = async (amount) => {
    if (!amount || amount <= 0) return;
    setAuecError(null);
    setSaving(true);
    const { error } = await updateProfile({
      auec_balance: amount,
      auec_balance_verified_at: new Date().toISOString(),
      ...(rsiHandle.trim() ? { rsi_handle: rsiHandle.trim().toUpperCase() } : {}),
    });
    setAuecExtracted(null);
    setAuecManual('');
    setAuecScanError(null);
    setSaving(false);
    if (error) setAuecError(error.message || 'Save failed');
    else flash(setAuecSaved);
  };

  const saveBanner = async () => {
    setBannerError(null);
    setSaving(true);
    const { error } = await updateProfile({ banner_panel: bannerPanel });
    setSaving(false);
    if (error) setBannerError(error.message || 'Save failed');
    else flash(setBannerSaved);
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
    setCallsignError(null);
    setSaving(true);
    const { error } = await updateProfile({ callsign });
    setSaving(false);
    if (error) setCallsignError(error.message || 'Save failed');
    else { setCallsignStatus(null); flash(setCallsignSaved); }
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

  const handleHexInput = (v) => {
    setHexInput(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v);
  };

  const toggleBadge = (id) => {
    if (!earnedBadgeIds.includes(id)) return;
    setSelectedBadges(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_BADGES) return prev;
      return [...prev, id];
    });
  };

  // ── UI helpers ───────────────────────────────────────────────────────────────
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

  const renderBadge = (id, size) => {
    if (id === 'alpha') return <AlphaBadge key="alpha" size={size} />;
    if (id === 'home_region' && profile?.home_region) return <LandingZoneBadge key="home_region" region={profile.home_region} size={size} />;
    return null;
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 24 }}>Settings</div>

      {/* ── Crew Color ──────────────────────────────────────────────────────── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px', marginBottom: 16 }}>
        {sectionTitle('Crew Color')}

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: color, border: '2px solid #000', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{color.toUpperCase()}</span>
        </div>

        {/* Palette grid — 11 colour families × 7 shades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
          {COLOR_ROWS.map(row => (
            <div key={row.label} style={{ display: 'flex', gap: 2 }}>
              {row.colors.map(c => {
                const selected = color === c;
                const light = isLight(c);
                return (
                  <button
                    key={c}
                    title={c}
                    onClick={() => { setColor(c); setHexInput(c); }}
                    style={{
                      flex: 1,
                      height: 26,
                      background: c,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      position: 'relative',
                      outline: selected ? `2px solid ${light ? '#000' : '#fff'}` : 'none',
                      outlineOffset: -2,
                    }}
                  >
                    {selected && (
                      <span style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, color: light ? '#000' : '#fff',
                        lineHeight: 1,
                      }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Custom hex input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: '2px solid #000', flexShrink: 0 }} />
          <input
            style={{ flex: 1, padding: '7px 10px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }}
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
        <SaveError msg={colorError} />
      </div>

      {/* ── Profile Badges ───────────────────────────────────────────────────── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px', marginBottom: 16 }}>
        {sectionTitle('Profile Badges')}

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>Select which badges appear on your pilot profile.</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
            color: selectedBadges.length >= MAX_BADGES ? '#c41e3a' : '#2d8659',
          }}>
            {selectedBadges.length} / {MAX_BADGES}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {BADGE_DEFS.map(def => {
            const earned   = earnedBadgeIds.includes(def.id);
            const selected = selectedBadges.includes(def.id);
            const atMax    = !selected && selectedBadges.length >= MAX_BADGES;
            const clickable = earned && !atMax;

            return (
              <button
                key={def.id}
                onClick={() => clickable || selected ? toggleBadge(def.id) : undefined}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 10px', minWidth: 84,
                  border: `2px solid ${selected ? '#c41e3a' : earned ? '#ccc' : '#e8e8e8'}`,
                  background: selected ? 'rgba(196,30,58,0.04)' : '#fafafa',
                  cursor: earned ? 'pointer' : 'default',
                  opacity: earned ? 1 : 0.45,
                  position: 'relative',
                }}
              >
                {/* Badge preview */}
                <div style={{ position: 'relative' }}>
                  {renderBadge(def.id, 'lg') ?? (
                    <div style={{
                      width: 68, height: 68, border: '2px dashed #ddd',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#f5f5f5',
                    }}>
                      <span style={{ fontSize: 18, color: '#ccc' }}>🔒</span>
                    </div>
                  )}
                  {/* Selection indicator overlay */}
                  {selected && (
                    <div style={{
                      position: 'absolute', top: -4, right: -4, width: 16, height: 16,
                      borderRadius: '50%', background: '#c41e3a', border: '2px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
                    </div>
                  )}
                </div>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
                  {def.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 7, textTransform: 'uppercase',
                  letterSpacing: '0.06em', textAlign: 'center',
                  color: selected ? '#c41e3a' : earned ? '#2d8659' : 'var(--muted)',
                }}>
                  {!earned ? 'Locked' : selected ? '● Showing' : atMax ? 'Max reached' : '○ Hidden'}
                </span>
              </button>
            );
          })}
        </div>

        {!earnedBadgeIds.includes('home_region') && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Set a home region below to unlock the Home Region badge.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {saveBtn(saveBadges, false)}
          <SavedBadge visible={badgesSaved} />
        </div>
        <SaveError msg={badgesError} />
      </div>

      {/* ── Home Region ─────────────────────────────────────────────────────── */}
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
        {region && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <LandingZoneBadge region={region} size="lg" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
              Your landing zone badge — visible on your profile
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {saveBtn(saveRegion, !region)}
          <SavedBadge visible={regionSaved} />
        </div>
        <SaveError msg={regionError} />
      </div>

      {/* ── Profile Banner ────────────────────────────────────────────────────── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {sectionTitle('Profile Banner')}
          <button
            onClick={refreshBanners}
            disabled={bannersLoading}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
              background: 'none', border: 'none', cursor: bannersLoading ? 'default' : 'pointer',
              padding: '0 0 15px 0', letterSpacing: '0.08em', textTransform: 'uppercase',
              opacity: bannersLoading ? 0.4 : 1, transition: 'opacity 0.15s',
            }}
          >↻ refresh</button>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Left: picker */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* None option */}
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setBannerPanel(null)}
                style={{
                  width: 106, height: 106, flexShrink: 0,
                  border: `2px solid ${bannerPanel === null ? '#c41e3a' : '#ccc'}`,
                  background: bannerPanel === null ? 'rgba(196,30,58,0.04)' : '#fafafa',
                  cursor: 'pointer', display: 'inline-flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  position: 'relative', verticalAlign: 'top',
                }}
              >
                <span style={{ fontSize: 24, color: '#bbb' }}>✕</span>
                {bannerPanel === null && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#c41e3a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
                  </div>
                )}
              </button>
            </div>

            {/* Loading */}
            {bannersLoading && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16 }}>Loading banners…</div>
            )}

            {/* Banner sets */}
            {!bannersLoading && bannerSets.map(set => (
              <div key={set.name} style={{ marginBottom: 22 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888',
                  marginBottom: 10, borderBottom: '1px solid #e8e8e8', paddingBottom: 6,
                }}>
                  {set.name}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {set.banners.map(b => {
                    const selected = bannerPanel === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setBannerPanel(b.id)}
                        style={{
                          width: 106, height: 106, padding: 0, flexShrink: 0,
                          border: `2px solid ${selected ? '#c41e3a' : 'transparent'}`,
                          cursor: 'pointer', position: 'relative', overflow: 'hidden',
                          outline: 'none', background: '#111',
                          boxShadow: selected ? '0 0 0 1px #c41e3a' : 'none',
                        }}
                      >
                        <div style={{
                          position: 'absolute', inset: 0,
                          backgroundImage: `url(${b.src})`,
                          backgroundSize: 'cover', backgroundPosition: 'center',
                        }} />
                        <div style={{
                          position: 'absolute', inset: 0, pointerEvents: 'none',
                          background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)',
                        }} />
                        {selected && (
                          <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#c41e3a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                            <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Empty state */}
            {!bannersLoading && bannerSets.length === 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16 }}>
                No banners in storage yet. Upload images to the images bucket to create sets.
              </div>
            )}
          </div>

          {/* Right: preview + save */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            {bannerPanel && (() => {
              const signedSrc = bannerSets.flatMap(s => s.banners).find(b => b.id === bannerPanel)?.src
                ?? getBanner(bannerPanel)?.src;
              return signedSrc ? (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, textAlign: 'right' }}>Preview</div>
                <div style={{ width: 200, height: 200, position: 'relative', overflow: 'hidden', border: '2px solid #ccc', background: '#111' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${signedSrc})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)',
                  }} />
                </div>
              </div>
              ) : null;
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saveBtn(saveBanner, false)}
              <SavedBadge visible={bannerSaved} />
            </div>
            <SaveError msg={bannerError} />
          </div>

        </div>
      </div>

      {/* ── Callsign ────────────────────────────────────────────────────────── */}
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
        <SaveError msg={callsignError} />
      </div>

      {/* ── aUEC Balance Verification ────────────────────────────────────────── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px' }}>
        {sectionTitle('aUEC Balance Verification')}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>
          Enter your RSI handle, then upload a screenshot where your HUD is visible.
          AI vision locates your handle in the image and reads the aUEC balance next to it.
        </div>

        {/* RSI handle */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>RSI Handle</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={rsiHandle}
              onChange={e => setRsiHandle(e.target.value)}
              placeholder="e.g. DIRTYNARWHAL"
              maxLength={32}
              style={{ flex: 1, padding: '9px 12px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            />
            {saveBtn(saveRsiHandle, !rsiHandle.trim())}
            <SavedBadge visible={rsiHandleSaved} />
          </div>
          <SaveError msg={rsiHandleError} />
        </div>

        {/* Current verified balance */}
        {profile?.auec_balance > 0 && profile?.auec_balance_verified_at && (
          <div style={{ padding: '12px 14px', background: 'rgba(45,134,89,0.06)', border: '2px solid #2d8659', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#2d8659', letterSpacing: '-0.01em' }}>
              {Number(profile.auec_balance).toLocaleString()} aUEC
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Last verified {new Date(profile.auec_balance_verified_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
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
              <button onClick={() => saveAuecBalance(auecExtracted)} disabled={saving}
                style={{ padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: saving ? 'default' : 'pointer', border: '2px solid #2d8659', background: '#2d8659', color: '#fff' }}>
                Confirm & Save
              </button>
              <button onClick={() => { setAuecExtracted(null); setAuecScanError(null); }}
                style={{ padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)' }}>
                Wrong — Retry
              </button>
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
              <input type="number" min="0" value={auecManual} onChange={e => setAuecManual(e.target.value)} placeholder="Enter balance manually"
                style={{ flex: 1, padding: '8px 10px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>aUEC</span>
              <button onClick={() => saveAuecBalance(parseInt(auecManual, 10))} disabled={!auecManual || saving}
                style={{
                  padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                  cursor: !auecManual ? 'default' : 'pointer',
                  border: `2px solid ${auecManual ? '#c41e3a' : '#ccc'}`,
                  background: auecManual ? '#c41e3a' : '#f5f5f5',
                  color: auecManual ? '#fff' : '#999',
                }}>Save</button>
            </div>
          </div>
        )}

        {/* Upload button */}
        {auecExtracted === null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => auecFileRef.current?.click()}
              disabled={auecScanning || !rsiHandle.trim()}
              style={{
                padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
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
            <input ref={auecFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
              onChange={e => handleAuecScan(e.target.files?.[0])} />
            <SavedBadge visible={auecSaved} />
          </div>
        )}
        {!rsiHandle.trim() && auecExtracted === null && (
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c41e3a', letterSpacing: '0.04em' }}>
            Enter your RSI handle above to enable scanning.
          </div>
        )}
        <SaveError msg={auecError} />
        <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', lineHeight: 1.7, letterSpacing: '0.02em' }}>
          <strong style={{ color: 'var(--text)' }}>How it works:</strong> upload any screenshot where your RSI handle and ≡ aUEC balance are visible. Direct game screenshots and phone photos of your monitor both work.
        </div>
      </div>
    </div>
  );
}
