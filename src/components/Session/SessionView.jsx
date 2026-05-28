import { useState, useEffect } from 'react';
import TypeBadge from '../shared/TypeBadge.jsx';
import { keyToLabel } from '../../utils/dateUtils.js';

const wpName = (w) => (typeof w === 'object' ? w.name : w) || '';

function SessionTimer({ session, onStart, onPause, onResume, onEnd }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!session.startedAt || session.endedAt) return;
    if (session.pausedAt) return; // paused, no tick
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session.startedAt, session.pausedAt, session.endedAt]);

  const formatDuration = (ms) => {
    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
    return `${m}m ${String(sec).padStart(2,'0')}s`;
  };

  let elapsed = 0;
  if (session.startedAt) {
    const end = session.endedAt ? new Date(session.endedAt).getTime() : now;
    const paused = session.pausedAt
      ? (session.totalPausedMs || 0) + (now - new Date(session.pausedAt).getTime())
      : (session.totalPausedMs || 0);
    elapsed = end - new Date(session.startedAt).getTime() - paused;
  }

  const isPaused = !!session.pausedAt;
  const isEnded = !!session.endedAt;
  const isStarted = !!session.startedAt;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {isStarted && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
          color: isEnded ? '#2d8659' : isPaused ? '#ff9800' : '#fff',
          letterSpacing: '0.06em',
          background: '#000', padding: '4px 12px', border: '2px solid #333',
        }}>
          ⏱ {formatDuration(elapsed)}
          {isPaused && <span style={{ fontSize: 10, marginLeft: 6, color: '#ff9800' }}>PAUSED</span>}
          {isEnded && <span style={{ fontSize: 10, marginLeft: 6, color: '#2d8659' }}>ENDED</span>}
        </div>
      )}

      {!isStarted && (
        <button onClick={onStart} style={{
          background: '#2d8659', border: '2px solid #000', color: '#fff',
          padding: '8px 16px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>▶ Start Session</button>
      )}

      {isStarted && !isEnded && !isPaused && (
        <button onClick={onPause} style={{
          background: '#ff9800', border: '2px solid #000', color: '#fff',
          padding: '8px 16px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>⏸ Pause</button>
      )}

      {isStarted && !isEnded && isPaused && (
        <button onClick={onResume} style={{
          background: '#0066cc', border: '2px solid #000', color: '#fff',
          padding: '8px 16px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>▶ Resume</button>
      )}

      {isStarted && !isEnded && (
        <button onClick={onEnd} style={{
          background: 'transparent', border: '2px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)',
          padding: '8px 14px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c41e3a'; e.currentTarget.style.color = '#c41e3a'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >■ End</button>
      )}
    </div>
  );
}

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
          background: color, border: `2px solid var(--border)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)' }}>{initial}</span>
        </div>
      )}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
        color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center',
      }}>{member?.callsign}</div>
      {member?.home_region && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
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
        <span style={{ color: 'var(--muted)', fontSize: 12, flexShrink: 0 }}>↑</span>
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
          const icon = c.status === 'done' ? '✅' : c.status === 'picked_up' ? '🟠' : '❌';
          const borderCol = c.status === 'done' ? '#2d8659' : c.status === 'picked_up' ? '#ff9800' : '#c41e3a';
          return (
            <span key={c.profileId} style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 7px',
              border: `1.5px solid ${borderCol}`,
              color: borderCol, fontWeight: 600,
            }}>
              <span style={{ color: col }}>■</span> {label} {icon}
            </span>
          );
        })}

        {myProfileId && (
          <div style={{ display: 'flex', gap: 3 }}>
            {/* Orange circle — Picked Up */}
            <button
              onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'picked_up' ? null : 'picked_up')}
              title="Mark picked up / in transit"
              style={{
                width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                border: `2px solid ${myCompletion?.status === 'picked_up' ? '#ff9800' : '#ccc'}`,
                background: myCompletion?.status === 'picked_up' ? '#ff9800' : 'transparent',
                color: myCompletion?.status === 'picked_up' ? '#fff' : '#bbb',
                fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >●</button>
            {/* Green check — Delivered/Done */}
            <button
              onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'done' ? null : 'done')}
              title="Mark delivered / done"
              style={{
                width: 28, height: 28, cursor: 'pointer',
                border: `2px solid var(--border)`,
                background: myCompletion?.status === 'done' ? '#2d8659' : 'var(--bg-1)',
                color: myCompletion?.status === 'done' ? '#fff' : 'var(--muted)',
                fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✓</button>
            {/* Red X — Failed */}
            <button
              onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'failed' ? null : 'failed')}
              title="Mark failed"
              style={{
                width: 28, height: 28, cursor: 'pointer',
                border: `2px solid ${myCompletion?.status === 'failed' ? '#c41e3a' : '#ccc'}`,
                background: 'transparent',
                color: myCompletion?.status === 'failed' ? '#c41e3a' : '#bbb',
                fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
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
  onStartSession, onPauseSession, onResumeSession, onEndSession,
  onDeleteSession, onUpdateSession,
  playerColors, myProfileId, myCallsign, friends,
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(session.date);
  const [dateError, setDateError] = useState(null);
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
              border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)',
              padding: '6px 14px', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
          >← Calendar</button>

          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
              color: 'var(--text)', letterSpacing: '-0.01em',
            }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''} · {totalSCU.toLocaleString()} SCU
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SessionTimer
            session={session}
            onStart={() => onStartSession?.(session.id)}
            onPause={() => onPauseSession?.(session.id)}
            onResume={() => onResumeSession?.(session.id)}
            onEnd={() => onEndSession?.(session.id)}
          />
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

          {/* Edit date inline */}
          {editingDate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="date" value={newDate} onChange={e => { setNewDate(e.target.value); setDateError(null); }}
                  style={{ padding: '6px 10px', border: `2px solid ${dateError ? '#c41e3a' : '#000'}`, background: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none' }} />
                <button onClick={async () => {
                  setDateError(null);
                  const ok = await onUpdateSession?.(session.id, { date: newDate });
                  if (ok === false) setDateError('Could not save — try a different date.');
                  else setEditingDate(false);
                }}
                  style={{ padding: '6px 12px', background: '#2d8659', border: '2px solid #000', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11 }}>
                  Save
                </button>
                <button onClick={() => { setEditingDate(false); setNewDate(session.date); setDateError(null); }}
                  style={{ padding: '6px 12px', background: 'transparent', border: '2px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11 }}>
                  Cancel
                </button>
              </div>
              {dateError && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6b6b' }}>{dateError}</div>}
            </div>
          ) : (
            <button onClick={() => setEditingDate(true)}
              style={{ padding: '8px 12px', background: 'transparent', border: '2px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            >Edit Date</button>
          )}

          {/* Delete session */}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              style={{ padding: '8px 12px', background: 'transparent', border: '2px solid rgba(196,30,58,0.4)', color: 'rgba(196,30,58,0.6)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(196,30,58,0.6)'; e.currentTarget.style.borderColor = 'rgba(196,30,58,0.4)'; }}
            >Delete</button>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#fff', opacity: 0.7 }}>Confirm?</span>
              <button onClick={() => onDeleteSession?.(session.id)}
                style={{ padding: '6px 12px', background: '#c41e3a', border: '2px solid #c41e3a', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                Yes, Delete
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ padding: '6px 12px', background: 'transparent', border: '2px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11 }}>
                Cancel
              </button>
            </div>
          )}
        </div>
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
          background: 'var(--bg-1)',
          border: '2px solid var(--border)',
          padding: '24px 28px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)',
            marginBottom: 6,
          }}>Mission Briefing</div>

          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6,
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
                    border: '2px dashed var(--border)', background: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: 'var(--text)', fontWeight: 700,
                  }}
                >+</button>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)',
                }}>Invite</div>

                {showInvite && (
                  <div style={{
                    position: 'absolute', top: 62, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-1)', border: '2px solid var(--border)', width: 220, zIndex: 50,
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
                  }}>
                    <div style={{
                      padding: '8px 12px', borderBottom: '1px solid var(--bg-3)',
                      fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
                      color: 'var(--muted)', letterSpacing: '0.08em',
                    }}>Add to Session</div>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--bg-3)' }}>
                      <input
                        autoFocus
                        value={inviteQuery}
                        onChange={e => setInviteQuery(e.target.value)}
                        placeholder="Search pilot…"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '6px 8px', border: '2px solid var(--border)',
                          background: 'var(--bg-0)', color: 'var(--text)',
                          fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none',
                        }}
                      />
                    </div>
                    {(() => {
                      const filtered = invitableFriends.filter(f =>
                        inviteQuery.trim() === '' || f.callsign?.toLowerCase().includes(inviteQuery.toLowerCase())
                      );
                      return filtered.length === 0 ? (
                        <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                          {invitableFriends.length === 0 ? 'No friends to add' : 'No match'}
                        </div>
                      ) : (
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                          {filtered.map(f => (
                            <button key={f.id}
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => { onAddPlayer?.(session.id, f.id); setShowInvite(false); setInviteQuery(''); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                padding: '9px 12px', border: 'none', background: 'var(--bg-1)',
                                cursor: 'pointer', textAlign: 'left',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-1)'; }}
                            >
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: f.color || '#8b949e', flexShrink: 0, border: '2px solid var(--border)' }} />
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{f.callsign}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    <button onClick={() => { setShowInvite(false); setInviteQuery(''); }}
                      style={{
                        width: '100%', padding: '7px', border: 'none', borderTop: '1px solid var(--bg-3)',
                        background: 'var(--bg-2)', cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
                      }}>Close</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{
            borderTop: '1px solid var(--bg-3)', paddingTop: 12, marginTop: 4,
            fontFamily: 'var(--font-sans)', fontSize: 12, fontStyle: 'italic', color: 'var(--muted)',
          }}>
            Any crew member can add contracts. You may only remove your own — others require a &gt;50% crew vote.
          </div>
        </div>

        {/* ── Contract list ── */}
        {session.contracts.length === 0 && (
          <div style={{
            background: 'var(--bg-1)', border: '2px dashed var(--border)',
            padding: '50px 20px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8, textTransform: 'uppercase' }}>No Contracts Yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>Hit "+ Add Contract" to log your first run.</div>
          </div>
        )}

        {session.contracts.map(contract => {
          const isMine = contract.creatorId === myProfileId;
          const myVoted = contract.removalVotes?.includes(myProfileId);
          const voteCount = contract.removalVotes?.length || 0;

          return (
            <div key={contract.id} style={{
              background: 'var(--bg-1)',
              border: '2px solid var(--border)',
              padding: '18px 20px',
              opacity: contract.done ? 0.6 : 1,
            }}>
              {/* ── Contract header ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
                  <TypeBadge type={contract.type} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                    color: 'var(--text)', letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    {contract.system}
                  </span>
                  {contract.payout > 0 && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2d8659', fontWeight: 700,
                      background: 'rgba(45,134,89,0.08)', border: '1.5px solid #2d8659',
                      padding: '2px 8px',
                    }}>
                      {contract.payout.toLocaleString()} aUEC
                    </span>
                  )}
                  {contract.creatorCallsign && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                      Posted by:{' '}
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        color: contract.creatorColor || 'var(--text)', fontSize: 11,
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

              <div style={{ height: 1, background: 'var(--bg-3)', marginBottom: 14 }} />

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
                    <div key={i} style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '2px solid #c41e3a',
                      display: 'flex', flexDirection: 'column', gap: 2,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                        color: '#c41e3a', letterSpacing: '0.04em',
                      }}>
                        {c.commodity} · {c.scu} SCU
                      </span>
                      {(c.fromLocation || c.toLocation) && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--muted)', letterSpacing: '0.04em',
                        }}>
                          {c.fromLocation || '?'} → {c.toLocation || '?'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Footer ── */}
              <div style={{
                borderTop: '1px solid var(--bg-3)',
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
                      color: 'var(--muted)', fontStyle: 'italic',
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
