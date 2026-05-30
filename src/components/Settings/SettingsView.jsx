import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import LandingZoneBadge, { AlphaBadge } from '../shared/LandingZoneBadge.jsx';
import { getBanner } from '../../data/profileBanners.js';
import { useBanners } from '../../hooks/useBanners.js';
import { useBannerMetadata } from '../../hooks/useBannerMetadata.js';
import { SHIPS, calcFleetValue } from '../../data/ships.js';
import { CARD_THEMES } from '../../data/cardThemes.js';

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

const DAY_MS = 24 * 60 * 60 * 1000;

// Returns formatted "Xh Ym" if locked, null if allowed
function timeUntilAllowed(changedAt) {
  if (!changedAt) return null;
  const elapsed = Date.now() - new Date(changedAt).getTime();
  if (elapsed >= DAY_MS) return null;
  const remaining = DAY_MS - elapsed;
  const h = Math.floor(remaining / (60 * 60 * 1000));
  const m = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function recentTimestamps(tsArray) {
  if (!Array.isArray(tsArray)) return [];
  const cutoff = Date.now() - DAY_MS;
  return tsArray.filter(t => new Date(t).getTime() > cutoff);
}

// Banner set access: 'Classic Collection' future base set for all users.
// Alpha Set requires 'alpha' or 'alpha_tester' badge.
function canAccessSet(setName, userBadges) {
  if (setName === 'Classic Collection') return true;
  if (/alpha/i.test(setName)) {
    return (userBadges || []).some(b => b === 'alpha' || b === 'alpha_tester');
  }
  return false;
}

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

function RateLimitNote({ countdown }) {
  if (!countdown) return null;
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
      fontStyle: 'italic', marginTop: 6, letterSpacing: '0.02em',
    }}>
      Can change again in {countdown}
    </div>
  );
}

function LastChangedNote({ ts }) {
  if (!ts) return null;
  const d = new Date(ts);
  const str = d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
      fontStyle: 'italic', marginTop: 4,
    }}>
      Last changed {str}
    </div>
  );
}

export default function SettingsView({ profile, updateProfile, checkCallsign, systemMsgCount = 0, deleteAllSystemMessages, darkMode, setDarkMode, ships = SHIPS, shipsByName: shipsByNameProp }) {
  // Search the live (DB-sourced) ship list when available, else the static one.
  const searchShipList = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ships.filter(s => s.name.toLowerCase().includes(q) || (s.manufacturer || '').toLowerCase().includes(q)).slice(0, 10);
  };
  const shipsByNameLive = shipsByNameProp || Object.fromEntries(ships.map(s => [s.name, s]));
  const isMobile = useIsMobile();
  // ── Colour ─────────────────────────────────────────────────────────────────
  const [color,      setColor]      = useState(profile?.color || '#3b82f6');
  const [colorSaved, setColorSaved] = useState(false);
  const [colorError, setColorError] = useState(null);

  // ── Card theme ─────────────────────────────────────────────────────────────
  const [cardTheme,      setCardTheme]      = useState(profile?.card_theme || 'None');
  const [cardThemeSaved, setCardThemeSaved] = useState(false);
  const saveCardTheme = async (name) => {
    setCardTheme(name);
    const { error } = await updateProfile({ card_theme: name });
    if (!error) { setCardThemeSaved(true); setTimeout(() => setCardThemeSaved(false), 1800); }
  };

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
  const [bannerPanel,   setBannerPanel]   = useState(profile?.banner_panel || null);
  const [bannerSaved,   setBannerSaved]   = useState(false);
  const [bannerError,   setBannerError]   = useState(null);
  const [expandedSets,  setExpandedSets]  = useState({});
  const { sets: bannerSets, loading: bannersLoading, refresh: refreshBanners } = useBanners();
  const { itemMeta: bannerItemMeta, setMeta: bannerSetMeta } = useBannerMetadata();

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

  // ── Ships / fleet ───────────────────────────────────────────────────────────
  const [ownedShips,   setOwnedShips]   = useState(() => profile?.owned_ships || []);
  const [shipQuery,    setShipQuery]    = useState('');
  const [shipResults,  setShipResults]  = useState([]);
  const [shipsSaved,   setShipsSaved]   = useState(false);
  const [shipsError,   setShipsError]   = useState(null);

  // ── Messages & Privacy ───────────────────────────────────────────────────────
  const [confirmClearSys, setConfirmClearSys] = useState(false);
  const [clearSysSaved,   setClearSysSaved]   = useState(false);

  const [saving, setSaving] = useState(false);

  const flash = (setter) => { setter(true); setTimeout(() => setter(false), 2000); };

  // ── Re-sync local state when profile reloads ─
  useEffect(() => {
    if (!profile) return;
    setColor(profile.color || '#3b82f6');
    setRegion(profile.home_region || '');
    setRsiHandle(profile.rsi_handle || '');
    setBannerPanel(profile.banner_panel || null);
    setOwnedShips(profile.owned_ships || []);
    const earned = ['alpha', ...(profile.home_region ? ['home_region'] : [])];
    setSelectedBadges(profile.badges != null ? [...profile.badges] : [...earned]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Auto-expand the set that contains the active banner
  useEffect(() => {
    if (!bannerPanel || !bannerSets.length) return;
    const matchSet = bannerSets.find(s => s.banners.some(b => b.id === bannerPanel));
    if (matchSet) setExpandedSets(prev => ({ ...prev, [matchSet.name]: true }));
  }, [bannerPanel, bannerSets]);

  // ── Rate limit computed values ────────────────────────────────────────────
  const regionCountdown    = timeUntilAllowed(profile?.home_region_changed_at);
  const rsiHandleCountdown = timeUntilAllowed(profile?.rsi_handle_changed_at);
  const recentAuecChecks   = recentTimestamps(profile?.auec_verification_timestamps);
  const auecRemaining      = Math.max(0, 3 - recentAuecChecks.length);

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
    if (!region || regionCountdown) return;
    setRegionError(null);
    setSaving(true);
    const { error } = await updateProfile({ home_region: region, home_region_changed_at: new Date().toISOString() });
    setSaving(false);
    if (error) setRegionError(error.message || 'Save failed');
    else flash(setRegionSaved);
  };

  const saveRsiHandle = async () => {
    if (!rsiHandle.trim() || rsiHandleCountdown) return;
    setRsiHandleError(null);
    setSaving(true);
    const { error } = await updateProfile({ rsi_handle: rsiHandle.trim().toUpperCase(), rsi_handle_changed_at: new Date().toISOString() });
    setSaving(false);
    if (error) setRsiHandleError(error.message || 'Save failed');
    else flash(setRsiHandleSaved);
  };

  const saveAuecBalance = async (amount) => {
    if (!amount || amount <= 0 || auecRemaining === 0) return;
    setAuecError(null);
    setSaving(true);
    const now = new Date().toISOString();
    const updatedTimestamps = [...(profile?.auec_verification_timestamps || []), now];
    const { error } = await updateProfile({
      auec_balance: amount,
      auec_balance_verified_at: now,
      auec_verification_timestamps: updatedTimestamps,
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
    const { error } = await updateProfile({ callsign, callsign_changed_at: new Date().toISOString() });
    setSaving(false);
    if (error) setCallsignError(error.message || 'Save failed');
    else { setCallsignStatus(null); flash(setCallsignSaved); }
  };

  const handleAuecScan = async (file) => {
    if (!file || !rsiHandle.trim() || auecRemaining === 0) return;
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

  const saveShips = async (nextShips) => {
    setShipsError(null);
    setSaving(true);
    const { error } = await updateProfile({ owned_ships: nextShips });
    setSaving(false);
    if (error) setShipsError(error.message || 'Save failed');
    else flash(setShipsSaved);
  };

  const addShip = (name) => {
    if (ownedShips.includes(name)) return;
    const next = [...ownedShips, name];
    setOwnedShips(next);
    setShipQuery('');
    setShipResults([]);
    saveShips(next);
  };

  const removeShip = (name) => {
    const next = ownedShips.filter(s => s !== name);
    setOwnedShips(next);
    saveShips(next);
  };

  const toggleBadge = (id) => {
    if (!earnedBadgeIds.includes(id)) return;
    setSelectedBadges(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_BADGES) return prev;
      return [...prev, id];
    });
  };

  const toggleSet = (setName) => {
    setExpandedSets(prev => ({ ...prev, [setName]: !prev[setName] }));
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

  // Split color rows into two columns
  const leftRows  = COLOR_ROWS.filter((_, i) => i % 2 === 0);
  const rightRows = COLOR_ROWS.filter((_, i) => i % 2 === 1);

  const renderColorColumn = (rows) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rows.map(row => (
        <div key={row.label} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.colors.length}, 1fr)`, gap: 2 }}>
          {row.colors.map(c => {
            const selected = color === c;
            const light = isLight(c);
            return (
              <button
                key={c}
                title={`${row.label} · ${c}`}
                onClick={() => setColor(c)}
                style={{
                  width: '100%', aspectRatio: '1', background: c,
                  border: 'none', cursor: 'pointer', padding: 0, position: 'relative',
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
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 24 }}>Settings</div>

      {/* ── Appearance ── */}
      <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', padding: '20px', marginBottom: 16 }}>
        {sectionTitle('Appearance')}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Dark Mode</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Toggle between light and dark theme</div>
          </div>
          <button
            onClick={() => setDarkMode(v => !v)}
            style={{
              width: 52, height: 28, borderRadius: 14, border: '2px solid var(--border)',
              background: darkMode ? '#c41e3a' : 'var(--bg-3)',
              cursor: 'pointer', position: 'relative', flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: darkMode ? 22 : 2,
              width: 20, height: 20, borderRadius: 10,
              background: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>
      </div>

      {/* ── Display Color ───────────────────────────────────────────────────── */}
      <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', padding: '20px', marginBottom: 16 }}>
        {sectionTitle('Display Color')}

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 22, height: 22, background: color, border: '2px solid #000', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{color.toUpperCase()}</span>
        </div>

        {/* Palette grid — two columns, interleaved families */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, width: '50%' }}>
          {renderColorColumn(leftRows)}
          {renderColorColumn(rightRows)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {saveBtn(saveColor, false)}
          <SavedBadge visible={colorSaved} />
        </div>
        <SaveError msg={colorError} />
      </div>

      {/* ── Session Card Theme ──────────────────────────────────────────────── */}
      <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          {sectionTitle('Session Card Theme')}
          {cardThemeSaved && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#2d8659' }}>Saved ✓</span>}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Assigns a color to each day of the week on your session calendar cards.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(CARD_THEMES).map(([key, theme]) => {
            const selected = cardTheme === key;
            return (
              <button
                key={key}
                onClick={() => saveCardTheme(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                  border: selected ? '2px solid #000' : '2px solid var(--border)',
                  background: selected ? 'var(--bg-2)' : 'var(--bg-1)',
                  outline: 'none',
                }}
              >
                {/* 7-swatch preview */}
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {theme.colors.map((c, i) => (
                    <div key={i} style={{
                      width: 14, height: 14,
                      background: c || 'var(--border)',
                      border: '1px solid rgba(0,0,0,0.15)',
                      flexShrink: 0,
                    }} />
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {theme.label}
                    {selected && <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2d8659' }}>● Active</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{theme.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
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
            <button key={r.key} onClick={() => !regionCountdown && setRegion(r.key)}
              style={{
                padding: '14px 12px', border: `2px solid ${region === r.key ? '#c41e3a' : '#000'}`,
                background: region === r.key ? 'rgba(196,30,58,0.05)' : '#fff',
                cursor: regionCountdown ? 'default' : 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <LandingZoneBadge region={r.key} size="sm" />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: region === r.key ? '#c41e3a' : '#000', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <LastChangedNote ts={profile?.home_region_changed_at} />
        <RateLimitNote countdown={regionCountdown} />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
          {saveBtn(saveRegion, !region || !!regionCountdown)}
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

        {/* None option (small) */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setBannerPanel(null)}
            style={{
              width: 80, height: 80, flexShrink: 0,
              border: `2px solid ${bannerPanel === null ? '#c41e3a' : '#ccc'}`,
              background: bannerPanel === null ? 'rgba(196,30,58,0.04)' : '#fafafa',
              cursor: 'pointer', display: 'inline-flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              position: 'relative', verticalAlign: 'top',
            }}
          >
            <span style={{ fontSize: 20, color: '#bbb' }}>✕</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>None</span>
            {bannerPanel === null && (
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#c41e3a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
              </div>
            )}
          </button>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {saveBtn(saveBanner, false)}
          <SavedBadge visible={bannerSaved} />
        </div>
        <SaveError msg={bannerError} />

        {bannersLoading && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16 }}>Loading banners…</div>
        )}

        {/* Collapsible banner sets */}
        {!bannersLoading && bannerSets.map(set => {
          const accessible = canAccessSet(set.name, profile?.badges);
          if (!accessible) return null;
          const expanded = !!expandedSets[set.name];
          const hasSelected = set.banners.some(b => b.id === bannerPanel);
          const setDescription = bannerSetMeta[set.name]?.description;

          return (
            <div key={set.name} style={{ marginBottom: 10 }}>
              {/* Set header / toggle */}
              <button
                onClick={() => toggleSet(set.name)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', background: 'none',
                  border: `2px solid ${hasSelected ? '#c41e3a' : '#e8e8e8'}`,
                  cursor: 'pointer', textAlign: 'left', gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: hasSelected ? '#c41e3a' : '#444',
                  }}>
                    {set.name}
                    {hasSelected && <span style={{ marginLeft: 6, fontSize: 9 }}>✓</span>}
                  </span>
                  {setDescription && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#333' }}>
                      {setDescription}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
              </button>

              {/* Thumbnails — 4-col desktop, 1-col mobile */}
              {expanded && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 1 : 4}, 1fr)`, columnGap: 16, rowGap: 20, padding: '14px 0 8px 0' }}>
                  {set.banners.map(b => {
                    const selected = bannerPanel === b.id;
                    const displayName = bannerItemMeta[b.id]?.displayName;
                    const description = bannerItemMeta[b.id]?.description;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setBannerPanel(b.id)}
                        title={displayName || b.id}
                        style={{
                          padding: 0,
                          border: `2px solid ${selected ? '#c41e3a' : 'transparent'}`,
                          cursor: 'pointer', position: 'relative', overflow: 'visible',
                          outline: 'none', background: 'none',
                          boxShadow: selected ? '0 0 0 1px #c41e3a' : 'none',
                          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                        }}
                      >
                        {/* Image */}
                        <div style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden', background: '#111', zIndex: 0 }}>
                          <div style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: `url(${b.src})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                          }} />
                          <div style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none',
                            background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.45) 100%)',
                          }} />
                          {selected && (
                            <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#c41e3a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                              <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
                            </div>
                          )}
                        </div>
                        {/* Nametag — bites 14px into image, shrinks to text width, centered */}
                        {displayName && (
                          <div style={{ marginTop: -14, textAlign: 'center', position: 'relative', zIndex: 2, lineHeight: 0 }}>
                            <span style={{
                              display: 'inline-block',
                              background: 'rgba(255,255,255,0.92)',
                              padding: '5px 10px 4px',
                              maxWidth: 'calc(100% - 12px)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              verticalAlign: 'top',
                              fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                              lineHeight: 1.2,
                              color: selected ? '#c41e3a' : '#111',
                            }}>
                              {displayName}
                            </span>
                          </div>
                        )}
                        {/* Description below nametag */}
                        {description && (
                          <div style={{ padding: '4px 6px 8px' }}>
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: isMobile ? 16 : 14,
                              color: '#555', lineHeight: 1.4, display: 'block',
                            }}>
                              "{description}"
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {!bannersLoading && bannerSets.length === 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16 }}>
            No banners in storage yet.
          </div>
        )}
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
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, minHeight: 16, marginBottom: 8 }}>
          {checking && <span style={{ color: 'var(--muted)' }}>Checking…</span>}
          {!checking && callsignStatus === 'available' && <span style={{ color: '#2D7A1F' }}>✓ Available</span>}
          {!checking && callsignStatus === 'taken' && <span style={{ color: '#c41e3a' }}>✗ Taken</span>}
          {!checking && callsignStatus === 'invalid' && <span style={{ color: '#c41e3a' }}>✗ 2–20 chars, letters/numbers/_/- only</span>}
        </div>
        <LastChangedNote ts={profile?.callsign_changed_at} />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
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
              disabled={!!rsiHandleCountdown}
              style={{ flex: 1, padding: '9px 12px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            />
            {saveBtn(saveRsiHandle, !rsiHandle.trim() || !!rsiHandleCountdown)}
            <SavedBadge visible={rsiHandleSaved} />
          </div>
          <LastChangedNote ts={profile?.rsi_handle_changed_at} />
          <RateLimitNote countdown={rsiHandleCountdown} />
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

        {/* Remaining verifications */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
          padding: '8px 12px',
          background: auecRemaining === 0 ? 'rgba(196,30,58,0.04)' : 'var(--bg-2)',
          border: `1px solid ${auecRemaining === 0 ? '#c41e3a' : 'var(--bg-3)'}`,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
            color: auecRemaining === 0 ? '#c41e3a' : auecRemaining === 1 ? '#d97706' : '#2d8659',
            letterSpacing: '-0.01em', lineHeight: 1,
          }}>{auecRemaining}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.4 }}>
            verification{auecRemaining !== 1 ? 's' : ''} remaining today
            {auecRemaining === 0 && recentAuecChecks.length > 0 && (() => {
              const oldest = Math.min(...recentAuecChecks.map(t => new Date(t).getTime()));
              const resetsIn = timeUntilAllowed(new Date(oldest - DAY_MS + 1).toISOString());
              return resetsIn ? ` · resets in ${resetsIn}` : '';
            })()}
          </span>
        </div>

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
              <button onClick={() => saveAuecBalance(parseInt(auecManual, 10))} disabled={!auecManual || saving || auecRemaining === 0}
                style={{
                  padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                  cursor: !auecManual || auecRemaining === 0 ? 'default' : 'pointer',
                  border: `2px solid ${auecManual && auecRemaining > 0 ? '#c41e3a' : '#ccc'}`,
                  background: auecManual && auecRemaining > 0 ? '#c41e3a' : '#f5f5f5',
                  color: auecManual && auecRemaining > 0 ? '#fff' : '#999',
                }}>Save</button>
            </div>
          </div>
        )}

        {/* Upload button */}
        {auecExtracted === null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => auecFileRef.current?.click()}
              disabled={auecScanning || !rsiHandle.trim() || auecRemaining === 0}
              style={{
                padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
                cursor: (auecScanning || !rsiHandle.trim() || auecRemaining === 0) ? 'default' : 'pointer',
                border: `2px solid ${(auecScanning || !rsiHandle.trim() || auecRemaining === 0) ? '#ccc' : '#000'}`,
                background: (auecScanning || !rsiHandle.trim() || auecRemaining === 0) ? '#f5f5f5' : '#000',
                color: (auecScanning || !rsiHandle.trim() || auecRemaining === 0) ? '#999' : '#fff',
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
        {!rsiHandle.trim() && auecExtracted === null && auecRemaining > 0 && (
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c41e3a', letterSpacing: '0.04em' }}>
            Enter your RSI handle above to enable scanning.
          </div>
        )}
        <SaveError msg={auecError} />
        <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', lineHeight: 1.7, letterSpacing: '0.02em' }}>
          <strong style={{ color: 'var(--text)' }}>How it works:</strong> upload any screenshot where your RSI handle and ≡ aUEC balance are visible. Direct game screenshots and phone photos of your monitor both work.
        </div>
      </div>

      {/* ── Ships / Fleet ────────────────────────────────────────────────────── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px' }}>
        {sectionTitle('My Fleet')}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>
          Add ships you own. Their aUEC value is included in your public Net Worth.
        </div>

        {/* Net worth summary */}
        {(() => {
          const fleetVal   = calcFleetValue(ownedShips, shipsByNameLive);
          const balance    = Number(profile?.auec_balance) || 0;
          const totalWorth = fleetVal + balance;
          return (
            <div style={{ padding: '12px 14px', background: 'var(--bg-2)', border: '2px solid #000', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Net Worth Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  <span style={{ color: 'var(--muted)' }}>aUEC Balance</span>
                  <span>{balance.toLocaleString()} aUEC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  <span style={{ color: 'var(--muted)' }}>Fleet Value ({ownedShips.length} ship{ownedShips.length !== 1 ? 's' : ''})</span>
                  <span>{fleetVal.toLocaleString()} aUEC</span>
                </div>
                <div style={{ borderTop: '1px solid var(--bg-3)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>
                  <span>Total Net Worth</span>
                  <span style={{ color: totalWorth > 0 ? '#2d8659' : 'var(--muted)' }}>{totalWorth.toLocaleString()} aUEC</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Search + add */}
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Add a Ship</div>
          <input
            value={shipQuery}
            onChange={e => { setShipQuery(e.target.value); setShipResults(searchShipList(e.target.value)); }}
            onKeyDown={e => { if (e.key === 'Escape') { setShipQuery(''); setShipResults([]); } }}
            placeholder="Search by ship name or manufacturer…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', letterSpacing: '0.02em' }}
          />
          {shipResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              background: 'var(--bg-1)', border: '2px solid #000', borderTop: 'none',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.15)',
            }}>
              {shipResults.map(ship => {
                const already = ownedShips.includes(ship.name);
                return (
                  <button key={ship.name}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { if (!already) addShip(ship.name); }}
                    disabled={already}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      width: '100%', padding: '9px 12px', border: 'none', borderBottom: '1px solid var(--bg-2)',
                      background: already ? 'var(--bg-2)' : 'var(--bg-1)',
                      cursor: already ? 'default' : 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!already) e.currentTarget.style.background = 'var(--bg-2)'; }}
                    onMouseLeave={e => { if (!already) e.currentTarget.style.background = 'var(--bg-1)'; }}
                  >
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: already ? 'var(--muted)' : 'var(--text)' }}>
                      {ship.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: already ? 'var(--muted)' : '#2d8659', marginLeft: 12, flexShrink: 0 }}>
                      {already ? 'owned' : `${ship.value.toLocaleString()} aUEC`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fleet list */}
        {ownedShips.length === 0 ? (
          <div style={{ padding: '20px', border: '2px dashed var(--bg-3)', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
            No ships added yet. Search above to build your fleet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ownedShips.map(name => {
              const ship = shipsByNameLive[name];
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '2px solid var(--bg-3)', background: 'var(--bg-2)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)' }}>{name}</div>
                    {ship && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{ship.manufacturer}</div>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#2d8659', flexShrink: 0 }}>
                    {ship ? ship.value.toLocaleString() : '?'} aUEC
                  </span>
                  <button onClick={() => removeShip(name)} title="Remove ship"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c41e3a', fontSize: 18, fontWeight: 700, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                </div>
              );
            })}
          </div>
        )}

        {shipsError && <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c41e3a' }}>{shipsError}</div>}
        {shipsSaved && <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#2d8659' }}>Fleet saved ✓</div>}
        <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', lineHeight: 1.7, letterSpacing: '0.02em' }}>
          Ship values are approximate aUEC equivalents. Net Worth is public on your profile.
        </div>
      </div>

      {/* ── Messages & Privacy ──────────────────────────────────────────────── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: '20px', marginTop: 16 }}>
        {sectionTitle('Messages & Privacy')}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>
          Manage messages sent to your inbox by Nexus Hub system broadcasts.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: systemMsgCount > 0 ? 'var(--text)' : 'var(--muted)' }}>
            {systemMsgCount === 0
              ? 'No system messages in your inbox.'
              : `${systemMsgCount} system message${systemMsgCount !== 1 ? 's' : ''} in your inbox`}
          </span>

          {systemMsgCount > 0 && (
            confirmClearSys ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Delete all {systemMsgCount}?</span>
                <button
                  onClick={async () => {
                    await deleteAllSystemMessages?.();
                    setConfirmClearSys(false);
                    flash(setClearSysSaved);
                  }}
                  style={{
                    padding: '7px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                    border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff',
                  }}
                >Yes, Delete All</button>
                <button
                  onClick={() => setConfirmClearSys(false)}
                  style={{
                    padding: '7px 14px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                    border: '2px solid #ccc', background: '#f5f5f5', color: '#999',
                  }}
                >Cancel</button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmClearSys(true)}
                style={{
                  padding: '7px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                  border: '2px solid #000', background: '#fff', color: '#000',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >Delete All System Messages</button>
            )
          )}
          <SavedBadge visible={clearSysSaved} />
        </div>
      </div>
    </div>
  );
}
