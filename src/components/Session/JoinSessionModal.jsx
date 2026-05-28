import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';

export default function JoinSessionModal({ token, myProfileId, onJoined, onDismiss }) {
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [joining, setJoining]   = useState(false);
  const [err, setErr]           = useState(null);

  useEffect(() => {
    supabase.rpc('get_session_preview_by_token', { p_token: token })
      .then(({ data, error }) => {
        if (error || !data?.length) setErr('Invite link is invalid or the session no longer exists.');
        else setPreview(data[0]);
        setLoading(false);
      });
  }, [token]);

  const handleJoin = async () => {
    if (!preview || !myProfileId) return;
    setJoining(true);
    const { error } = await supabase.from('session_players').insert({
      session_id: preview.session_id,
      profile_id: myProfileId,
    });
    if (error && error.code !== '23505') {
      setErr('Could not join session. Please try again.');
      setJoining(false);
      return;
    }
    onJoined(preview.session_id);
  };

  const dateLabel = preview
    ? new Date(preview.session_date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-1)', border: '2px solid #c41e3a',
        padding: '32px 28px', width: 380, maxWidth: '100%',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
          textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text)', marginBottom: 6,
        }}>Session Invite</div>
        <div style={{ height: 2, background: '#c41e3a', marginBottom: 22 }} />

        {loading && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
            Loading…
          </div>
        )}

        {err && !loading && (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#c41e3a', marginBottom: 20, lineHeight: 1.5 }}>
              {err}
            </div>
            <button onClick={onDismiss} style={btnStyle('muted')}>Close</button>
          </>
        )}

        {!loading && !err && preview && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                You've been invited to a session
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>
                {dateLabel}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
                Created by{' '}
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>{preview.creator_callsign}</span>
                <br />
                {preview.member_count} pilot{preview.member_count !== 1 ? 's' : ''} currently enrolled
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleJoin}
                disabled={joining}
                style={btnStyle('primary', joining)}
              >
                {joining ? 'Joining…' : 'Accept & Join'}
              </button>
              <button onClick={onDismiss} style={btnStyle('muted')}>Decline</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function btnStyle(variant, disabled = false) {
  const base = {
    padding: '10px 18px', cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '0.06em', border: '2px solid',
    opacity: disabled ? 0.7 : 1,
  };
  if (variant === 'primary') return { ...base, background: '#c41e3a', borderColor: '#c41e3a', color: '#fff', flex: 1 };
  return { ...base, background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' };
}
