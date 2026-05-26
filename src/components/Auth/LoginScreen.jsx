import { supabase } from '@/lib/supabase.js';

export default function LoginScreen() {
  const handleDiscordLogin = () =>
    supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin },
    });

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 340, padding: '48px 40px', textAlign: 'center',
        background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 16,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
          <span style={{ color: 'var(--gold)' }}>//</span> UEE CARGO OPS
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 4 }}>
          MISSION BOARD
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 36 }}>
          v0.1 · AUTHENTICATION REQUIRED
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 36 }} />

        <button
          onClick={handleDiscordLogin}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: 8, border: 'none',
            background: '#5865F2', color: '#fff',
            fontSize: 14, fontFamily: 'var(--font-sans)', fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {/* Discord logo */}
          <svg width="20" height="16" viewBox="0 0 20 16" fill="white" aria-hidden="true">
            <path d="M16.93 1.33A16.47 16.47 0 0 0 12.86 0c-.19.34-.4.8-.55 1.16a15.24 15.24 0 0 0-4.62 0A11.83 11.83 0 0 0 7.13 0 16.54 16.54 0 0 0 3.06 1.34 17.53 17.53 0 0 0 .07 13.1a16.62 16.62 0 0 0 5.07 2.57 12.47 12.47 0 0 0 1.07-1.75 10.84 10.84 0 0 1-1.72-.83c.14-.1.28-.21.42-.32a11.84 11.84 0 0 0 10.18 0c.13.11.28.22.42.32-.55.33-1.13.6-1.73.84a12.4 12.4 0 0 0 1.07 1.74 16.57 16.57 0 0 0 5.08-2.57 17.47 17.47 0 0 0-3-11.77ZM6.68 10.71c-1 0-1.82-.92-1.82-2.05s.8-2.06 1.82-2.06 1.84.93 1.82 2.06c0 1.13-.81 2.05-1.82 2.05Zm6.64 0c-1 0-1.82-.92-1.82-2.05s.8-2.06 1.82-2.06 1.83.93 1.82 2.06c0 1.13-.8 2.05-1.82 2.05Z" />
          </svg>
          Login with Discord
        </button>

        <div style={{ marginTop: 14, fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
          ONLY YOUR DISCORD USERNAME IS USED
        </div>
      </div>
    </div>
  );
}
