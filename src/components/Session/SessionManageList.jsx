import { useState } from 'react';
import { keyToLabel } from '../../utils/dateUtils.js';

const TODAY = new Date().toISOString().slice(0, 10);

function SessionRow({ session, onDelete, onUpdate, onOpen }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(session.date);
  const [dateError, setDateError] = useState(null);
  const [saving, setSaving] = useState(false);

  const totalSCU = session.contracts.reduce((t, c) =>
    t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
  const totalPayout = session.contracts.reduce((t, c) => t + (c.payout || 0), 0);
  const crewNames = session.members?.map(m => ({ callsign: m.callsign, color: m.color || '#8b949e' })) || [];

  const handleSaveDate = async () => {
    if (newDate > TODAY) { setDateError('Cannot move to a future date.'); return; }
    setSaving(true);
    setDateError(null);
    const ok = await onUpdate(session.id, { date: newDate });
    setSaving(false);
    if (ok === false) setDateError('Could not save — try a different date.');
    else setEditingDate(false);
  };

  return (
    <div style={{
      border: '2px solid var(--border)', background: 'var(--bg-1)',
      marginBottom: 8, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      {/* Date */}
      <div style={{ minWidth: 160 }}>
        {editingDate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="date" value={newDate}
                max={TODAY}
                onChange={e => { setNewDate(e.target.value); setDateError(null); }}
                style={{ padding: '4px 8px', border: `2px solid ${dateError ? '#c41e3a' : 'var(--border)'}`, background: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', color: '#000' }}
              />
              <button
                onClick={handleSaveDate}
                disabled={saving}
                style={{ padding: '4px 10px', background: '#2d8659', border: '2px solid #000', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                {saving ? '…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditingDate(false); setNewDate(session.date); setDateError(null); }}
                style={{ padding: '4px 8px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10 }}>
                ×
              </button>
            </div>
            {dateError && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c41e3a' }}>{dateError}</div>}
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {keyToLabel(session.date)}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
              {session.contracts.length} contract{session.contracts.length !== 1 ? 's' : ''}
              {totalSCU > 0 ? ` · ${totalSCU.toLocaleString()} SCU` : ''}
              {totalPayout > 0 ? ` · ${totalPayout.toLocaleString()} aUEC` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Crew chips */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
        {crewNames.map(({ callsign, color }) => (
          <span key={callsign} style={{
            padding: '3px 8px', border: `2px solid ${color}`,
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.04em', color,
          }}>{callsign}</span>
        ))}
        {crewNames.length === 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>No crew</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={() => onOpen(session.id)}
          style={{
            padding: '5px 12px', border: '2px solid var(--border)', background: 'var(--bg-1)',
            color: 'var(--text)', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-1)'; e.currentTarget.style.color = 'var(--text)'; }}
        >Open</button>

        {!editingDate && (
          <button
            onClick={() => setEditingDate(true)}
            style={{
              padding: '5px 12px', border: '2px solid var(--border)', background: 'var(--bg-1)',
              color: 'var(--muted)', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >Edit Date</button>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              padding: '5px 12px', border: '2px solid rgba(196,30,58,0.35)', background: 'transparent',
              color: 'rgba(196,30,58,0.6)', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(196,30,58,0.6)'; e.currentTarget.style.borderColor = 'rgba(196,30,58,0.35)'; }}
          >Delete</button>
        ) : (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>Sure?</span>
            <button
              onClick={() => onDelete(session.id)}
              style={{ padding: '5px 10px', background: '#c41e3a', border: '2px solid #c41e3a', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ padding: '5px 8px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10 }}>
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionManageList({ sessions, myProfileId, onDelete, onUpdate, onOpen, onNewSession }) {
  const mine = Object.values(sessions)
    .filter(s => s.createdBy === myProfileId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const [filter, setFilter] = useState('');

  const filtered = filter.trim()
    ? mine.filter(s =>
        s.date.includes(filter) ||
        s.members?.some(m => m.callsign?.toLowerCase().includes(filter.toLowerCase()))
      )
    : mine;

  return (
    <div style={{ padding: '16px 20px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
          My Sessions
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>
          {mine.length} total
        </div>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by date or pilot…"
          style={{
            marginLeft: 'auto', padding: '6px 10px', border: '2px solid var(--border)',
            background: 'var(--bg-1)', color: 'var(--text)',
            fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none', width: 200,
          }}
        />
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed var(--border)', background: 'var(--bg-1)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {filter ? 'No sessions match.' : 'You haven\'t created any sessions yet.'}
        </div>
      )}

      {filtered.map(s => (
        <SessionRow
          key={s.id}
          session={s}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
