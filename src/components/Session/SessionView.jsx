import { useState, useEffect } from 'react';
import TypeBadge from '../shared/TypeBadge.jsx';
import SessionChat from './SessionChat.jsx';
import { keyToLabel } from '../../utils/dateUtils.js';
import { getContractSize } from '../../utils/contractSize.js';
import { isHaulingType } from '../../data/contractTypes.js';
import { A } from '../../styles/animations.js';

const wpName = (w) => (typeof w === 'object' ? w.name : w) || '';

function SessionTimer({ session, onStart, onPause, onResume, onEnd }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!session.startedAt || session.endedAt || session.pausedAt) return;
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
  const isEnded  = !!session.endedAt;
  const isStarted = !!session.startedAt;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {isStarted && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
          color: isEnded ? '#2d8659' : isPaused ? '#ff9800' : '#fff',
          letterSpacing: '0.06em', background: '#000', padding: '4px 12px', border: '2px solid #333',
        }}>
          ⏱ {formatDuration(elapsed)}
          {isPaused && <span style={{ fontSize: 10, marginLeft: 6, color: '#ff9800' }}>PAUSED</span>}
          {isEnded  && <span style={{ fontSize: 10, marginLeft: 6, color: '#2d8659' }}>ENDED</span>}
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
        }}>⏸</button>
      )}
      {isStarted && !isEnded && isPaused && (
        <button onClick={onResume} style={{
          background: '#0066cc', border: '2px solid #000', color: '#fff',
          padding: '8px 14px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
        }}>▶</button>
      )}
      {isStarted && !isEnded && (
        <button onClick={onEnd}
          style={{
            background: 'transparent', border: '2px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)',
            padding: '8px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c41e3a'; e.currentTarget.style.color = '#c41e3a'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >■</button>
      )}
    </div>
  );
}

function PlayerSeat({ member, pending = false }) {
  const color = member?.color || '#8b949e';
  const initial = (member?.callsign || '?')[0].toUpperCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: pending ? 0.42 : 1 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {member?.avatar_url ? (
          <img src={member.avatar_url} alt={member.callsign}
            style={{ width: 50, height: 50, borderRadius: '50%', border: `2px solid ${pending ? '#888' : color}`, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: pending ? '#666' : color,
            border: `2px solid ${pending ? '#888' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)' }}>
              {pending ? '?' : initial}
            </span>
          </div>
        )}
        {pending && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}>?</div>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
        color: pending ? 'var(--muted)' : 'var(--text)',
        textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center',
      }}>{member?.callsign}</div>
    </div>
  );
}

function WaypointRow({ waypoint, myProfileId, members, onSetStatus, canEdit, kind, canEditLocation, onUpdateWaypoint, allLocations }) {
  const [editingLoc, setEditingLoc] = useState(false);
  const [locVal, setLocVal] = useState('');

  const startLocEdit  = () => { setLocVal(waypoint.name || ''); setEditingLoc(true); };
  const saveLocEdit   = () => { if (locVal) onUpdateWaypoint?.(waypoint.id, { location_name: locVal }); setEditingLoc(false); };
  const cancelLocEdit = () => setEditingLoc(false);

  const myCompletion    = waypoint.completions?.find(c => c.profileId === myProfileId);
  const otherCompletions = (waypoint.completions || []).filter(c => c.profileId !== myProfileId);
  const isPickup = kind === 'pickup';
  const countFor = (status) => (waypoint.completions || []).filter(c => c.status === status).length;

  const contrastColor = (hex) => {
    if (!hex || hex.length < 7) return '#000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000' : '#fff';
  };

  const memberMap = {};
  const myColor = (members || []).find(m => m.id === myProfileId)?.color || '#c41e3a';
  (members || []).forEach(m => { memberMap[m.id] = m; });

  const statusIcon  = (s) => s === 'loading' ? '↓' : s === 'en_route' ? '→' : s === 'picked_up' ? '🟠' : s === 'done' ? '✅' : '❌';
  const statusColor = (s) => s === 'loading' ? '#9c59d1' : s === 'en_route' ? '#0066cc' : s === 'picked_up' ? '#ff9800' : s === 'done' ? '#2d8659' : '#c41e3a';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--muted)', fontSize: 12, flexShrink: 0 }}>{isPickup ? '↑' : '↓'}</span>

        {editingLoc ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <select
              autoFocus
              value={locVal}
              onChange={e => setLocVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveLocEdit(); if (e.key === 'Escape') cancelLocEdit(); }}
              style={{
                maxWidth: 220, padding: '2px 4px',
                border: '2px solid #c41e3a', background: 'var(--bg-1)', color: '#c41e3a',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, outline: 'none',
              }}
            >
              <option value="">— pick location —</option>
              {(() => {
                const grouped = {};
                (allLocations || []).forEach(l => {
                  const key = `${l.system} → ${l.body}`;
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(l);
                });
                return Object.entries(grouped).sort().map(([groupKey, locs]) => (
                  <optgroup key={groupKey} label={groupKey}>
                    {locs.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                  </optgroup>
                ));
              })()}
            </select>
            <button onClick={saveLocEdit}
              style={{ background: '#2d8659', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 7px', fontWeight: 700, fontSize: 11 }}>✓</button>
            <button onClick={cancelLocEdit}
              style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', padding: '2px 6px', fontSize: 11 }}>✗</button>
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 13,
              color: '#c41e3a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {wpName(waypoint)}
            </span>
            {canEditLocation && (
              <button onClick={startLocEdit} title="Edit location"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                  color: 'var(--muted)', fontSize: 10, lineHeight: 1, flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                }}>✎</button>
            )}
          </span>
        )}
      </div>

      {(waypoint.completions || []).length > 0 && (
        <div style={{ paddingLeft: 18, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {(waypoint.completions || []).map(c => {
            const m = memberMap[c.profileId];
            if (!m) return null;
            const col = m.color || '#888';
            return (
              <span key={c.profileId} style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                background: col, color: contrastColor(col),
                padding: '2px 6px', letterSpacing: '0.05em', textTransform: 'uppercase',
                border: `2px solid ${col}`, whiteSpace: 'nowrap',
              }}>
                {m.callsign}
              </span>
            );
          })}
        </div>
      )}

      {myProfileId && canEdit && (
        <div style={{ paddingLeft: 18, display: 'flex', gap: 10 }}>
            {isPickup ? (
              <>
                {/* EN ROUTE */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', height: 11, lineHeight: '11px', textAlign: 'center' }}>
                    {countFor('en_route') > 0 ? `(${countFor('en_route')})` : ''}
                  </span>
                  <div style={{ width: 32, height: 32, boxSizing: 'border-box', border: `2px solid ${myCompletion?.status === 'en_route' ? myColor : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'en_route' ? null : 'en_route')}
                      title="Mark en route"
                      style={{
                        width: 28, height: 28, cursor: 'pointer', border: 'none', padding: 0,
                        clipPath: 'polygon(5% 0%, 100% 50%, 5% 100%)',
                        background: countFor('en_route') > 0 ? '#0066cc' : '#ddd',
                        color: countFor('en_route') > 0 ? '#fff' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14,
                      }}
                    >→</button>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>EN ROUTE</span>
                </div>
                {/* LOADING */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', height: 11, lineHeight: '11px', textAlign: 'center' }}>
                    {countFor('loading') > 0 ? `(${countFor('loading')})` : ''}
                  </span>
                  <button
                    onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'loading' ? null : 'loading')}
                    title="Mark loading"
                    style={{
                      width: 32, height: 32, cursor: 'pointer',
                      border: `2px solid ${myCompletion?.status === 'loading' ? myColor : '#ccc'}`,
                      background: countFor('loading') > 0 ? '#9c59d1' : 'transparent',
                      color: countFor('loading') > 0 ? '#fff' : '#bbb',
                      fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >↓</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>LOADING</span>
                </div>
                {/* PICKED UP */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', height: 11, lineHeight: '11px', textAlign: 'center' }}>
                    {countFor('picked_up') > 0 ? `(${countFor('picked_up')})` : ''}
                  </span>
                  <button
                    onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'picked_up' ? null : 'picked_up')}
                    title="Mark picked up"
                    style={{
                      width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                      border: `2px solid ${myCompletion?.status === 'picked_up' ? myColor : '#ccc'}`,
                      background: countFor('picked_up') > 0 ? '#ff9800' : 'transparent',
                      color: countFor('picked_up') > 0 ? '#fff' : '#bbb',
                      fontWeight: 700, fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >●</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>PICKED UP</span>
                </div>
              </>
            ) : (
              <>
                {/* EN ROUTE (dropoff) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', height: 11, lineHeight: '11px', textAlign: 'center' }}>
                    {countFor('en_route') > 0 ? `(${countFor('en_route')})` : ''}
                  </span>
                  <div style={{ width: 32, height: 32, boxSizing: 'border-box', border: `2px solid ${myCompletion?.status === 'en_route' ? myColor : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'en_route' ? null : 'en_route')}
                      title="Mark en route"
                      style={{
                        width: 28, height: 28, cursor: 'pointer', border: 'none', padding: 0,
                        clipPath: 'polygon(5% 0%, 100% 50%, 5% 100%)',
                        background: countFor('en_route') > 0 ? '#0066cc' : '#ddd',
                        color: countFor('en_route') > 0 ? '#fff' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14,
                      }}
                    >→</button>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>EN ROUTE</span>
                </div>
                {/* DELIVERED */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', height: 11, lineHeight: '11px', textAlign: 'center' }}>
                    {countFor('done') > 0 ? `(${countFor('done')})` : ''}
                  </span>
                  <button
                    onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'done' ? null : 'done')}
                    title="Mark delivered"
                    style={{
                      width: 32, height: 32, cursor: 'pointer',
                      border: `2px solid ${myCompletion?.status === 'done' ? myColor : 'var(--border)'}`,
                      background: countFor('done') > 0 ? '#2d8659' : 'var(--bg-1)',
                      color: countFor('done') > 0 ? '#fff' : 'var(--muted)',
                      fontWeight: 700, fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✓</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>DELIVERED</span>
                </div>
                {/* LOST */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', height: 11, lineHeight: '11px', textAlign: 'center' }}>
                    {countFor('failed') > 0 ? `(${countFor('failed')})` : ''}
                  </span>
                  <button
                    onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'failed' ? null : 'failed')}
                    title="Mark lost"
                    style={{
                      width: 32, height: 32, cursor: 'pointer',
                      border: `2px solid ${myCompletion?.status === 'failed' ? myColor : '#ccc'}`,
                      background: countFor('failed') > 0 ? '#c41e3a' : 'transparent',
                      color: countFor('failed') > 0 ? '#fff' : '#bbb',
                      fontWeight: 700, fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>LOST</span>
                </div>
              </>
            )}
        </div>
      )}
    </div>
  );
}

function RefuelingWaypointRow({ waypoint, myProfileId, members, onSetStatus, canEdit, canEditLocation, onUpdateWaypoint, allLocations }) {
  const [editingLoc, setEditingLoc] = useState(false);
  const [locVal, setLocVal] = useState('');

  const startLocEdit  = () => { setLocVal(waypoint.name || ''); setEditingLoc(true); };
  const saveLocEdit   = () => { if (locVal) onUpdateWaypoint?.(waypoint.id, { location_name: locVal }); setEditingLoc(false); };
  const cancelLocEdit = () => setEditingLoc(false);

  const myCompletion = waypoint.completions?.find(c => c.profileId === myProfileId);
  const countFor     = (status) => (waypoint.completions || []).filter(c => c.status === status).length;

  const memberMap = {};
  const myColor   = (members || []).find(m => m.id === myProfileId)?.color || '#0891b2';
  (members || []).forEach(m => { memberMap[m.id] = m; });

  const contrastColor = (hex) => {
    if (!hex || hex.length < 7) return '#000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000' : '#fff';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#0891b2', fontSize: 13, flexShrink: 0 }}>⛽</span>

        {editingLoc ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <select
              autoFocus value={locVal}
              onChange={e => setLocVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveLocEdit(); if (e.key === 'Escape') cancelLocEdit(); }}
              style={{ maxWidth: 220, padding: '2px 4px', border: '2px solid #0891b2', background: 'var(--bg-1)', color: '#0891b2', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, outline: 'none' }}
            >
              <option value="">— pick location —</option>
              {(() => {
                const grouped = {};
                (allLocations || []).forEach(l => {
                  const key = `${l.system} → ${l.body}`;
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(l);
                });
                return Object.entries(grouped).sort().map(([groupKey, locs]) => (
                  <optgroup key={groupKey} label={groupKey}>
                    {locs.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                  </optgroup>
                ));
              })()}
            </select>
            <button onClick={saveLocEdit}
              style={{ background: '#2d8659', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 7px', fontWeight: 700, fontSize: 11 }}>✓</button>
            <button onClick={cancelLocEdit}
              style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', padding: '2px 6px', fontSize: 11 }}>✗</button>
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#0891b2', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {wpName(waypoint)}
            </span>
            {canEditLocation && (
              <button onClick={startLocEdit} title="Edit location"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: 'var(--muted)', fontSize: 10, lineHeight: 1, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>✎</button>
            )}
          </span>
        )}
      </div>

      {(waypoint.completions || []).length > 0 && (
        <div style={{ paddingLeft: 22, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {(waypoint.completions || []).map(c => {
            const m = memberMap[c.profileId];
            if (!m) return null;
            const col = m.color || '#888';
            return (
              <span key={c.profileId} style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                background: col, color: contrastColor(col),
                padding: '2px 6px', letterSpacing: '0.05em', textTransform: 'uppercase',
                border: `2px solid ${col}`, whiteSpace: 'nowrap',
              }}>
                {m.callsign}
              </span>
            );
          })}
        </div>
      )}

      {myProfileId && canEdit && (
        <div style={{ paddingLeft: 22, display: 'flex', gap: 10 }}>
          {/* EN ROUTE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', height: 11, lineHeight: '11px', textAlign: 'center' }}>
              {countFor('en_route') > 0 ? `(${countFor('en_route')})` : ''}
            </span>
            <div style={{ width: 32, height: 32, boxSizing: 'border-box', border: `2px solid ${myCompletion?.status === 'en_route' ? myColor : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'en_route' ? null : 'en_route')}
                title="Mark en route"
                style={{ width: 28, height: 28, cursor: 'pointer', border: 'none', padding: 0, clipPath: 'polygon(5% 0%, 100% 50%, 5% 100%)', background: countFor('en_route') > 0 ? '#0066cc' : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}
              >→</button>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>EN ROUTE</span>
          </div>
          {/* FUELED */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#aaa', height: 11, lineHeight: '11px', textAlign: 'center' }}>
              {countFor('done') > 0 ? `(${countFor('done')})` : ''}
            </span>
            <button
              onClick={() => onSetStatus(waypoint.id, myCompletion?.status === 'done' ? null : 'done')}
              title="Mark fueled"
              style={{
                width: 32, height: 32, cursor: 'pointer',
                border: `2px solid ${myCompletion?.status === 'done' ? myColor : 'var(--border)'}`,
                background: countFor('done') > 0 ? '#0891b2' : 'var(--bg-1)',
                color: countFor('done') > 0 ? '#fff' : 'var(--muted)',
                fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >⛽</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>FUELED</span>
          </div>
        </div>
      )}
    </div>
  );
}

const SCU_SIZES        = [1, 2, 4, 8, 16, 32, 64];
const MINING_SCU_SIZES = [0.25, 0.5, 1, 2, 4];
const HAND_MINING_ORES = ['Quantainium', 'Hadanite', 'Taranite', 'Aphorite', 'Dolivine'];
const TRADE_COLOR      = '#b45309';
const SHIP_MINING_COLOR = '#ca8a04';
const SHIP_MINING_ORES = {
  'High Value': ['Quantanium', 'Bexalite', 'Laranite', 'Taranite', 'Borase'],
  'Mid Value':  ['Agricium', 'Titanite', 'Diamond', 'Hephaestanite', 'Gold'],
  'Common':     ['Copper', 'Aluminium', 'Tungsten', 'Iron', 'Corundum', 'Carbon'],
};

function MedicalPayPanel({ contractId, currentPayout, onUpdateContract }) {
  const [base,   setBase]   = useState('');
  const [tip,    setTip]    = useState('');
  const [saving, setSaving] = useState(false);

  const total = (Number(base) || 0) + (Number(tip) || 0);

  const save = async () => {
    if (!total || saving) return;
    setSaving(true);
    await onUpdateContract?.(contractId, { payout: (currentPayout || 0) + total });
    setBase(''); setTip('');
    setSaving(false);
  };

  return (
    <div style={{ border: '2px solid #dc2626', padding: '10px 12px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: '#dc2626', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Log Payment</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="number" min="0" placeholder="Base pay (aUEC)" value={base} onChange={e => setBase(e.target.value)}
          style={{ flex: 1, minWidth: 120, padding: '6px 8px', border: '1.5px solid #dc2626', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }} />
        <input type="number" min="0" placeholder="Tip (optional)" value={tip} onChange={e => setTip(e.target.value)}
          style={{ flex: 1, minWidth: 100, padding: '6px 8px', border: '1.5px solid #dc2626', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }} />
        <button onClick={save} disabled={!total || saving}
          style={{ padding: '6px 14px', background: total ? '#dc2626' : 'var(--bg-3)', border: 'none', color: total ? '#fff' : 'var(--muted)', cursor: total ? 'pointer' : 'default', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', flexShrink: 0 }}>
          {saving ? '…' : `+${total.toLocaleString()} aUEC`}
        </button>
      </div>
      {tip > 0 && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 5 }}>
          Base {Number(base).toLocaleString()} + Tip {Number(tip).toLocaleString()} = {total.toLocaleString()} aUEC
        </div>
      )}
    </div>
  );
}

function TradingPanel({ contract, sessionEnded, isSessionMember, allLocations, commodities, onAddCargoItemLive, onLogTradeSell }) {
  const [form, setForm]         = useState({ commodity: '', scu: '', buyPrice: '', fromLocation: '' });
  const [saving, setSaving]     = useState(false);
  const [sellState, setSellState] = useState({}); // cargoId → { price: '', loc: '', open: false }

  const tradeCargo = contract.cargo.filter(c => c.source === 'trade');

  const totalBought  = tradeCargo.reduce((t, c) => t + (c.scu * c.buyPrice), 0);
  const totalSold    = tradeCargo.filter(c => c.sellPrice > 0).reduce((t, c) => t + (c.scu * c.sellPrice), 0);
  const soldScu      = tradeCargo.filter(c => c.sellPrice > 0).reduce((t, c) => t + c.scu, 0);
  const totalScu     = tradeCargo.reduce((t, c) => t + c.scu, 0);
  const netProfit    = totalSold - tradeCargo.filter(c => c.sellPrice > 0).reduce((t, c) => t + (c.scu * c.buyPrice), 0);

  const canAdd = form.commodity.trim() || form.fromLocation.trim();

  const addEntry = async () => {
    if (!canAdd || saving) return;
    setSaving(true);
    await onAddCargoItemLive?.(contract.id, {
      commodity:   form.commodity.trim() || '(unknown)',
      scu:         Number(form.scu) || 0,
      source:      'trade',
      buyPrice:    Number(form.buyPrice) || 0,
      fromLocation: form.fromLocation.trim() || null,
    });
    setForm({ commodity: '', scu: '', buyPrice: '', fromLocation: '' });
    setSaving(false);
  };

  const toggleSell = (id) =>
    setSellState(p => ({ ...p, [id]: { price: '', loc: '', ...p[id], open: !p[id]?.open } }));

  const commitSell = async (cargoId) => {
    const s = sellState[cargoId];
    if (!s) return;
    await onLogTradeSell?.(cargoId, { sellPrice: Number(s.price) || 0, toLocation: s.loc || null });
    setSellState(p => ({ ...p, [cargoId]: { ...p[cargoId], open: false } }));
  };

  const grouped = {};
  (allLocations || []).forEach(l => {
    const key = `${l.system} → ${l.body}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(l);
  });

  const locationSelect = (value, onChange, placeholder) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ flex: 1, padding: '5px 6px', border: `1.5px solid ${TRADE_COLOR}`, background: 'var(--bg-1)', color: value ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none' }}>
      <option value="">{placeholder}</option>
      {Object.entries(grouped).sort().map(([gk, locs]) => (
        <optgroup key={gk} label={gk}>
          {locs.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div>
      {/* ── Trade entries table ── */}
      {tradeCargo.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {tradeCargo.map((c) => {
            const ss = sellState[c.id];
            const sold = c.sellPrice > 0;
            const profit = sold ? (c.sellPrice - c.buyPrice) * c.scu : null;
            return (
              <div key={c.id} style={{ marginBottom: 6, border: `1.5px solid ${sold ? '#2d8659' : TRADE_COLOR}`, background: 'var(--bg-2)' }}>
                {/* Summary row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: TRADE_COLOR, minWidth: 60 }}>{c.commodity}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', fontWeight: 700 }}>{c.scu} SCU</span>
                  {c.buyPrice > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c41e3a' }}>
                      ↑ {c.buyPrice.toLocaleString()} /SCU{c.fromLocation ? ` · ${c.fromLocation}` : ''}
                    </span>
                  )}
                  {sold ? (
                    <>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#2d8659' }}>
                        ↓ {c.sellPrice.toLocaleString()} /SCU{c.toLocation ? ` · ${c.toLocation}` : ''}
                      </span>
                      {profit !== null && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: profit >= 0 ? '#2d8659' : '#c41e3a', marginLeft: 'auto' }}>
                          {profit >= 0 ? '+' : ''}{profit.toLocaleString()} net
                        </span>
                      )}
                    </>
                  ) : (
                    !sessionEnded && isSessionMember && (
                      <button onClick={() => toggleSell(c.id)}
                        style={{ marginLeft: 'auto', padding: '3px 10px', border: `1.5px solid ${TRADE_COLOR}`, background: ss?.open ? TRADE_COLOR : 'transparent', color: ss?.open ? '#fff' : TRADE_COLOR, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {ss?.open ? 'Cancel' : '↓ Log Sale'}
                      </button>
                    )
                  )}
                </div>
                {/* Sell form */}
                {ss?.open && (
                  <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderTop: `1px solid var(--border)`, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', flexShrink: 0 }}>Sell price /SCU</span>
                    <input type="number" min="0" placeholder="aUEC" value={ss.price}
                      onChange={e => setSellState(p => ({ ...p, [c.id]: { ...p[c.id], price: e.target.value } }))}
                      style={{ width: 90, padding: '4px 6px', border: `1.5px solid ${TRADE_COLOR}`, background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}
                    />
                    {locationSelect(ss.loc || '', (v) => setSellState(p => ({ ...p, [c.id]: { ...p[c.id], loc: v } })), '— sell location —')}
                    <button onClick={() => commitSell(c.id)}
                      style={{ padding: '4px 12px', background: '#2d8659', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>✓ Save</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── P&L summary ── */}
      {tradeCargo.length > 0 && (
        <div style={{ display: 'flex', gap: 12, padding: '7px 10px', background: 'var(--bg-2)', border: `1.5px solid ${TRADE_COLOR}`, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{totalScu} SCU held</span>
          {totalBought > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c41e3a' }}>Invested {totalBought.toLocaleString()}</span>}
          {totalSold > 0   && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2d8659' }}>Earned {totalSold.toLocaleString()}</span>}
          {totalSold > 0 && totalBought > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: netProfit >= 0 ? '#2d8659' : '#c41e3a', marginLeft: 'auto' }}>
              Net {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* ── Add buy entry ── */}
      {!sessionEnded && isSessionMember && (
        <div style={{ border: `2px solid ${TRADE_COLOR}`, padding: '10px 12px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: TRADE_COLOR, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>↑ Log Purchase</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {/* Commodity */}
              <select value={form.commodity} onChange={e => setForm(f => ({ ...f, commodity: e.target.value }))}
                style={{ flex: 2, minWidth: 110, padding: '5px 6px', border: `1.5px solid ${TRADE_COLOR}`, background: 'var(--bg-1)', color: form.commodity ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, outline: 'none' }}>
                <option value="">— commodity —</option>
                {(commodities || []).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {/* SCU */}
              <input type="number" min="0" placeholder="SCU" value={form.scu}
                onChange={e => setForm(f => ({ ...f, scu: e.target.value }))}
                style={{ width: 70, padding: '5px 6px', border: `1.5px solid ${TRADE_COLOR}`, background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}
              />
              {/* Buy price */}
              <input type="number" min="0" placeholder="aUEC/SCU" value={form.buyPrice}
                onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))}
                style={{ width: 100, padding: '5px 6px', border: `1.5px solid ${TRADE_COLOR}`, background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {locationSelect(form.fromLocation, (v) => setForm(f => ({ ...f, fromLocation: v })), '— buy location (optional) —')}
              <button onClick={addEntry} disabled={!canAdd || saving}
                style={{ padding: '5px 14px', background: canAdd ? TRADE_COLOR : 'var(--bg-3)', border: 'none', color: canAdd ? '#fff' : 'var(--muted)', cursor: canAdd ? 'pointer' : 'default', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', flexShrink: 0 }}>
                {saving ? '…' : '+ Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SalvageSiteRow({ contractId, onAddWaypoint, allLocations }) {
  const [locVal, setLocVal] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!locVal || saving) return;
    setSaving(true);
    await onAddWaypoint?.(contractId, { kind: 'pickup', locationName: locVal, body: '' });
    setSaving(false);
  };

  const grouped = {};
  (allLocations || []).forEach(l => {
    const key = `${l.system} → ${l.body}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(l);
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#7c3aed', fontSize: 13, flexShrink: 0 }}>↑</span>
      <select
        value={locVal}
        onChange={e => setLocVal(e.target.value)}
        style={{
          flex: 1, maxWidth: 240, padding: '4px 6px',
          border: '2px solid #7c3aed', background: 'var(--bg-1)',
          color: locVal ? 'var(--text)' : 'var(--muted)',
          fontFamily: 'var(--font-sans)', fontSize: 12, outline: 'none',
        }}
      >
        <option value="">— set salvage site location —</option>
        {Object.entries(grouped).sort().map(([groupKey, locs]) => (
          <optgroup key={groupKey} label={groupKey}>
            {locs.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </optgroup>
        ))}
      </select>
      {locVal && (
        <button onClick={save} disabled={saving}
          style={{ background: '#2d8659', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 10px', fontWeight: 700, fontSize: 12 }}>
          {saving ? '…' : '✓ Set'}
        </button>
      )}
    </div>
  );
}

export default function SessionView({
  session, onBack, onAddContract, onToggleDone, onDeleteContract,
  onSetWaypointStatus, onCastRemovalVote, onWithdrawVote, onInvitePlayer,
  onStartSession, onPauseSession, onResumeSession, onEndSession,
  onDeleteSession, onUpdateSession, onUpdateContract,
  onUpdateWaypoint, onUpdateCargoItem, onAddCargoItemLive, onAddWaypointLive, onLogTradeSell,
  commodities, systemsMap,
  playerColors, myProfileId, myCallsign, friends,
  onCopyInviteLink, onLeaveSession, onRemovePlayer,
}) {
  const [showInvite, setShowInvite]       = useState(false);
  const [inviteQuery, setInviteQuery]     = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [confirmLeave, setConfirmLeave]   = useState(false);
  const [newDate, setNewDate]             = useState(session.date);
  const [dateError, setDateError]         = useState(null);
  const [editingPayoutId, setEditingPayoutId]   = useState(null);
  const [editingPayoutVal, setEditingPayoutVal] = useState('');
  const [editingCargoId, setEditingCargoId]     = useState(null);
  const [editingCargo, setEditingCargo]         = useState({ commodity: '', scu: '' });
  const [contractEditId, setContractEditId]                   = useState(null);
  const [editPanel, setEditPanel]                             = useState({ pickups: [], dropoffs: [], cargo: [] });
  const [confirmDeleteContractId, setConfirmDeleteContractId] = useState(null);
  const [confirmRemovePlayerId, setConfirmRemovePlayerId]     = useState(null);

  const label      = keyToLabel(session.date);
  const totalSCU   = session.contracts.reduce((t, c) => t + c.cargo.reduce((s, x) => s + Number(x.scu || 0), 0), 0);
  const totalPayout = session.contracts.reduce((t, c) => t + (c.payout || 0), 0);

  const memberCount     = session.members?.length || session.players?.length || 0;
  const threshold       = memberCount >= 4 ? Math.floor(memberCount / 2) : (memberCount <= 1 ? 1 : 2);
  const members         = session.members || [];
  const isSessionMember  = !!myProfileId && members.some(m => m.id === myProfileId);
  const isSessionCreator = !!myProfileId && myProfileId === session.createdBy;
  const creator          = members.find(m => m.id === session.createdBy);

  const pendingInvites    = session.pendingInvites || [];
  const sessionMemberIds  = new Set(members.map(m => m.id));
  const pendingInviteIds  = new Set(pendingInvites.map(p => p.id));
  const invitableFriends  = (friends || []).filter(f => !sessionMemberIds.has(f.id) && !pendingInviteIds.has(f.id));

  const allLocations = systemsMap
    ? Object.entries(systemsMap).flatMap(([system, locs]) =>
        locs.map(l => ({ name: typeof l === 'string' ? l : l?.name, body: l?.body || '', system }))
      ).filter(l => l.name)
    : [];
  const allCommodities = commodities || [];

  const sectionLbl = {
    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8,
  };

  const startCargoEdit = (cargo) => {
    setEditingCargoId(cargo.id);
    setEditingCargo({ commodity: cargo.commodity || '', scu: String(cargo.scu || '') });
  };
  const saveCargoEdit = (cargoId) => {
    onUpdateCargoItem?.(cargoId, { commodity: editingCargo.commodity, scu: Number(editingCargo.scu) || 0 });
    setEditingCargoId(null);
  };
  const cancelCargoEdit = () => setEditingCargoId(null);

  const openContractEdit = (contract) => {
    setContractEditId(contract.id);
    setEditPanel({
      pickups:  contract.pickups.map(wp => ({ id: wp.id, name: wpName(wp) })),
      dropoffs: contract.dropoffs.map(wp => ({ id: wp.id, name: wpName(wp) })),
      cargo:    contract.cargo.map(c => ({ id: c.id, commodity: c.commodity || '', scu: String(c.scu || '') })),
    });
  };
  const saveContractEdit = (contract) => {
    editPanel.pickups.forEach((ep, i) => {
      const orig = contract.pickups[i];
      if (orig?.id && ep.name !== wpName(orig)) onUpdateWaypoint?.(orig.id, { location_name: ep.name });
    });
    editPanel.dropoffs.forEach((ep, i) => {
      const orig = contract.dropoffs[i];
      if (orig?.id && ep.name !== wpName(orig)) onUpdateWaypoint?.(orig.id, { location_name: ep.name });
    });
    editPanel.cargo.forEach((ep, i) => {
      const orig = contract.cargo[i];
      if (orig?.id && (ep.commodity !== (orig.commodity || '') || Number(ep.scu) !== Number(orig.scu || 0)))
        onUpdateCargoItem?.(orig.id, { commodity: ep.commodity, scu: Number(ep.scu) || 0 });
    });
    setContractEditId(null);
  };
  const renderLocationOptions = () => {
    const grouped = {};
    allLocations.forEach(l => {
      const key = `${l.system} → ${l.body}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(l);
    });
    return Object.entries(grouped).sort().map(([groupKey, locs]) => (
      <optgroup key={groupKey} label={groupKey}>
        {locs.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
      </optgroup>
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Session header bar ── */}
      <div style={{
        background: '#777', padding: '14px 24px', borderBottom: '2px solid #000',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
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
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.01em' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''} · {totalSCU.toLocaleString()} SCU
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {!isSessionMember && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.7)', padding: '4px 10px',
            }}>VIEW ONLY</span>
          )}
          {isSessionMember && (
            <SessionTimer
              session={session}
              onStart={() => onStartSession?.(session.id)}
              onPause={() => onPauseSession?.(session.id)}
              onResume={() => onResumeSession?.(session.id)}
              onEnd={() => onEndSession?.(session.id)}
            />
          )}
          {isSessionMember && onCopyInviteLink && (
            <button onClick={onCopyInviteLink}
              title="Copy invite link"
              style={{
                background: 'transparent', border: '2px solid rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.6)', padding: '8px 14px', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            >🔗 Copy Invite Link</button>
          )}
          {isSessionMember && (
            <button onClick={onAddContract}
              style={{
                background: '#c41e3a', border: '2px solid #000', color: '#fff',
                padding: '10px 20px', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#a01830'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#c41e3a'; }}
            >+ Contract</button>
          )}

          {isSessionMember && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowEditPanel(v => !v); setConfirmLeave(false); setDateError(null); }}
                style={{
                  padding: '8px 12px', background: showEditPanel ? 'rgba(255,255,255,0.12)' : 'transparent',
                  border: '2px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              >EDIT</button>

              {showEditPanel && (
                <div style={{
                  position: 'absolute', top: 44, right: 0,
                  background: 'var(--bg-1)', border: '2px solid var(--border)',
                  width: 280, zIndex: 100,
                  boxShadow: '6px 6px 0 rgba(0,0,0,0.4)',
                  animation: A.pop(),
                  transformOrigin: 'top right',
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text)' }}>Session Settings</span>
                    <button onClick={() => { setShowEditPanel(false); setConfirmLeave(false); setDateError(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>

                  {isSessionCreator && (
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bg-3)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Change Date</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="date" value={newDate} onChange={e => { setNewDate(e.target.value); setDateError(null); }}
                          style={{ flex: 1, minWidth: 120, padding: '5px 8px', border: `2px solid ${dateError ? '#c41e3a' : 'var(--border)'}`, background: 'var(--bg-2)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }} />
                        <button onClick={async () => {
                          setDateError(null);
                          const ok = await onUpdateSession?.(session.id, { date: newDate });
                          if (ok === false) setDateError('Could not save');
                          else setShowEditPanel(false);
                        }}
                          style={{ padding: '5px 10px', background: '#2d8659', border: '2px solid #2d8659', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10 }}>Save</button>
                      </div>
                      {dateError && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6b6b', marginTop: 5 }}>{dateError}</div>}
                    </div>
                  )}

                  {isSessionCreator && (
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bg-3)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Crew</div>
                      {members.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--bg-2)' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: m.color || '#8b949e', flexShrink: 0, border: '2px solid var(--border)' }} />
                          <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: m.id === myProfileId ? '#c41e3a' : 'var(--text)' }}>
                            {m.callsign}{m.id === myProfileId ? ' (you)' : ''}{m.id === session.createdBy ? ' ★' : ''}
                          </span>
                          {m.id !== myProfileId && (
                            confirmRemovePlayerId === m.id ? (
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <button onClick={() => { onRemovePlayer?.(session.id, m.id); setConfirmRemovePlayerId(null); }}
                                  style={{ background: '#c41e3a', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 7px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Kick</button>
                                <button onClick={() => setConfirmRemovePlayerId(null)}
                                  style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', padding: '2px 6px', fontSize: 10 }}>✗</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmRemovePlayerId(m.id)} title={`Remove ${m.callsign}`}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c41e3a', fontSize: 14, fontWeight: 700, lineHeight: 1, padding: '0 2px' }}>×</button>
                            )
                          )}
                        </div>
                      ))}
                      <button onClick={() => { setShowEditPanel(false); setShowInvite(true); }}
                        style={{ marginTop: 8, width: '100%', padding: '6px', border: '2px dashed var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
                        + Invite Pilot
                      </button>
                    </div>
                  )}

                  <div style={{ padding: '12px 14px' }}>
                    {!confirmLeave ? (
                      <button onClick={() => setConfirmLeave(true)}
                        style={{ width: '100%', padding: '8px', border: '2px solid rgba(196,30,58,0.5)', background: 'transparent', color: '#c41e3a', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Leave Session
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>
                          {isSessionCreator && members.length > 1
                            ? 'Ownership will transfer to the next pilot.'
                            : isSessionCreator
                            ? 'You are the last member — the session will be deleted.'
                            : 'You will be removed from this session.'}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={async () => { setConfirmLeave(false); setShowEditPanel(false); await onLeaveSession?.(session.id); }}
                            style={{ flex: 1, padding: '7px', background: '#c41e3a', border: '2px solid #c41e3a', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                            Confirm
                          </button>
                          <button onClick={() => setConfirmLeave(false)}
                            style={{ flex: 1, padding: '7px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11 }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isSessionMember && (!confirmDelete ? (
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
          ))}
        </div>
      </div>

      {/* ── Content area ── */}
      <div style={{ background: '#777', flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Mission Briefing card ── */}
        <div style={{ background: 'var(--bg-1)', border: '2px solid var(--border)', padding: '14px 20px', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4,
          }}>Mission Briefing</div>

          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
            {label} · {memberCount} pilot{memberCount !== 1 ? 's' : ''} · {session.contracts.length} run{session.contracts.length !== 1 ? 's' : ''}
            {session.createdAt && (
              <span> · Created {new Date(session.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            )}
          </div>

          {/* Confirmed pilots + pending invitees + inline invite button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 14, alignItems: 'flex-start' }}>
            {members.map(m => <PlayerSeat key={m.id} member={m} />)}
            {pendingInvites.map(p => <PlayerSeat key={p.id} member={p} pending={true} />)}
            {isSessionMember && (
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setShowInvite(v => !v)}
                  style={{
                    width: 50, height: 50, borderRadius: '50%', cursor: 'pointer',
                    border: `2px dashed ${showInvite ? '#c41e3a' : 'var(--border)'}`,
                    background: showInvite ? 'rgba(196,30,58,0.06)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: showInvite ? '#c41e3a' : 'var(--muted)',
                    fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c41e3a'; e.currentTarget.style.color = '#c41e3a'; }}
                  onMouseLeave={e => { if (!showInvite) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; } }}
                >+</button>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Invite</div>

                {showInvite && (
                  <div style={{
                    position: 'absolute', top: 66, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-1)', border: '2px solid var(--border)', width: 220, zIndex: 50,
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
                    animation: A.pop(),
                    transformOrigin: 'top center',
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg-3)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em' }}>Add to Session</div>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--bg-3)' }}>
                      <input autoFocus value={inviteQuery} onChange={e => setInviteQuery(e.target.value)} placeholder="Search pilot…"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', border: '2px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }} />
                    </div>
                    {(() => {
                      const filtered = invitableFriends.filter(f => inviteQuery.trim() === '' || f.callsign?.toLowerCase().includes(inviteQuery.toLowerCase()));
                      return filtered.length === 0 ? (
                        <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                          {invitableFriends.length === 0 ? 'No friends to add' : 'No match'}
                        </div>
                      ) : (
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                          {filtered.map(f => (
                            <button key={f.id} onMouseDown={e => e.preventDefault()}
                              onClick={() => { onInvitePlayer?.(session.id, f.id); setShowInvite(false); setInviteQuery(''); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', border: 'none', background: 'var(--bg-1)', cursor: 'pointer', textAlign: 'left' }}
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
                      style={{ width: '100%', padding: '7px', border: 'none', borderTop: '1px solid var(--bg-3)', background: 'var(--bg-2)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Close</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Total aUEC */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Earned today</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: totalPayout > 0 ? '#2d8659' : 'var(--muted)' }}>
              {totalPayout.toLocaleString()} aUEC
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--bg-3)', paddingTop: 8, marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 11, fontStyle: 'italic', color: 'var(--muted)' }}>
            {isSessionMember
              ? 'Any crew member can add contracts. You may only remove your own — others require a >50% crew vote.'
              : 'You are viewing this session as a non-member. All data is read-only.'}
          </div>
        </div>

        {/* ── Contract list ── */}
        {session.contracts.length === 0 && (
          <div style={{ background: 'var(--bg-1)', border: '2px dashed var(--border)', padding: '50px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8, textTransform: 'uppercase' }}>No Contracts Yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>Hit "+ Add Contract" to log your first run.</div>
          </div>
        )}

        {[...session.contracts]
          .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
          .map(contract => {
          const isMine    = contract.creatorId === myProfileId;
          const myVoted   = contract.removalVotes?.includes(myProfileId);
          const voteCount = contract.removalVotes?.length || 0;
          const isEditingPayout = editingPayoutId === contract.id;
          const cSCU = contract.cargo.reduce((t, c) => t + Number(c.scu || 0), 0);
          const sz   = getContractSize(cSCU);
          const allBodies = [...contract.pickups, ...contract.dropoffs].map(w => w.body).filter(Boolean);
          const isLocal   = allBodies.length > 0 && new Set(allBodies).size === 1;

          return (
            <div key={contract.id} style={{
              background: 'var(--bg-1)',
              border: `2px solid ${contract.done ? '#2d8659' : 'var(--border)'}`,
              padding: contract.done ? '8px 14px' : '18px 20px',
            }}>

              {/* ── Contract header ── */}
              <div style={{
                display: 'flex',
                alignItems: contract.done ? 'center' : 'flex-start',
                gap: contract.done ? 16 : 12,
                marginBottom: contract.done ? 0 : 14,
                flexWrap: contract.done ? 'nowrap' : 'wrap',
              }}>

                {/* Left: type + size badge, edit payout link below */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TypeBadge type={contract.type} />
                    {isHaulingType(contract.type) && (
                      <span title={sz.tip} style={{
                        fontFamily: 'var(--font-display)', fontSize: contract.done ? 22 : 15, fontWeight: 800,
                        color: 'var(--text)', textDecoration: 'underline', letterSpacing: '0.02em',
                      }}>{'{ '}{sz.label}{' }'}</span>
                    )}
                  </div>
                  {isSessionMember && !isEditingPayout && !contract.done && (
                    <button
                      onClick={() => { setEditingPayoutVal(String(contract.payout || '')); setEditingPayoutId(contract.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', padding: 0, textDecoration: 'underline', textAlign: 'left' }}
                    >{contract.payout > 0 ? 'edit payout' : '+ payout'}</button>
                  )}
                </div>

                {/* Middle: separator + system + LOCAL tag + completion status */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: contract.done ? 'nowrap' : 'wrap', minWidth: 0 }}>
                  <span style={{ color: 'var(--border)', fontSize: contract.done ? 20 : 14, flexShrink: 0 }}>|</span>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: contract.done ? 800 : 700,
                    fontSize: contract.done ? 18 : 12,
                    color: 'var(--text)', letterSpacing: '0.06em', textTransform: 'uppercase',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: contract.done ? 'nowrap' : 'normal',
                    flexShrink: contract.done ? 1 : 0,
                  }}>
                    {contract.system}
                  </span>
                  {isLocal && !contract.done && contract.type !== 'Refueling' && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      border: '1.5px solid #2e7d32', color: '#2e7d32',
                      padding: '1px 5px', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>LOCAL</span>
                  )}
                  {contract.done && (
                    <>
                      <span style={{ color: '#bbb', fontSize: 16, flexShrink: 0, letterSpacing: '-0.04em' }}>——</span>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
                        color: contract.partial ? '#d97706' : '#2d8659',
                        letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}>
                        {contract.partial ? 'COMPLETE — PARTIAL' : 'COMPLETE'}
                      </span>
                    </>
                  )}
                </div>

                {/* Right: payout + Done? */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {isEditingPayout ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="number" min="0" step="1000" autoFocus
                        value={editingPayoutVal}
                        onChange={e => setEditingPayoutVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { onUpdateContract?.(contract.id, { payout: Number(editingPayoutVal) || 0 }); setEditingPayoutId(null); }
                          if (e.key === 'Escape') setEditingPayoutId(null);
                        }}
                        style={{ width: 110, padding: '3px 6px', border: '2px solid #2d8659', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none' }}
                      />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>aUEC</span>
                      <button onClick={() => { onUpdateContract?.(contract.id, { payout: Number(editingPayoutVal) || 0 }); setEditingPayoutId(null); }}
                        style={{ background: '#2d8659', border: 'none', color: '#fff', cursor: 'pointer', padding: '3px 8px', fontWeight: 700, fontSize: 11 }}>✓</button>
                      <button onClick={() => setEditingPayoutId(null)}
                        style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', padding: '3px 6px', fontSize: 11 }}>✗</button>
                    </span>
                  ) : (
                    contract.payout > 0 && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        fontSize: contract.done ? 26 : 14,
                        color: '#2d8659', background: 'rgba(45,134,89,0.08)',
                        border: '1.5px solid #2d8659',
                        padding: contract.done ? '6px 16px' : '2px 8px',
                        whiteSpace: 'nowrap',
                      }}>
                        {contract.payout.toLocaleString()} aUEC
                      </span>
                    )
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {isSessionMember && !contract.done && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Done?</span>
                    )}
                    <button
                      onClick={() => isSessionMember && onToggleDone(session.id, contract.id)}
                      title={!contract.done ? 'Mark complete' : contract.partial ? 'Click to reset' : 'Mark as partial'}
                      style={{
                        width: contract.done ? 28 : 24, height: contract.done ? 28 : 24,
                        border: `2px solid ${contract.done ? (contract.partial ? '#d97706' : '#2d8659') : '#000'}`,
                        background: contract.done ? (contract.partial ? '#d97706' : '#2d8659') : 'transparent',
                        cursor: isSessionMember ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {contract.done && <span style={{ fontSize: 14, color: '#fff', fontWeight: 800 }}>{contract.partial ? '~' : '✓'}</span>}
                    </button>
                  </div>
                </div>
              </div>

              {!contract.done && <>
              <div style={{ height: 1, background: 'var(--bg-3)', marginBottom: 14 }} />

              {/* ── Refueling Station ── */}
              {contract.type === 'Refueling' && contract.pickups.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={sectionLbl}>Refueling Station</div>
                  {contract.pickups.map((wp, i) => (
                    <RefuelingWaypointRow
                      key={wp.id || i}
                      waypoint={wp}
                      myProfileId={myProfileId}
                      members={members}
                      onSetStatus={onSetWaypointStatus || (() => {})}
                      canEdit={isSessionMember}
                      canEditLocation={isSessionCreator}
                      onUpdateWaypoint={onUpdateWaypoint}
                      allLocations={allLocations}
                    />
                  ))}
                </div>
              )}

              {/* ── Salvage Site (set location en route) ── */}
              {contract.type === 'Salvaging' && contract.pickups.length === 0 && isSessionMember && (
                <div style={{ marginBottom: 12 }}>
                  <div style={sectionLbl}>Salvage Site</div>
                  <SalvageSiteRow contractId={contract.id} onAddWaypoint={onAddWaypointLive} allLocations={allLocations} />
                </div>
              )}

              {/* ── Pickups ── */}
              {contract.type !== 'Refueling' && contract.pickups.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={sectionLbl}>Pickups</div>
                  {contract.pickups.map((wp, i) => (
                    <WaypointRow
                      key={wp.id || i}
                      waypoint={wp}
                      myProfileId={myProfileId}
                      members={members}
                      onSetStatus={onSetWaypointStatus || (() => {})}
                      canEdit={isSessionMember}
                      kind="pickup"
                      canEditLocation={isSessionCreator}
                      onUpdateWaypoint={onUpdateWaypoint}
                      allLocations={allLocations}
                    />
                  ))}
                </div>
              )}

              {/* ── Dropoffs ── */}
              {contract.type !== 'Refueling' && contract.dropoffs.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={sectionLbl}>Dropoffs</div>
                  {contract.dropoffs.map((wp, i) => (
                    <WaypointRow
                      key={wp.id || i}
                      waypoint={wp}
                      myProfileId={myProfileId}
                      members={members}
                      onSetStatus={onSetWaypointStatus || (() => {})}
                      canEdit={isSessionMember}
                      kind="dropoff"
                      canEditLocation={isSessionCreator}
                      onUpdateWaypoint={onUpdateWaypoint}
                      allLocations={allLocations}
                    />
                  ))}
                </div>
              )}

              {/* ── Cargo pills ── */}
              {contract.cargo.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {contract.cargo.map((c, i) => {
                    const isCargoEditing = editingCargoId === c.id;
                    return (
                      <div key={c.id || i}>
                        {isCargoEditing ? (
                          /* ── Cargo edit form ── */
                          <div style={{
                            padding: '8px 10px', border: '2px solid #c41e3a', background: 'var(--bg-2)',
                            display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200,
                          }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Edit Cargo</div>
                            <select
                              autoFocus
                              value={editingCargo.commodity}
                              onChange={e => setEditingCargo(v => ({ ...v, commodity: e.target.value }))}
                              style={{
                                padding: '3px 4px', border: '2px solid var(--border)',
                                background: 'var(--bg-1)', color: 'var(--text)',
                                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, outline: 'none',
                              }}
                            >
                              <option value="">— pick commodity —</option>
                              {allCommodities.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input
                                type="number" min="1" step="1"
                                value={editingCargo.scu}
                                onChange={e => setEditingCargo(v => ({ ...v, scu: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') saveCargoEdit(c.id); if (e.key === 'Escape') cancelCargoEdit(); }}
                                style={{
                                  width: 70, padding: '3px 6px', border: '2px solid var(--border)',
                                  background: 'var(--bg-1)', color: 'var(--text)',
                                  fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none',
                                }}
                              />
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>SCU</span>
                              <button onClick={() => saveCargoEdit(c.id)}
                                style={{ background: '#2d8659', border: 'none', color: '#fff', cursor: 'pointer', padding: '3px 8px', fontWeight: 700, fontSize: 11 }}>✓</button>
                              <button onClick={cancelCargoEdit}
                                style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', padding: '3px 6px', fontSize: 11 }}>✗</button>
                            </div>
                          </div>
                        ) : (
                          /* ── Normal cargo pill ── */
                          <div style={{ padding: '8px 10px', background: 'transparent', border: '2px solid #555', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 80 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em', textDecoration: 'underline' }}>
                                {c.commodity}
                              </span>
                              {isSessionCreator && c.id && (
                                <button onClick={() => startCargoEdit(c)} title="Edit cargo"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>✎</button>
                              )}
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: 'var(--muted)', lineHeight: 1 }}>
                              {c.scu} SCU
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Salvage cost summary + Add Found Cargo ── */}
              {contract.type === 'Salvaging' && (
                <div style={{ marginBottom: 14 }}>
                  {/* Cost / profit line */}
                  {(contract.claimCost > 0 || contract.refiningCost > 0 || contract.payout > 0) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--bg-3)' }}>
                      {contract.claimCost > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c41e3a' }}>
                          Claim −{contract.claimCost.toLocaleString()}
                        </span>
                      )}
                      {contract.payout > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2d8659' }}>
                          Sale +{contract.payout.toLocaleString()}
                        </span>
                      )}
                      {contract.refiningCost > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c41e3a' }}>
                          Refining −{contract.refiningCost.toLocaleString()}
                        </span>
                      )}
                      {(contract.claimCost > 0 || contract.refiningCost > 0) && contract.payout > 0 && (() => {
                        const net = contract.payout - (contract.claimCost || 0) - (contract.refiningCost || 0);
                        const perMember = memberCount > 0 ? Math.floor(net / memberCount) : 0;
                        return (
                          <>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>·</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: net >= 0 ? '#2d8659' : '#c41e3a' }}>
                              Net {net.toLocaleString()}
                            </span>
                            {memberCount > 1 && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>
                                ({perMember.toLocaleString()} / pilot)
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Found cargo pills */}
                  {contract.cargo.some(c => c.source === 'found') && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={sectionLbl}>Found Cargo</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {contract.cargo.filter(c => c.source === 'found').map((c, i) => (
                          <div key={c.id || i} style={{ padding: '6px 10px', background: 'transparent', border: '2px solid #d97706', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 72 }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.04em' }}>{c.commodity}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--muted)', lineHeight: 1 }}>{c.scu} SCU</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Salvaging quick-add ── */}
                  {isSessionMember && !session.endedAt && (
                    <div>
                      <div style={sectionLbl}>Salvaging</div>
                      <div style={{ border: '2px solid #7c3aed', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {['RMC', 'CMATS'].map(commodity => (
                          <div key={commodity} style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#7c3aed', width: 46, flexShrink: 0 }}>{commodity}</span>
                            {SCU_SIZES.map(scu => (
                              <button key={scu}
                                onClick={() => onAddCargoItemLive?.(contract.id, { commodity, scu, source: 'found' })}
                                style={{
                                  padding: '4px 7px', cursor: 'pointer',
                                  border: '1.5px solid #7c3aed', background: 'transparent', color: '#7c3aed',
                                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7c3aed'; }}
                              >+{scu}</button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Hand Mining ── */}
              {contract.type === 'Hand Mining' && (
                <div style={{ marginBottom: 14 }}>
                  {/* Mined ore pills */}
                  {contract.cargo.some(c => c.source === 'found') && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={sectionLbl}>Mined Ore</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {contract.cargo.filter(c => c.source === 'found').map((c, i) => (
                          <div key={c.id || i} style={{ padding: '6px 10px', background: 'transparent', border: '2px solid #16a34a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 72 }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: '#16a34a', letterSpacing: '0.04em' }}>{c.commodity}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--muted)', lineHeight: 1 }}>{c.scu} SCU</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Mining quick-add */}
                  {isSessionMember && !session.endedAt && (
                    <div>
                      <div style={sectionLbl}>Hand Mining</div>
                      <div style={{ border: '2px solid #16a34a', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {HAND_MINING_ORES.map(commodity => (
                          <div key={commodity} style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#16a34a', width: 86, flexShrink: 0 }}>{commodity}</span>
                            {MINING_SCU_SIZES.map(scu => (
                              <button key={scu}
                                onClick={() => onAddCargoItemLive?.(contract.id, { commodity, scu, source: 'found' })}
                                style={{ padding: '4px 7px', cursor: 'pointer', border: '1.5px solid #16a34a', background: 'transparent', color: '#16a34a', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#16a34a'; }}
                              >+{scu}</button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Trading ── */}
              {contract.type === 'Trading' && (
                <div style={{ marginBottom: 14 }}>
                  <TradingPanel
                    contract={contract}
                    sessionEnded={!!session.endedAt}
                    isSessionMember={isSessionMember}
                    allLocations={allLocations}
                    commodities={allCommodities}
                    onAddCargoItemLive={onAddCargoItemLive}
                    onLogTradeSell={onLogTradeSell}
                  />
                </div>
              )}

              {/* ── Medical ── */}
              {contract.type === 'Medical' && (
                <div style={{ marginBottom: 14 }}>
                  {contract.payout > 0 && (
                    <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(220,38,38,0.06)', border: '1.5px solid #dc2626', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#dc2626' }}>+{contract.payout.toLocaleString()} aUEC</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>logged</span>
                    </div>
                  )}
                  {isSessionMember && !session.endedAt && (
                    <MedicalPayPanel
                      contractId={contract.id}
                      currentPayout={contract.payout}
                      onUpdateContract={onUpdateContract}
                    />
                  )}
                </div>
              )}

              {/* ── Ship Mining ── */}
              {contract.type === 'Ship Mining' && (
                <div style={{ marginBottom: 14 }}>
                  {contract.cargo.some(c => c.source === 'found') && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={sectionLbl}>Mined Ore</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {contract.cargo.filter(c => c.source === 'found').map((c, i) => (
                          <div key={c.id || i} style={{ padding: '6px 10px', background: 'transparent', border: `2px solid ${SHIP_MINING_COLOR}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 72 }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: SHIP_MINING_COLOR, letterSpacing: '0.04em' }}>{c.commodity}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--muted)', lineHeight: 1 }}>{c.scu} SCU</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isSessionMember && !session.endedAt && (
                    <div>
                      <div style={sectionLbl}>Ship Mining</div>
                      <div style={{ border: `2px solid ${SHIP_MINING_COLOR}`, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.entries(SHIP_MINING_ORES).map(([tier, ores]) => (
                          <div key={tier}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: SHIP_MINING_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, opacity: 0.7 }}>{tier}</div>
                            {ores.map(commodity => (
                              <div key={commodity} style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: SHIP_MINING_COLOR, width: 100, flexShrink: 0 }}>{commodity}</span>
                                {SCU_SIZES.map(scu => (
                                  <button key={scu}
                                    onClick={() => onAddCargoItemLive?.(contract.id, { commodity, scu, source: 'found' })}
                                    style={{ padding: '4px 7px', cursor: 'pointer', border: `1.5px solid ${SHIP_MINING_COLOR}`, background: 'transparent', color: SHIP_MINING_COLOR, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}
                                    onMouseEnter={e => { e.currentTarget.style.background = SHIP_MINING_COLOR; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = SHIP_MINING_COLOR; }}
                                  >+{scu}</button>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Contract edit panel ── */}
              {contractEditId === contract.id && (
                <div style={{ border: '2px solid #0066cc', background: 'var(--bg-2)', padding: '12px 14px', marginBottom: 14, animation: A.slideDown() }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#0066cc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 700 }}>Edit Contract</div>

                  {editPanel.pickups.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={sectionLbl}>Pickup Locations</div>
                      {editPanel.pickups.map((ep, i) => (
                        <div key={ep.id || i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', width: 14, flexShrink: 0, textAlign: 'center' }}>↑</span>
                          <select
                            value={ep.name}
                            onChange={e => setEditPanel(p => ({ ...p, pickups: p.pickups.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))}
                            style={{ flex: 1, padding: '4px 6px', border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 12, outline: 'none' }}
                          >
                            <option value="">— pick location —</option>
                            {renderLocationOptions()}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {editPanel.dropoffs.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={sectionLbl}>Dropoff Locations</div>
                      {editPanel.dropoffs.map((ep, i) => (
                        <div key={ep.id || i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', width: 14, flexShrink: 0, textAlign: 'center' }}>↓</span>
                          <select
                            value={ep.name}
                            onChange={e => setEditPanel(p => ({ ...p, dropoffs: p.dropoffs.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))}
                            style={{ flex: 1, padding: '4px 6px', border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 12, outline: 'none' }}
                          >
                            <option value="">— pick location —</option>
                            {renderLocationOptions()}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {editPanel.cargo.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={sectionLbl}>Cargo</div>
                      {editPanel.cargo.map((ep, i) => (
                        <div key={ep.id || i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <select
                            value={ep.commodity}
                            onChange={e => setEditPanel(p => ({ ...p, cargo: p.cargo.map((x, j) => j === i ? { ...x, commodity: e.target.value } : x) }))}
                            style={{ flex: 1, padding: '4px 6px', border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, outline: 'none' }}
                          >
                            <option value="">— commodity —</option>
                            {allCommodities.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          <input
                            type="number" min="1" step="1"
                            value={ep.scu}
                            onChange={e => setEditPanel(p => ({ ...p, cargo: p.cargo.map((x, j) => j === i ? { ...x, scu: e.target.value } : x) }))}
                            style={{ width: 70, padding: '4px 6px', border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}
                          />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>SCU</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveContractEdit(contract)}
                      style={{ padding: '6px 16px', background: '#2d8659', border: '2px solid #2d8659', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                      Save
                    </button>
                    <button onClick={() => setContractEditId(null)}
                      style={{ padding: '6px 14px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Footer: remove controls (members only) + creator attribution (always) ── */}
              {(isSessionMember || contract.creatorCallsign) && (
                <div style={{ borderTop: '1px solid var(--bg-3)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Left: remove / vote controls + edit */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {isSessionMember && (isMine ? (
                      confirmDeleteContractId === contract.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>Remove contract?</span>
                          <button onClick={() => { onDeleteContract(session.id, contract.id); setConfirmDeleteContractId(null); }}
                            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 12px', border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff', cursor: 'pointer' }}>
                            Confirm
                          </button>
                          <button onClick={() => setConfirmDeleteContractId(null)}
                            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, padding: '6px 12px', border: '2px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteContractId(contract.id)}
                          style={{
                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            padding: '6px 14px', border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff', cursor: 'pointer',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.borderColor = '#000'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
                        >× Remove</button>
                      )
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <button
                          onClick={() => myVoted ? onWithdrawVote?.(contract.id) : onCastRemovalVote?.(contract.id, session.id)}
                          style={{
                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            padding: '6px 14px', cursor: 'pointer',
                            border: `2px solid ${myVoted ? '#c41e3a' : '#bbb'}`,
                            background: 'transparent', color: myVoted ? '#c41e3a' : '#888',
                          }}
                        >Vote Remove ({voteCount} / {threshold})</button>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', fontStyle: 'italic' }}>
                          Requires majority vote to remove.
                        </div>
                      </div>
                    ))}
                    {isSessionMember && (isMine || isSessionCreator) && confirmDeleteContractId !== contract.id && (
                      <button
                        onClick={() => contractEditId === contract.id ? setContractEditId(null) : openContractEdit(contract)}
                        style={{
                          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          padding: '6px 14px', cursor: 'pointer',
                          border: `2px solid ${contractEditId === contract.id ? '#0066cc' : '#555'}`,
                          background: contractEditId === contract.id ? '#0066cc' : 'transparent',
                          color: contractEditId === contract.id ? '#fff' : '#888',
                        }}
                      >{contractEditId === contract.id ? '✎ Close' : '✎ Edit'}</button>
                    )}
                  </div>

                  {/* Right: creator attribution */}
                  {contract.creatorCallsign && (
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>posted by </span>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                        color: contract.creatorColor || 'var(--text)', textTransform: 'uppercase',
                      }}>{contract.creatorCallsign}</span>
                    </div>
                  )}
                </div>
              )}
              </>}
            </div>
          );
        })}
        {/* ── Session Chat ── */}
        {isSessionMember && (
          <SessionChat
            session={session}
            myProfileId={myProfileId}
            isSessionMember={isSessionMember}
          />
        )}
      </div>
    </div>
  );
}
