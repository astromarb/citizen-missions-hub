import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import { useIsMobile } from '@/hooks/useIsMobile.js';
import { getBanner } from '@/data/profileBanners.js';
import { useBannerUrl } from '@/hooks/useBanners.js';
import LandingZoneBadge, { AlphaBadge } from '@/components/shared/LandingZoneBadge.jsx';

function ProfileCard({ profile, isMobile }) {
  const bannerObj = profile.banner_panel ? getBanner(profile.banner_panel) : null;
  const bannerSrc = useBannerUrl(profile.banner_panel ?? null);
  const color = profile.color || '#8b949e';
  const homeRegion = profile.home_region || null;

  const displayBadges = Array.isArray(profile.badges) ? profile.badges : [];

  const renderBadge = (id) => {
    if (id === 'alpha') return <AlphaBadge key="alpha" size="sm" />;
    if (id === 'home_region' && homeRegion) return <LandingZoneBadge key="hr" region={homeRegion} size="sm" />;
    return null;
  };

  if (isMobile) {
    return (
      <div style={{ border: '2px solid var(--border)', position: 'relative', overflow: 'hidden', aspectRatio: '1 / 1', background: '#111' }}>
        {bannerSrc ? (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bannerSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#1a1a1a' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 38%, rgba(0,0,0,0.65) 56%, rgba(0,0,0,0.93) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 6, bottom: 0, background: color, opacity: 0.9 }} />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${color}`, objectFit: 'cover' }} />
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            {displayBadges.map(id => renderBadge(id))}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 6, padding: '10px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
            {homeRegion && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Home Region</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{homeRegion}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '2px solid var(--border)', overflow: 'hidden', background: '#111' }}>
      {bannerSrc ? (
        <div style={{ height: 160, backgroundImage: `url(${bannerSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
        </div>
      ) : (
        <div style={{ height: 80, background: `linear-gradient(135deg, ${color}22, ${color}44)` }} />
      )}
      <div style={{ padding: '16px 20px', background: 'var(--bg-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', border: `3px solid ${color}`, objectFit: 'cover', marginTop: -28, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: color, border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -28, flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 22, fontFamily: 'var(--font-display)' }}>{(profile.callsign || '?')[0].toUpperCase()}</span>
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--text)' }}>{profile.callsign}</div>
            {homeRegion && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{homeRegion}</div>
            )}
          </div>
        </div>
        {displayBadges.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {displayBadges.map(id => renderBadge(id))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicProfileView({ callsign, onSignIn }) {
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!callsign) { setLoading(false); setNotFound(true); return; }
    supabase
      .from('profiles')
      .select('id, callsign, color, avatar_url, home_region, badges, banner_panel')
      .ilike('callsign', callsign)
      .maybeSingle()
      .then(({ data }) => {
        setLoading(false);
        if (data) setProfile(data);
        else setNotFound(true);
      });
  }, [callsign]);

  const containerStyle = {
    minHeight: '100vh',
    background: 'var(--bg-0)',
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: isMobile ? '16px 12px' : '40px 20px',
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Loading…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em', marginBottom: 8, textTransform: 'uppercase' }}>Pilot Not Found</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>No pilot with callsign "{callsign}"</div>
        <button onClick={onSignIn} style={{ padding: '10px 24px', background: '#c41e3a', border: '2px solid #c41e3a', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header bar */}
      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 14 : 16, letterSpacing: '0.06em', color: 'var(--text)', textTransform: 'uppercase', lineHeight: 1 }}>CITIZEN</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 8 : 9, letterSpacing: '0.18em', color: '#c41e3a', textTransform: 'uppercase', marginTop: 1 }}>MISSIONS HUB</div>
        </div>
        <button
          onClick={onSignIn}
          style={{
            padding: '8px 18px', background: '#c41e3a', border: '2px solid #c41e3a',
            color: '#fff', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
        >Sign In</button>
      </div>

      {/* Profile card */}
      <div style={{ width: '100%', maxWidth: 520, marginBottom: 16 }}>
        <ProfileCard profile={profile} isMobile={isMobile} />
      </div>

      {/* Callsign (mobile — shown below the card since card hides it) */}
      {isMobile && (
        <div style={{ width: '100%', maxWidth: 520, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--text)' }}>{profile.callsign}</div>
          {profile.home_region && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{profile.home_region}</div>
          )}
        </div>
      )}

      {/* CTA */}
      <div style={{
        width: '100%', maxWidth: 520,
        border: '2px solid var(--border)', background: 'var(--bg-1)',
        padding: '18px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, color: 'var(--text)' }}>
          Join the Crew
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
          Sign in to connect with {profile.callsign}, track your missions together, and view full career stats.
        </div>
        <button
          onClick={onSignIn}
          style={{
            padding: '10px 28px', background: '#c41e3a', border: '2px solid #c41e3a',
            color: '#fff', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#a01830'; e.currentTarget.style.borderColor = '#a01830'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
        >
          Sign In →
        </button>
      </div>
    </div>
  );
}
