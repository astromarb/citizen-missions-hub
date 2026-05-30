import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

const mono = { fontFamily: 'var(--font-mono)' };
const display = { fontFamily: 'var(--font-display)' };

// Tables the admin can view / edit / export. `conflict` is the natural key
// used when importing a CSV (upsert target). `numeric` lists number columns.
const TABLES = [
  { key: 'ships',       label: 'Ships & Values', table: 'ships',       orderBy: 'sort_order', conflict: 'name',        numeric: ['value', 'sort_order'] },
  { key: 'locations',   label: 'Locations',      table: 'locations',   orderBy: 'sort_order', conflict: 'system,name', numeric: ['sort_order'] },
  { key: 'commodities', label: 'Commodities',    table: 'commodities', orderBy: 'sort_order', conflict: 'name',        numeric: ['sort_order'] },
];

// ── CSV helpers ───────────────────────────────────────────────────────────────
function toCSV(rows, columns) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(','), ...rows.map(r => columns.map(c => esc(r[c])).join(','))].join('\n');
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ── One table editor ──────────────────────────────────────────────────────────
function TableEditor({ cfg }) {
  const [rows, setRows]       = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty]     = useState({});      // { rowKey: true }
  const [status, setStatus]   = useState(null);
  const [busy, setBusy]       = useState(false);
  const [importing, setImporting] = useState(false);

  // A stable client-side key for rows (DB id, or a temp id for new rows)
  const keyOf = (r) => r.__key;

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    const { data, error } = await supabase.from(cfg.table).select('*').order(cfg.orderBy, { ascending: true });
    if (error) {
      setStatus({ error: error.message });
      setRows([]); setColumns([]);
      setLoading(false);
      return;
    }
    const cols = data.length ? Object.keys(data[0]) : [];
    setColumns(cols);
    setRows((data || []).map((r, i) => ({ ...r, __key: r.id != null ? `id:${r.id}` : `tmp:${i}` })));
    setDirty({});
    setLoading(false);
  }, [cfg.table, cfg.orderBy]);

  useEffect(() => { load(); }, [load]);

  const editableCols = columns.filter(c => c !== 'id' && c !== '__key');
  const isNum = (c) => cfg.numeric.includes(c);

  const setCell = (key, col, value) => {
    setRows(prev => prev.map(r => keyOf(r) === key ? { ...r, [col]: value } : r));
    setDirty(prev => ({ ...prev, [key]: true }));
  };

  const addRow = () => {
    const blank = { __key: `new:${Date.now()}:${Math.random().toString(36).slice(2, 6)}` };
    editableCols.forEach(c => { blank[c] = isNum(c) ? 0 : ''; });
    setRows(prev => [...prev, blank]);
    setDirty(prev => ({ ...prev, [blank.__key]: true }));
  };

  const deleteRow = async (row) => {
    const key = keyOf(row);
    // New unsaved row — just drop it locally.
    if (row.id == null) {
      setRows(prev => prev.filter(r => keyOf(r) !== key));
      setDirty(prev => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    if (!window.confirm(`Delete this ${cfg.label.replace(/s$/, '').toLowerCase()} row? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from(cfg.table).delete().eq('id', row.id);
    setBusy(false);
    if (error) setStatus({ error: error.message });
    else { setStatus({ ok: 'Row deleted' }); load(); }
  };

  const coerce = (row) => {
    const out = {};
    editableCols.forEach(c => {
      let v = row[c];
      if (isNum(c)) v = v === '' || v == null ? 0 : Number(v);
      out[c] = v;
    });
    if (row.id != null) out.id = row.id;
    return out;
  };

  const saveChanges = async () => {
    const dirtyRows = rows.filter(r => dirty[keyOf(r)]);
    if (dirtyRows.length === 0) { setStatus({ ok: 'No changes to save' }); return; }
    setBusy(true);
    setStatus(null);
    const payload = dirtyRows.map(coerce);
    // Rows with an id upsert on id; brand-new rows upsert on the natural key.
    const withId = payload.filter(p => p.id != null);
    const withoutId = payload.filter(p => p.id == null);
    let error = null;
    if (withId.length) {
      ({ error } = await supabase.from(cfg.table).upsert(withId, { onConflict: 'id' }));
    }
    if (!error && withoutId.length) {
      ({ error } = await supabase.from(cfg.table).upsert(withoutId, { onConflict: cfg.conflict }));
    }
    setBusy(false);
    if (error) setStatus({ error: error.message });
    else { setStatus({ ok: `Saved ${dirtyRows.length} row${dirtyRows.length !== 1 ? 's' : ''}` }); load(); }
  };

  const exportCSV = () => {
    const cols = editableCols; // skip internal id/__key in the export
    download(`${cfg.table}.csv`, toCSV(rows, cols));
  };

  const importCSV = async (file) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length < 2) { setStatus({ error: 'CSV has no data rows' }); return; }
    const header = parsed[0].map(h => h.trim());
    const dataRows = parsed.slice(1).map(cells => {
      const obj = {};
      header.forEach((h, i) => {
        if (h === 'id' || h === '__key') return;
        let v = cells[i] ?? '';
        if (isNum(h)) v = v === '' ? 0 : Number(v);
        obj[h] = v;
      });
      return obj;
    });
    if (!window.confirm(`Import ${dataRows.length} rows into "${cfg.table}"? Existing rows matching on (${cfg.conflict}) will be updated.`)) return;
    setImporting(true);
    setStatus(null);
    const { error } = await supabase.from(cfg.table).upsert(dataRows, { onConflict: cfg.conflict });
    setImporting(false);
    if (error) setStatus({ error: error.message });
    else { setStatus({ ok: `Imported ${dataRows.length} rows` }); load(); }
  };

  if (loading) return <div style={{ ...mono, fontSize: 11, color: 'var(--muted)', padding: 20 }}>Loading {cfg.label}…</div>;

  const dirtyCount = Object.keys(dirty).length;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ ...mono, fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {rows.length} row{rows.length !== 1 ? 's' : ''}
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={exportCSV} style={btn('#2d8659')}>⬇ Download CSV</button>
        <label style={{ ...btn('#555'), cursor: importing ? 'default' : 'pointer' }}>
          {importing ? 'Importing…' : '⬆ Import CSV'}
          <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} disabled={importing}
            onChange={e => { importCSV(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <button onClick={addRow} style={btn('#0066cc')}>+ Add Row</button>
        <button onClick={saveChanges} disabled={busy || dirtyCount === 0} style={{ ...btn('#c41e3a'), opacity: (busy || dirtyCount === 0) ? 0.5 : 1 }}>
          {busy ? 'Saving…' : `Save Changes${dirtyCount ? ` (${dirtyCount})` : ''}`}
        </button>
      </div>

      {status?.ok    && <div style={{ ...mono, fontSize: 10, color: '#2d8659', marginBottom: 10 }}>{status.ok} ✓</div>}
      {status?.error && <div style={{ ...mono, fontSize: 10, color: '#c41e3a', marginBottom: 10 }}>Error: {status.error}</div>}

      {/* Editable grid */}
      <div style={{ border: '2px solid #000', background: '#fff', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #000' }}>
              {editableCols.map(c => (
                <th key={c} style={{ ...mono, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', textAlign: 'left', padding: '6px 8px', whiteSpace: 'nowrap' }}>{c}</th>
              ))}
              <th style={{ padding: '6px 8px', width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const key = keyOf(row);
              const isDirty = !!dirty[key];
              return (
                <tr key={key} style={{ borderBottom: '1px solid #eee', background: isDirty ? 'rgba(196,30,58,0.05)' : (row.id == null ? 'rgba(0,102,204,0.05)' : 'transparent') }}>
                  {editableCols.map(c => (
                    <td key={c} style={{ padding: '3px 5px' }}>
                      <input
                        type={isNum(c) ? 'number' : 'text'}
                        value={row[c] ?? ''}
                        onChange={e => setCell(key, c, e.target.value)}
                        style={{
                          width: isNum(c) ? 100 : '100%', minWidth: isNum(c) ? 80 : 120, boxSizing: 'border-box',
                          padding: '5px 7px', border: '1px solid #ddd', ...mono, fontSize: 11, outline: 'none', background: '#fff', color: '#000',
                        }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '3px 5px', textAlign: 'center' }}>
                    <button onClick={() => deleteRow(row)} title="Delete row"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c41e3a', fontSize: 16, fontWeight: 700, lineHeight: 1, padding: '0 4px' }}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function btn(color) {
  return {
    padding: '7px 14px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    border: `2px solid ${color}`, background: color, color: '#fff', cursor: 'pointer',
  };
}

export default function DataTablesPanel() {
  const [active, setActive] = useState(TABLES[0].key);
  const cfg = TABLES.find(t => t.key === active);

  return (
    <div>
      <div style={{ ...display, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Reference Data</div>
      <div style={{ ...mono, fontSize: 10, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
        View, edit, add, and delete reference data. Edit cells then "Save Changes". Download any table as CSV for
        Excel, or import a CSV to bulk-update (matched on its natural key).
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABLES.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)} style={{
            padding: '6px 14px', ...display, fontWeight: 700, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
            border: `2px solid ${active === t.key ? '#000' : '#ccc'}`,
            background: active === t.key ? '#000' : '#fff',
            color: active === t.key ? '#fff' : '#555',
          }}>{t.label}</button>
        ))}
      </div>

      <TableEditor key={cfg.key} cfg={cfg} />
    </div>
  );
}
