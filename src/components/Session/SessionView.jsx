import { useState } from 'react';
import TypeBadge from '../shared/TypeBadge.jsx';
import { keyToLabel } from '../../utils/dateUtils.js';

const wpName = (w) => (typeof w === 'object' ? w.name : w) || '';

function PlayerSeat({ member }) {
  const color = member?.color || '#8b949e';
  const initial = (member?.callsign || '?')[0].toUpperCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: color, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)' }}>{initial}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: '#000', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>{member?.callsign}</div>
      {member?.home_region && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{member.home_region}</div>
      )}
    </div>
  );
}

function WaypointRow({ waypoint, myProfileId, onSetStatus }) {
  const myCompletion = waypoint.completions?.find(c => c.profileId === myProfileId);
  const otherCompletions = (waypoint.completions || []).filter(c => c.profileId !== myProfileId);

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#000' }}>
          <span style={{ color: 'var(--muted)' }}>↑ </span>{wpName(waypoint)}
        </span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {otherCompletions.map(c => (
            <span key={c.profileId} style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 6px',
              background: c.status === 'done' ? 'rgba(45,122,31,0.12)' : 'rgba(229,0,0,0.10)',
              border: `1.5px solid ${c.status === 'done' ? '#2D7A1F' : '#e50000'}`,
              color: c.status === 'done' ? '#2D7A1F' : '#e50000',
            }}>
              {c.profileId.slice(0, 6)} {c.status === 'done' ? '✅' : '❌'}
            </span>
          ))}
          {myProfileId && (
            <div style={{ display: 'flex', gap: 3 }}>
              <button
                onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'done' ? null : 'done')}
                style={{
                  padding: '2px 8px', cursor: 'pointer', fontSize: 12,
                  border: `1.5px solid ${myCompletion?.status === 'done' ? '#2D7A1F' : '#ccc'}`,
                  background: myCompletion?.status === 'done' ? '#2D7A1F' : '#fff',
                  color: myCompletion?.status === 'done' ? '#fff' : '#999',
                  fontWeight: myCompletion?.status === 'done' ? 800 : 400,
                }}
                title="Mark done"
              >✅</button>
              <button
                onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'failed' ? null : 'failed')}
                style={{
                  padding: '2px 8px', cursor: 'pointer', fontSize: 12,
                  border: `1.5px solid ${myCompletion?.status === 'failed' ? '#e50000' : '#ccc'}`,
                  background: myCompletion?.status === 'failed' ? '#e50000' : '#fff',
                  color: myCompletion?.status === 'failed' ? '#fff' : '#999',
                  fontWeight: myCompletion?.status === 'failed' ? 800 : 400,
                }}
                title="Mark failed"
              >❌</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionView({
  session, onBack, onAddContract, onToggleDone, onDeleteContract,
  onSetWaypointStatus, onCastRemovalVote, onWithdrawVote, onAddPlayer,
  playerColors, myProfileId, myCallsign, friends,
}) {
  const [showInvite, setShowInvite] = useState(false);
  const label = keyToLabel(session.date);
  const totalSCU = session.contracts.reduce((t, c) => t + c.cargo.reduce((s, x) => s + Number(x.scu || 0), 0), 0);

  const memberCount = session.members?.length || session.players?.length || 0;
  const threshold = Math.ceil(memberCount / 2 + 0.01);

  const sessionMemberIds = new Set((session.members || []).map(m => m.id));
  const invitableFriends = (friends || []).filter(f => !sessionMemberIds.has(f.id));

  const topMembers = (session.members || []).slice(0, Math.ceil((session.members?.length || 0) / 2));
  const bottomMembers = (session.members || []).slice(Math.ceil((session.members?.length || 0) / 2));

  const sectionLabel = {
    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, marginBottom: 6,
  };

  return (
    <div>
      {/* ── Session header ── */}
      <div style={{ padding: '16px 20px', borderBottom: '2px solid #000', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: '#fff' }}>
        <button onClick={onBack}
          style={{ border: '2px solid #000', background: '#fff', color: '#000', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.02em', textTransform: 'uppercase' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
        >← Calendar</button>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: '#000' }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.06em' }}>
            {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''} · {totalSCU.toLocaleString()} SCU
          </div>
        </div>

        <button onClick={onAddContract}
          style={{ border: '2px solid #e50000', background: '#e50000', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.borderColor = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#e50000'; e.currentTarget.style.borderColor = '#e50000'; }}
        >+ Add Contract</button>
      </div>

      {/* ── Mission Briefing Table ── */}
      <div style={{ padding: '20px 20px 0', background: '#fff', borderBottom: '2px solid #000' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {topMembers.length > 0 && (
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {topMembers.map(m => <PlayerSeat key={m.id} member={m} />)}
            </div>
          )}

          <div style={{ background: '#111', color: '#fff', border: '2px solid #000', padding: '14px 32px', textAlign: 'center', minWidth: 240 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', marginBottom: 4 }}>Mission Briefing</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {memberCount} pilot{memberCount !== 1 ? 's' : ''} · {session.contracts.length} run{session.contracts.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {bottomMembers.map(m => <PlayerSeat key={m.id} member={m} />)}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
              <button
                onClick={() => setShowInvite(v => !v)}
                style={{ width: 44, height: 44, borderRadius: '50%', border: '2px dashed #000', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#000', fontWeight: 700 }}
              >+</button>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>Invite</div>

              {showInvite && (
                <div style={{ position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '2px solid #000', minWidth: 180, zIndex: 50, boxShadow: '4px 4px 0 #000' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e5e5', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em' }}>Add Friend</div>
                  {invitableFriends.length === 0 ? (
                    <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>No friends to add</div>
                  ) : (
                    invitableFriends.map(f => (
                      <button key={f.id}
                        onClick={() => { onAddPlayer && onAddPlayer(session.id, f.id); setShowInvite(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: '#fff', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                      >
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: f.color || '#8b949e', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12 }}>{f.callsign}</span>
                      </button>
                    ))
                  )}
                  <button onClick={() => setShowInvite(false)} style={{ width: '100%', padding: '6px', border: 'none', borderTop: '1px solid #e5e5e5', background: '#f9f9f9', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 8, borderTop: '1px solid #e5e5e5' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', paddingBottom: 12, fontStyle: 'italic' }}>
            Any crew member can add contracts. You may only remove your own — others require a &gt;50% crew vote.
          </div>
        </div>
      </div>

      {/* ── Contract list ── */}
      <div style={{ padding: '16px 20px' }}>
        {session.contracts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #000', background: '#fff' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Contracts Yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Hit "Add Contract" to log your first run.</div>
          </div>
        )}

        {session.contracts.map(contract => {
          const isMine = contract.creatorId === myProfileId;
          const myVoted = contract.removalVotes?.includes(myProfileId);
          const voteCount = contract.removalVotes?.length || 0;

          return (
            <div key={contract.id}
              style={{ border: '2px solid #000', background: '#fff', padding: '14px 16px', marginBottom: 10, opacity: contract.done ? 0.55 : 1 }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <TypeBadge type={contract.type} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>
                  {contract.system}
                </span>
                {contract.creatorCallsign && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                    Posted by:{' '}
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: contract.creatorColor || '#000', fontSize: 11 }}>
                      {contract.creatorCallsign}
                    </span>
                  </span>
                )}
                <button onClick={() => onToggleDone(session.id, contract.id)}
                  title={contract.done ? 'Mark active' : 'Mark complete'}
                  style={{
                    width: 20, height: 20, flexShrink: 0,
                    border: `2px solid ${contract.done ? '#2D7A1F' : '#000'}`,
                    background: contract.done ? '#2D7A1F' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {contract.done && <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>✓</span>}
                </button>
              </div>

              <div style={{ height: 1, background: '#e5e5e5', marginBottom: 12 }} />

              {/* Pickups */}
              {contract.pickups.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={sectionLabel}>Pickups</div>
                  {contract.pickups.map((wp, i) => (
                    <WaypointRow key={wp.id || i} waypoint={wp} myProfileId={myProfileId} onSetStatus={onSetWaypointStatus || (() => {})} />
                  ))}
                </div>
              )}

              {/* Dropoffs */}
              {contract.dropoffs.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={sectionLabel}>Dropoffs</div>
                  {contract.dropoffs.map((wp, i) => (
                    <WaypointRow key={wp.id || i} waypoint={{ ...wp, completions: wp.completions }} myProfileId={myProfileId} onSetStatus={onSetWaypointStatus || (() => {})} />
                  ))}
                </div>
              )}

              {/* Cargo pills */}
              {contract.cargo.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {contract.cargo.map((c, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px',
                      background: 'rgba(229,0,0,0.07)', border: '1.5px solid #e50000', color: '#e50000', fontWeight: 700,
                    }}>
                      {c.commodity} · {c.scu} SCU
                    </span>
                  ))}
                </div>
              )}

              {/* Footer: remove actions */}
              <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {isMine ? (
                  <button onClick={() => onDeleteContract(session.id, contract.id)}
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '5px 12px', border: '2px solid #e50000', background: '#e50000', color: '#fff', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.borderColor = '#000'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#e50000'; e.currentTarget.style.borderColor = '#e50000'; }}
                  >× Remove</button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      onClick={() => myVoted ? onWithdrawVote?.(contract.id) : onCastRemovalVote?.(contract.id, session.id)}
                      style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
                        padding: '5px 12px', cursor: 'pointer',
                        border: `2px solid ${myVoted ? '#e50000' : '#999'}`,
                        background: myVoted ? 'rgba(229,0,0,0.05)' : '#fff',
                        color: myVoted ? '#e50000' : '#666',
                      }}
                    >
                      Vote Remove ({voteCount} / {threshold})
                    </button>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', fontStyle: 'italic' }}>
                      Contracts require majority vote to remove unless you're the owner.
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
