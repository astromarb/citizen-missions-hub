import { useState, useRef, useEffect } from 'react';
import { COMMODITIES as STATIC_COMMODITIES } from '../../data/commodities.js';

const inp = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
  background: '#fff', border: '2px solid #000', color: '#000',
  borderRadius: 0, fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
};

export default function CommodityAutocomplete({ value, onChange, commodities: externalList }) {
  const list = externalList?.length ? externalList : STATIC_COMMODITIES;
  const [q, setQ] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => { setQ(value || ''); }, [value]);

  const hits = list.filter(c => c.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div style={{ position: 'relative', flex: 1 }} ref={ref}>
      <input style={inp} value={q}
        onChange={e => { const v = e.target.value; setQ(v); onChange(v); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search commodity…"
      />
      {open && hits.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% - 2px)', left: 0, right: 0, zIndex: 300,
          background: '#fff', border: '2px solid #000', borderTop: 'none',
          maxHeight: 280, overflowY: 'auto',
        }}>
          {hits.map(c => (
            <div key={c}
              onMouseDown={() => { onChange(c); setQ(c); setOpen(false); }}
              style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#000', borderBottom: '1px solid var(--bg-3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
            >
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
