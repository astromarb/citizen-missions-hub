import { useState } from 'react';
import TypeBadge from '../shared/TypeBadge.jsx';
import { keyToLabel } from '../../utils/dateUtils.js';

const wpName = (w) => (typeof w === 'object' ? w.name : w) || '';

function PlayerSeat({ member }) {
  const color = member?.color || '#8b949e';
  const initial = (member?.callsign || '?')[0].toUpperCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {member?.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.callsign}
          style={{ width: 50, height: 50, borderRadius: '50%', border: `2px solid ${color}`, objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 50, height: 50, borderRadius: '50%',
          background: color, border: `2px solid #000`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)' }}>{initial}</span>
        </div>
      )}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
        color: '#000', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center',
      }}>{member?.callsign}</div>
      {member?.home_region && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginTop: -4,
        }}>{member.home_region}</div>
      )}
    </div>
  );
}

function WaypointRow({ waypoint, myProfileId, members, onSetStatus }) {
  const myCompletion = waypoint.completions?.find(c => c.profileId === myProfileId);
  const otherCompletions = (waypoint.completions || []).filter(c => c.profileId !== myProfileId);

  const memberMap = {};
  (members || []).forEach(m => { memberMap[m.id] = m; });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <span style={{ color: '#888', fontSize: 12, flexShrink: 0 }}>↑</span>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: '#c41e3a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {wpName(waypoint)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {otherCompletions.map(c => {
          const m = memberMap[c.profileId];
          const label = m?.callsign || c.profileId.slice(0, 6);
          const col = m?.color || '#888';
          const done = c.status === 'done';
          return (
            <span key={c.profileId} style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 7px',
              background: done ? 'rgba(45,134,89,0.1)' : 'rgba(196,30,58,0.08)',
              border: `1.5px solid ${done ? '#2d8659' : '#c41e3a'}`,
              color: done ? '#2d8659' : '#c41e3a',
              fontWeight: 600,
            }}>
              <span style={{ color: col }}>■</span> {label} {done ? '✅' : '❌'}
            </span>
          );
        })}

        {myProfileId && (
          <div style={{ display: 'flex', gap: 3 }}>
            <button
              onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'done' ? null : 'done')}
              style={{
                width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid #000`,
                background: myCompletion?.status === 'done' ? '#2d8659' : '#fff',
                color: myCompletion?.status === 'done' ? '#fff' : '#666',
                fontWeight: 700, fontSize: 13,
              }}
              title="Mark done"
            >✓</button>
            <button
              onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'failed' ? null : 'failed')}
              style={{
                width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${myCompletion?.status === 'failed' ? '#c41e3a' : '#ccc'}`,
                background: 'transparent',
                color: '#c41e3a',
                fontWeight: 700, fontSize: 13,
              }}
              title="Mark failed"
            >✕</button>
          </div>
        )}
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
  const members = session.members || [];

  const sessionMemberIds = new Set(members.map(m => m.id));
  const invitableFriends = (friends || []).filter(f => !sessionMemberIds.has(f.id));

  const topMembers = members.slice(0, Math.ceil(members.length / 2));
  const bottomMembers = members.slice(Math.ceil(members.length / 2));

  const sectionLbl = {
    fontFamily: 'var(--font-display)',
    fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: 8,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Session header bar ── */}
      <div style={{
        background: '#777',
        padding: '14px 24px',
        borderBottom: '2px solid #000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <button onClick={onBack}
            style={{
              border: '2px solid #000', background: '#fff', color: '#000',
              padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
          >← Calendar</button>

          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
              color: '#000', letterSpacing: '-0.01em',
            }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#444', marginTop: 2 }}>
              {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''} · {totalSCU.toLocaleString()} SCU
            </div>
          </div>
        </div>

        <button onClick={onAddContract}
          style={{
            background: '#c41e3a', border: '2px solid #000', color: '#fff',
            padding: '10px 20px', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#a01830'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#c41e3a'; }}
        >+ Add Contract</button>
      </div>

      {/* ── Grey content area ── */}
      <div style={{
        background: '#888',
        flex: 1,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>

        {/* ── Mission Briefing card ── */}
        <div style={{
          background: '#fff',
          border: '2px solid #000',
          padding: '24px 28px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: '#555',
            marginBottom: 6,
          }}>Mission Briefing</div>

          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 12, color: '#666', marginBottom: 20, lineHeight: 1.6,
          }}>
            {label} · {memberCount} pilot{memberCount !== 1 ? 's' : ''} · {session.contracts.length} run{session.contracts.length !== 1 ? 's' : ''}
          </div>

          {/* Pilots row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 20 }}>
            {topMembers.map(m => <PlayerSeat key={m.id} member={m} />)}
          </div>

          {(bottomMembers.length > 0 || true) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-start' }}>
              {bottomMembers.map(m => <PlayerSeat key={m.id} member={m} />)}

              {/* Invite button */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setShowInvite(v => !v)}
                  style={{
                    width: 50, height: 50, borderRadius: '50%',
                    border: '2px dashed #000', background: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: '#000', fontWeight: 700,
                  }}
                >+</button>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555',
                }}>Invite</div>

                {showInvite && (
                  <div style={{
                    position: 'absolute', top: 62, left: '50%', transform: 'translateX(-50%)',
                    background: '#fff', border: '2px solid #000', minWidth: 190, zIndex: 50,
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
                  }}>
                    <div style={{
                      padding: '8px 12px', borderBottom: '1px solid #e5e5e5',
                      fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
                      color: '#888', letterSpacing: '0.08em',
                    }}>Add to Session</div>
                    {invitableFriends.length === 0 ? (
                      <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#888' }}>
                        No friends to add
                      </div>
                    ) : (
                      invitableFriends.map(f => (
                        <button key={f.id}
                          onClick={() => { onAddPlayer?.(session.id, f.id); setShowInvite(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '9px 12px', border: 'none', background: '#fff',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                        >
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: f.color || '#8b949e', flexShrink: 0, border: '2px solid #000' }} />
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{f.callsign}</span>
                        </button>
                      ))
                    )}
                    <button onClick={() => setShowInvite(false)}
                      style={{
                        width: '100%', padding: '7px', border: 'none', borderTop: '1px solid #e5e5e5',
                        background: '#f5f5f5', cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 10, color: '#888',
                      }}>Close</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{
            borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 4,
            fontFamily: 'var(--font-sans)', fontSize: 12, fontStyle: 'italic', color: '#888',
          }}>
            Any crew member can add contracts. You may only remove your own — others require a &gt;50% crew vote.
          </div>
        </div>

        {/* ── Contract list ── */}
        {session.contracts.length === 0 && (
          <div style={{
            background: '#fff', border: '2px dashed #000',
            padding: '50px 20px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8, textTransform: 'uppercase' }}>No Contracts Yet</div>
            <div style={{ color: '#888', fontSize: 13, fontFamily: 'var(--font-sans)' }}>Hit "+ Add Contract" to log your first run.</div>
          </div>
        )}

        {session.contracts.map(contract => {
          const isMine = contract.creatorId === myProfileId;
          const myVoted = contract.removalVotes?.includes(myProfileId);
          const voteCount = contract.removalVotes?.length || 0;

          return (
            <div key={contract.id} style={{
              background: '#fff',
              border: '2px solid #000',
              padding: '18px 20px',
              opacity: contract.done ? 0.6 : 1,
            }}>
              {/* ── Contract header ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
                  <TypeBadge type={contract.type} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                    color: '#000', letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    {contract.system}
                  </span>
                  {contract.creatorCallsign && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#888' }}>
                      Posted by:{' '}
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        color: contract.creatorColor || '#000', fontSize: 11,
                      }}>
                        {contract.creatorCallsign}
                      </span>
                    </span>
                  )}
                </div>

                {/* Done checkbox */}
                <button
                  onClick={() => onToggleDone(session.id, contract.id)}
                  title={contract.done ? 'Mark active' : 'Mark complete'}
                  style={{
                    width: 24, height: 24, flexShrink: 0,
                    border: `2px solid ${contract.done ? '#2d8659' : '#000'}`,
                    background: contract.done ? '#2d8659' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {contract.done && (
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>✓</span>
                  )}
                </button>
              </div>

              <div style={{ height: 1, background: '#e5e5e5', marginBottom: 14 }} />

              {/* ── Pickups ── */}
              {contract.pickups.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={sectionLbl}>Pickups</div>
                  {contract.pickups.map((wp, i) => (
                    <WaypointRow
                      key={wp.id || i}
                      waypoint={wp}
                      myProfileId={myProfileId}
                      members={members}
                      onSetStatus={onSetWaypointStatus || (() => {})}
                    />
                  ))}
                </div>
              )}

              {/* ── Dropoffs ── */}
              {contract.dropoffs.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={sectionLbl}>Dropoffs</div>
                  {contract.dropoffs.map((wp, i) => (
                    <WaypointRow
                      key={wp.id || i}
                      waypoint={wp}
                      myProfileId={myProfileId}
                      members={members}
                      onSetStatus={onSetWaypointStatus || (() => {})}
                    />
                  ))}
                </div>
              )}

              {/* ── Cargo pills ── */}
              {contract.cargo.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {contract.cargo.map((c, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '2px solid #c41e3a',
                      color: '#c41e3a',
                      letterSpacing: '0.04em',
                    }}>
                      {c.commodity} · {c.scu} SCU
                    </span>
                  ))}
                </div>
              )}

              {/* ── Footer ── */}
              <div style={{
                borderTop: '1px solid #ddd',
                paddingTop: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                {isMine ? (
                  <button
                    onClick={() => onDeleteContract(session.id, contract.id)}
                    style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      padding: '6px 14px',
                      border: '2px solid #c41e3a',
                      background: '#c41e3a',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.borderColor = '#000'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
                  >× Remove</button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <button
                      onClick={() => myVoted
                        ? onWithdrawVote?.(contract.id)
                        : onCastRemovalVote?.(contract.id, session.id)}
                      style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        padding: '6px 14px', cursor: 'pointer',
                        border: `2px solid ${myVoted ? '#c41e3a' : '#bbb'}`,
                        background: 'transparent',
                        color: myVoted ? '#c41e3a' : '#888',
                      }}
                    >
                      Vote Remove ({voteCount} / {threshold})
                    </button>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: '#aaa', fontStyle: 'italic',
                    }}>
                      Requires majority vote to remove.
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
