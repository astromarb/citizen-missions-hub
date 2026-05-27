import { supabase } from '@/lib/supabase.js';

export default function LoginScreen() {
  const handleDiscordLogin = () =>
    supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin },
    });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* Top red line accent */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 4,
        background: '#c41e3a',
      }} />

      <div style={{ width: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        {/* Wordmark */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#fff',
            lineHeight: 1,
          }}>CITIZEN</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c41e3a',
            marginTop: 4,
          }}>MISSIONS HUB</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginTop: 8,
          }}>UEE Cargo Ops · v0.1</div>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 2, background: '#c41e3a' }} />

        {/* Card */}
        <div style={{
          width: '100%',
          background: '#fff',
          border: '2px solid #000',
          padding: '28px 24px',
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: '#555',
            marginBottom: 20,
            lineHeight: 1.6,
          }}>
            Sign in with Discord to access the crew mission board.
          </div>

          <button
            onClick={handleDiscordLogin}
            style={{
              width: '100%',
              padding: '13px 20px',
              border: '2px solid #5865F2',
              background: '#5865F2',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.borderColor = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; e.currentTarget.style.borderColor = '#5865F2'; }}
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="white" aria-hidden="true">
              <path d="M16.93 1.33A16.47 16.47 0 0 0 12.86 0c-.19.34-.4.8-.55 1.16a15.24 15.24 0 0 0-4.62 0A11.83 11.83 0 0 0 7.13 0 16.54 16.54 0 0 0 3.06 1.34 17.53 17.53 0 0 0 .07 13.1a16.62 16.62 0 0 0 5.07 2.57 12.47 12.47 0 0 0 1.07-1.75 10.84 10.84 0 0 1-1.72-.83c.14-.1.28-.21.42-.32a11.84 11.84 0 0 0 10.18 0c.13.11.28.22.42.32-.55.33-1.13.6-1.73.84a12.4 12.4 0 0 0 1.07 1.74 16.57 16.57 0 0 0 5.08-2.57 17.47 17.47 0 0 0-3-11.77ZM6.68 10.71c-1 0-1.82-.92-1.82-2.05s.8-2.06 1.82-2.06 1.84.93 1.82 2.06c0 1.13-.81 2.05-1.82 2.05Zm6.64 0c-1 0-1.82-.92-1.82-2.05s.8-2.06 1.82-2.06 1.83.93 1.82 2.06c0 1.13-.8 2.05-1.82 2.05Z" />
            </svg>
            Login with Discord
          </button>
        </div>
      </div>
    </div>
  );
}
