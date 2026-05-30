import { supabase } from '@/lib/supabase.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';

const FEATURES = [
  { icon: '◎', title: 'Mission Board', desc: 'Create and track hauling, salvage, medical, trading and more — all in one crew hub.' },
  { icon: '◈', title: 'Session Tracking', desc: 'Log live sessions with real-time cargo, waypoints and payout across your whole crew.' },
  { icon: '★', title: 'Leaderboards', desc: 'See who\'s hauled the most SCU, earned the most aUEC, or logged the most sessions.' },
  { icon: '⊞', title: 'Shareable Links', desc: 'Share a session link — anyone can view live mission status, no account required.' },
];

export default function LoginScreen({ joinToken }) {
  const isMobile = useIsMobile();
  const handleDiscordLogin = () =>
    supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.href },
    });

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f0f0f0', display: 'flex', flexDirection: 'column' }}>
      {/* Red top stripe */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#c41e3a', zIndex: 100 }} />

      {/* Header */}
      <div style={{ padding: isMobile ? '28px 20px 0' : '36px 48px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 20 : 26, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>CITIZEN</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 9 : 10, letterSpacing: '0.2em', color: '#c41e3a', textTransform: 'uppercase', marginTop: 3 }}>MISSIONS HUB</div>
        </div>
        <button onClick={handleDiscordLogin}
          style={{ padding: '8px 20px', border: '2px solid #5865F2', background: 'transparent', color: '#5865F2', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#5865F2'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5865F2'; }}>
          Sign In
        </button>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '40px 20px' : '60px 48px', maxWidth: 860, margin: '0 auto', width: '100%', textAlign: 'center' }}>

        {joinToken && (
          <div style={{ marginBottom: 24, padding: '10px 18px', border: '1.5px solid #c41e3a', background: 'rgba(196,30,58,0.08)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c41e3a', letterSpacing: '0.06em' }}>
            You were invited to a session — sign in to join the crew
          </div>
        )}

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 9 : 10, color: '#c41e3a', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
          Star Citizen Crew Ops
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 32 : 52, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 20, color: '#fff' }}>
          Coordinate your<br />crew missions.
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: isMobile ? 14 : 16, color: '#888', lineHeight: 1.7, maxWidth: 520, marginBottom: 36 }}>
          Track cargo runs, log live sessions, share mission status — built for Star Citizen orgs, wings and crews.
        </p>

        <button onClick={handleDiscordLogin}
          style={{ padding: '14px 36px', border: '2px solid #5865F2', background: '#5865F2', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; e.currentTarget.style.borderColor = '#5865F2'; }}>
          <svg width="20" height="16" viewBox="0 0 20 16" fill="white"><path d="M16.93 1.33A16.47 16.47 0 0 0 12.86 0c-.19.34-.4.8-.55 1.16a15.24 15.24 0 0 0-4.62 0A11.83 11.83 0 0 0 7.13 0 16.54 16.54 0 0 0 3.06 1.34 17.53 17.53 0 0 0 .07 13.1a16.62 16.62 0 0 0 5.07 2.57 12.47 12.47 0 0 0 1.07-1.75 10.84 10.84 0 0 1-1.72-.83c.14-.1.28-.21.42-.32a11.84 11.84 0 0 0 10.18 0c.13.11.28.22.42.32-.55.33-1.13.6-1.73.84a12.4 12.4 0 0 0 1.07 1.74 16.57 16.57 0 0 0 5.08-2.57 17.47 17.47 0 0 0-3-11.77ZM6.68 10.71c-1 0-1.82-.92-1.82-2.05s.8-2.06 1.82-2.06 1.84.93 1.82 2.06c0 1.13-.81 2.05-1.82 2.05Zm6.64 0c-1 0-1.82-.92-1.82-2.05s.8-2.06 1.82-2.06 1.83.93 1.82 2.06c0 1.13-.8 2.05-1.82 2.05Z"/></svg>
          Login with Discord
        </button>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#555', letterSpacing: '0.04em' }}>Free · No email required · Star Citizen players only</div>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginTop: 56, width: '100%' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ border: '1.5px solid #2a2a2a', background: '#111', padding: '16px 14px', textAlign: 'left' }}>
              <div style={{ fontSize: 18, color: '#c41e3a', marginBottom: 8, lineHeight: 1 }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#666', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: isMobile ? '16px 20px' : '20px 48px', borderTop: '1px solid #1f1f1f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#444', letterSpacing: '0.06em' }}>© 2026 CITIZEN MISSIONS HUB · UEE CARGO OPS · v0.2-alpha</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#444', letterSpacing: '0.06em' }}>Not affiliated with Cloud Imperium Games</div>
      </div>
    </div>
  );
}
