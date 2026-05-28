import { useState, useRef, useEffect } from 'react';
import { SYSTEMS as STATIC_SYSTEMS } from '../../data/locations.js';

const inp = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
  background: '#fff', border: '2px solid #000', color: '#000',
  borderRadius: 0, fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
};

// Normalize a systemsMap value entry to { name, body } regardless of whether
// the caller supplied rich objects or plain strings (static fallback).
const toRich = (entry) =>
  typeof entry === 'string' ? { name: entry, body: '' } : entry;

export default function LocationAutocomplete({ value, onChange, filterSystem, placeholder, systemsMap: externalMap }) {
  // value may be { name, body } or a plain string (legacy / free-typed)
  const displayName = typeof value === 'object' ? (value?.name || '') : (value || '');
  const [q, setQ] = useState(displayName);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    setQ(typeof value === 'object' ? (value?.name || '') : (value || ''));
  }, [value]);

  // Use external map if provided; fall back to static strings converted to rich objects
  const rawMap = externalMap && Object.keys(externalMap).length > 0
    ? externalMap
    : Object.fromEntries(Object.entries(STATIC_SYSTEMS).map(([s, locs]) => [s, locs.map(toRich)]));

  const pool = filterSystem
    ? (rawMap[filterSystem] || []).map(e => ({ ...toRich(e), system: filterSystem }))
    : Object.entries(rawMap).flatMap(([sys, arr]) => arr.map(e => ({ ...toRich(e), system: sys })));

  const hits = pool.filter(e => e.name.toLowerCase().includes(q.toLowerCase())).slice(0, 9);

  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <input style={inp} value={q}
        onChange={e => {
          const v = e.target.value;
          setQ(v);
          onChange({ name: v, body: '' });
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || 'Search location…'}
      />
      {open && hits.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% - 2px)', left: 0, right: 0, zIndex: 300,
          background: '#fff', border: '2px solid #000', borderTop: 'none',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {hits.map(({ name, body, system }) => (
            <div key={name + system}
              onMouseDown={() => { onChange({ name, body }); setQ(name); setOpen(false); }}
              style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-3)', color: '#000' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
            >
              <span>{name}</span>
              <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginLeft: 8, flexShrink: 0, textAlign: 'right' }}>
                {system}{body ? ` › ${body}` : ' › Deep Space'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
