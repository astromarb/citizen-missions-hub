import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { SFX } from '../../hooks/useSound.js';
import { useBanners } from '../../hooks/useBanners.js';
import { useBannerMetadata } from '../../hooks/useBannerMetadata.js';

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
const TOTAL_STEPS = 4;

// Badge access: alpha badge → Alpha Set
function canAccessSet(setName, userBadges) {
  if (/alpha/i.test(setName)) return (userBadges || []).some(b => b === 'alpha' || b === 'alpha_tester');
  if (setName === 'Classic Collection') return true;
  return false;
}

export default function OnboardingFlow({ profile, updateProfile, checkCallsign, onComplete }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [callsign, setCallsign] = useState(profile?.callsign || '');
  const [callsignStatus, setCallsignStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [color, setColor] = useState(profile?.color || '#378ADD');
  const [banner, setBanner] = useState(profile?.banner_panel || null);
  const [expandedSets, setExpandedSets] = useState({});
  const [region, setRegion] = useState(profile?.home_region || '');
  const [saving, setSaving] = useState(false);

  const { sets: bannerSets, loading: setsLoading } = useBanners();
  const { itemMeta, setMeta } = useBannerMetadata();

  // Assume fresh alpha accounts have the alpha badge from creation trigger
  const userBadges = profile?.badges || ['alpha'];

  const validateCallsign = (v) => callsignRegex.test(v);

  const handleCallsignBlur = async () => {
    if (!validateCallsign(callsign)) { setCallsignStatus('invalid'); return; }
    setChecking(true);
    const { available } = await checkCallsign(callsign);
    setCallsignStatus(available ? 'available' : 'taken');
    setChecking(false);
  };

  const canNext = () => {
    if (step === 1) return validateCallsign(callsign) && callsignStatus === 'available';
    if (step === 2) return !!color;
    if (step === 3) return true; // banner is optional
    if (step === 4) return !!region;
    return false;
  };

  const handleFinish = async () => {
    if (!canNext()) return;
    setSaving(true);
    const now = new Date().toISOString();
    await updateProfile({
      callsign,
      color,
      banner_panel: banner,
      home_region: region,
      onboarding_complete: true,
      callsign_changed_at: now,
      home_region_changed_at: now,
    });
    setSaving(false);
    SFX.open();
    onComplete();
  };

  const toggleSet = (name) =>
    setExpandedSets(prev => ({ ...prev, [name]: !prev[name] }));

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 9999, padding: isMobile ? 0 : 20 }}>
      <div style={{ background: '#fff', border: '2px solid #000', padding: isMobile ? '28px 20px 36px' : 36, width: '100%', maxWidth: 480, maxHeight: isMobile ? '92vh' : '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>Welcome, Pilot</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em' }}>{step} / {TOTAL_STEPS}</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
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
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Pick your crew color</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>Can be changed later in Settings.</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, background: color, border: '2px solid #000' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 6 : 4}, 1fr)`, gap: 10 }}>
              {SWATCH_COLORS.map(c => (
                <button key={c} onClick={() => { SFX.boop(); setColor(c); }}
                  style={{ width: '100%', aspectRatio: '1', border: `2px solid ${color === c ? '#000' : 'transparent'}`, background: c, cursor: 'pointer', outline: color === c ? '2px solid #000' : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Banner (optional) ── */}
        {step === 3 && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Choose a profile banner</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>
              This appears behind your pilot profile. You can change it later in Settings.
            </div>

            {/* None option */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setBanner(null)}
                style={{
                  width: 80, height: 80, border: `2px solid ${banner === null ? '#c41e3a' : '#ccc'}`,
                  background: banner === null ? 'rgba(196,30,58,0.04)' : '#fafafa',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3, flexShrink: 0,
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 20, color: '#bbb' }}>✕</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>None</span>
                {banner === null && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#c41e3a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 7, lineHeight: 1 }}>✓</span>
                  </div>
                )}
              </button>
              {banner && (() => {
                const src = bannerSets.flatMap(s => s.banners).find(b => b.id === banner)?.src;
                return src ? (
                  <div style={{ width: 160, height: 80, position: 'relative', overflow: 'hidden', border: '2px solid #c41e3a' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)' }} />
                  </div>
                ) : null;
              })()}
            </div>

            {setsLoading && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Loading banners…</div>
            )}

            {!setsLoading && bannerSets.filter(s => canAccessSet(s.name, userBadges)).map(set => {
              const isExp = !!expandedSets[set.name];
              const hasSelected = set.banners.some(b => b.id === banner);
              const setDescription = setMeta[set.name]?.description;

              return (
                <div key={set.name} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => toggleSet(set.name)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', background: 'none',
                      border: `2px solid ${hasSelected ? '#c41e3a' : '#e8e8e8'}`,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: hasSelected ? '#c41e3a' : '#555' }}>
                        {set.name}{hasSelected ? ' ✓' : ''}
                      </span>
                      {setDescription && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginLeft: 8 }}>{setDescription}</span>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa' }}>{isExp ? '▲' : '▼'}</span>
                  </button>

                  {isExp && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 0 4px 0' }}>
                      {set.banners.map(b => {
                        const selected = banner === b.id;
                        const displayName = itemMeta[b.id]?.displayName;
                        return (
                          <button
                            key={b.id}
                            onClick={() => { SFX.boop(); setBanner(b.id); }}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            }}
                          >
                            <div style={{
                              width: 80, height: 80, position: 'relative', overflow: 'hidden',
                              border: `2px solid ${selected ? '#c41e3a' : 'transparent'}`,
                              background: '#111',
                              boxShadow: selected ? '0 0 0 1px #c41e3a' : 'none',
                            }}>
                              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${b.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)' }} />
                              {selected && (
                                <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#c41e3a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                  <span style={{ color: '#fff', fontSize: 7, lineHeight: 1 }}>✓</span>
                                </div>
                              )}
                            </div>
                            {displayName && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: selected ? '#c41e3a' : 'var(--muted)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {displayName}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Step 4: Home Region ── */}
        {step === 4 && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>What is your Home Region?</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>Can be changed later in Settings.</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              {REGIONS.map(r => (
                <button key={r.key} onClick={() => { SFX.boop(); setRegion(r.key); }}
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

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: step > 1 ? 'space-between' : 'flex-end', alignItems: 'center', marginTop: 28 }}>
          {step > 1 && (
            <button
              onClick={() => { SFX.back(); setStep(step - 1); }}
              style={{
                padding: '11px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                border: '2px solid #000', background: '#fff', color: '#000',
              }}
            >← Back</button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Skip button only on optional banner step */}
            {step === 3 && banner !== null && (
              <button
                onClick={() => { SFX.back(); setBanner(null); setStep(step + 1); }}
                style={{
                  padding: '11px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                  border: '2px solid #ccc', background: '#fff', color: '#888',
                }}
              >Skip</button>
            )}
            {step === 3 && banner === null && (
              <button
                onClick={() => { SFX.boop(); setStep(step + 1); }}
                style={{
                  padding: '11px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                  border: '2px solid #ccc', background: '#fff', color: '#888',
                }}
              >Skip</button>
            )}
            {step < TOTAL_STEPS && step !== 3 && (
              <button style={btnPrimary(!canNext())} onClick={() => { if (canNext()) { SFX.boop(); setStep(step + 1); } }}>
                Next →
              </button>
            )}
            {step === 3 && banner !== null && (
              <button style={btnPrimary(false)} onClick={() => { SFX.boop(); setStep(step + 1); }}>
                Next →
              </button>
            )}
            {step === TOTAL_STEPS && (
              <button style={btnPrimary(!canNext() || saving)} onClick={handleFinish} disabled={saving}>
                {saving ? 'Saving…' : 'Enter the Verse →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
