import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase.js';
import { typeBg, typeColor } from '../../data/contractTypes.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';

export default function GuestSessionView({ inviteToken, onSignIn }) {
  const isMobile = useIsMobile();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!inviteToken) return;
    supabase
      .from('sessions')
      .select(`
        id, date, started_at, ended_at,
        session_players ( profiles ( id, callsign, color ) ),
        contracts (
          id, type, system, done, payout, claim_cost,
          contract_waypoints ( id, kind, location_name, sort_order, waypoint_completions ( profile_id, status ) ),
          cargo_items ( id, commodity, scu, cargo_source )
        )
      `)
      .eq('invite_token', inviteToken)
      .single()
      .then(({ data, error: e }) => {
        if (e || !data) setError('Session not found or invite link has expired.');
        else setSession(data);
        setLoading(false);
      });
  }, [inviteToken]);

  const handleDiscordLogin = () =>
    supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.href },
    });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', color: '#555', fontSize: 12, letterSpacing: '0.12em' }}>LOADING SESSION…</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#f0f0f0' }}>Session Not Found</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#666' }}>{error}</div>
      <button onClick={onSignIn} style={{ padding: '10px 24px', border: '2px solid #5865F2', background: '#5865F2', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', cursor: 'pointer' }}>Sign In Instead</button>
    </div>
  );

  const d = new Date((session.date || '') + 'T12:00:00');
  const dateLabel = session.date ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
  const contracts = session.contracts || [];
  const members   = (session.session_players || []).map(sp => sp.profiles).filter(Boolean);
  const doneCount = contracts.filter(c => c.done).length;
  const isActive  = !!session.started_at && !session.ended_at;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f0f0f0' }}>
      {/* Red top stripe */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#c41e3a', zIndex: 100 }} />

      {/* Header */}
      <div style={{ background: '#111', borderBottom: '2px solid #222', padding: isMobile ? '14px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 3 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, letterSpacing: '0.18em', color: '#c41e3a', textTransform: 'uppercase', marginBottom: 2 }}>CITIZEN MISSIONS HUB</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 16 : 20, letterSpacing: '-0.01em' }}>
              Session · {dateLabel}
            </div>
            {isActive && (
              <div style={{ padding: '2px 8px', background: 'rgba(45,134,89,0.15)', border: '1.5px solid #2d8659', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2d8659', letterSpacing: '0.1em', textTransform: 'uppercase' }}>● LIVE</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#555', display: isMobile ? 'none' : 'block' }}>GUEST VIEW · READ ONLY</div>
          <button onClick={handleDiscordLogin}
            style={{ padding: '8px 16px', border: '2px solid #5865F2', background: '#5865F2', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.04em', flexShrink: 0 }}>
            Sign In to Join
          </button>
        </div>
      </div>

      {/* Guest banner */}
      <div style={{ background: 'rgba(196,30,58,0.06)', borderBottom: '1px solid rgba(196,30,58,0.2)', padding: '8px 24px', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#888', textAlign: 'center', letterSpacing: '0.06em' }}>
        You are viewing this session as a guest. Sign in with Discord to join the crew and interact with missions.
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 24px' }}>

        {/* Crew + summary */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ border: '1.5px solid #2a2a2a', background: '#111', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Crew</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, background: m.color || '#555', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.callsign}</span>
                </div>
              ))}
              {members.length === 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#555' }}>No crew yet</span>}
            </div>
          </div>
          <div style={{ border: '1.5px solid #2a2a2a', background: '#111', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Progress</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: doneCount === contracts.length && contracts.length > 0 ? '#2d8659' : '#f0f0f0' }}>
              {doneCount} <span style={{ fontSize: 14, color: '#555', fontWeight: 700 }}>/ {contracts.length}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#555', marginTop: 4 }}>contracts complete</div>
          </div>
        </div>

        {/* Contracts */}
        {contracts.length === 0 ? (
          <div style={{ border: '1.5px dashed #2a2a2a', padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#444' }}>No contracts yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {contracts.map(c => {
              const bg = typeBg(c.type);
              const col = typeColor(c.type);
              const pickups  = (c.contract_waypoints || []).filter(w => w.kind === 'pickup').sort((a,b) => a.sort_order - b.sort_order);
              const dropoffs = (c.contract_waypoints || []).filter(w => w.kind === 'dropoff').sort((a,b) => a.sort_order - b.sort_order);
              const totalSCU = (c.cargo_items || []).reduce((t, ci) => t + Number(ci.scu || 0), 0);
              return (
                <div key={c.id} style={{ border: `1.5px solid ${c.done ? '#2d8659' : '#2a2a2a'}`, background: '#111', overflow: 'hidden', opacity: c.done ? 0.7 : 1 }}>
                  {/* Type bar */}
                  <div style={{ background: bg, padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: col, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.type}</span>
                    {c.done && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2d8659', background: 'rgba(45,134,89,0.2)', padding: '2px 6px', border: '1px solid #2d8659' }}>✓ COMPLETE</span>}
                  </div>
                  <div style={{ padding: '10px 12px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {pickups.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Pickup</div>
                        {pickups.map(w => <div key={w.id} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#f0f0f0' }}>{w.location_name || '—'}</div>)}
                      </div>
                    )}
                    {dropoffs.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Dropoff</div>
                        {dropoffs.map(w => <div key={w.id} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#f0f0f0' }}>{w.location_name || '—'}</div>)}
                      </div>
                    )}
                    {totalSCU > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Cargo</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#f0f0f0' }}>{totalSCU} SCU</div>
                      </div>
                    )}
                    {c.payout > 0 && (
                      <div style={{ marginLeft: 'auto' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Payout</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#2d8659' }}>{c.payout.toLocaleString()} <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7 }}>aUEC</span></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
