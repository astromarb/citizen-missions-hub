import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import { useBanners } from '../../hooks/useBanners.js';
import { invalidateBadgeIcons } from '../../hooks/useBadgeIcons.js';
import DataTablesPanel from './DataTablesPanel.jsx';

// ── Shared styles ─────────────────────────────────────────────────────────────
const mono = { fontFamily: 'var(--font-mono)' };
const display = { fontFamily: 'var(--font-display)' };
const muted = { color: 'var(--muted)' };
const pill = (color) => ({
  display: 'inline-block', padding: '2px 8px',
  background: color + '22', border: `1.5px solid ${color}`,
  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase', color,
});

function ColorDot({ color, size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color || '#8b949e', border: '1.5px solid rgba(0,0,0,0.15)',
      flexShrink: 0,
    }} />
  );
}

// ── Sub-panel: Users ──────────────────────────────────────────────────────────
function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, callsign, color, home_region, badges, banner_panel, onboarding_complete, is_admin, created_at')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setUsers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetOnboarding = async (userId, callsign) => {
    if (!window.confirm(`Reset onboarding for ${callsign}? They will see the setup flow on next login.`)) return;
    setResetting(userId);
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_complete: false,
        callsign_changed_at: null,
        home_region_changed_at: null,
        rsi_handle_changed_at: null,
      })
      .eq('id', userId);
    if (error) alert('Error: ' + error.message);
    else load();
    setResetting(null);
  };

  if (loading) return <div style={{ ...mono, fontSize: 11, ...muted, padding: 20 }}>Loading users…</div>;
  if (error)   return <div style={{ ...mono, fontSize: 11, color: '#c41e3a', padding: 20 }}>Error: {error}</div>;

  return (
    <div>
      <div style={{ ...mono, fontSize: 9, ...muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {users.length} registered pilot{users.length !== 1 ? 's' : ''}
      </div>
      <div style={{ border: '2px solid #000', background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 120px 100px 90px 110px 120px', gap: 0, borderBottom: '2px solid #000', padding: '6px 12px', background: '#f5f5f5' }}>
          {['', 'Callsign', 'Home Region', 'Badges', 'Status', 'Role', 'Action'].map(h => (
            <div key={h} style={{ ...mono, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', ...muted }}>{h}</div>
          ))}
        </div>
        {users.map((u, i) => (
          <div key={u.id} style={{
            display: 'grid', gridTemplateColumns: '28px 1fr 120px 100px 90px 110px 120px', gap: 0,
            padding: '10px 12px', alignItems: 'center',
            borderBottom: i < users.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}>
            <ColorDot color={u.color} />
            <div>
              <div style={{ ...display, fontWeight: 700, fontSize: 13, color: '#000' }}>{u.callsign}</div>
              <div style={{ ...mono, fontSize: 8, ...muted, marginTop: 2 }}>
                {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div style={{ ...mono, fontSize: 10, color: '#555' }}>{u.home_region || '—'}</div>
            <div style={{ ...mono, fontSize: 10, ...muted }}>{(u.badges || []).length} badge{(u.badges || []).length !== 1 ? 's' : ''}</div>
            <div>
              <span style={pill(u.onboarding_complete ? '#2d8659' : '#c41e3a')}>
                {u.onboarding_complete ? 'Active' : 'Onboarding'}
              </span>
            </div>
            <div>
              {u.is_admin && <span style={pill('#7c3aed')}>Admin</span>}
            </div>
            <button
              onClick={() => resetOnboarding(u.id, u.callsign)}
              disabled={resetting === u.id}
              style={{
                padding: '4px 10px', cursor: resetting === u.id ? 'default' : 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                border: '1.5px solid #555', background: 'transparent', color: '#555',
                opacity: resetting === u.id ? 0.5 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c41e3a'; e.currentTarget.style.color = '#c41e3a'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#555'; }}
            >
              {resetting === u.id ? 'Resetting…' : '↺ Reset Onboarding'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-panel: Sessions & Contracts ──────────────────────────────────────────
function SessionsPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from('sessions')
      .select(`
        id, date, created_at, started_at, ended_at,
        session_players ( profiles ( id, callsign, color ) ),
        contracts (
          id, type, system, payout, done, claim_cost,
          cargo_items ( scu )
        )
      `)
      .order('date', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setSessions(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ ...mono, fontSize: 11, ...muted, padding: 20 }}>Loading sessions…</div>;
  if (error)   return <div style={{ ...mono, fontSize: 11, color: '#c41e3a', padding: 20 }}>Error: {error}</div>;

  const totalContracts = sessions.reduce((t, s) => t + (s.contracts?.length || 0), 0);
  const totalPayout = sessions.reduce((t, s) =>
    t + (s.contracts || []).reduce((ct, c) => ct + (Number(c.payout) || 0), 0), 0);

  const typeColor = { 'Hauling - Planetary': '#2e7d32', 'Hauling - Stellar': '#e07028', 'Hauling - Interstellar': '#0066cc', 'Salvaging': '#7c3aed' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['Sessions', sessions.length],
          ['Contracts', totalContracts],
          ['Total Payout', totalPayout.toLocaleString() + ' aUEC'],
        ].map(([label, val]) => (
          <div key={label} style={{ border: '2px solid #000', background: '#fff', padding: '12px 18px', minWidth: 110 }}>
            <div style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ ...display, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sessions.map(s => {
          const members = (s.session_players || []).map(sp => sp.profiles).filter(Boolean);
          const contracts = s.contracts || [];
          const totalSCU = contracts.reduce((t, c) => t + (c.cargo_items || []).reduce((ct, ci) => ct + Number(ci.scu || 0), 0), 0);
          const isExp = !!expanded[s.id];
          const dateStr = s.date
            ? new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            : 'Unknown';

          return (
            <div key={s.id} style={{ border: '2px solid var(--border)', background: '#fff' }}>
              <button
                onClick={() => setExpanded(prev => ({ ...prev, [s.id]: !isExp }))}
                style={{
                  width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                }}
              >
                <span style={{ ...display, fontWeight: 700, fontSize: 13, flex: 1 }}>{dateStr}</span>
                <div style={{ display: 'flex', gap: -4 }}>
                  {members.slice(0, 5).map((m, mi) => (
                    <ColorDot key={mi} color={m.color} size={14} />
                  ))}
                  {members.length > 5 && <span style={{ ...mono, fontSize: 9, ...muted, marginLeft: 4 }}>+{members.length - 5}</span>}
                </div>
                <span style={{ ...mono, fontSize: 10, ...muted }}>{contracts.length} contract{contracts.length !== 1 ? 's' : ''}</span>
                {totalSCU > 0 && <span style={{ ...mono, fontSize: 10, color: '#c41e3a', fontWeight: 700 }}>{totalSCU.toLocaleString()} SCU</span>}
                {s.ended_at && <span style={pill('#2d8659')}>Ended</span>}
                {!s.started_at && <span style={pill('#888')}>Not started</span>}
                <span style={{ ...mono, fontSize: 10, ...muted }}>{isExp ? '▲' : '▼'}</span>
              </button>
              {isExp && (
                <div style={{ borderTop: '1px solid var(--bg-3)', padding: '10px 14px' }}>
                  <div style={{ ...mono, fontSize: 9, ...muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Members: {members.map(m => m.callsign).join(', ')}
                  </div>
                  {contracts.length === 0 && (
                    <div style={{ ...mono, fontSize: 10, ...muted }}>No contracts</div>
                  )}
                  {contracts.map(c => {
                    const cSCU = (c.cargo_items || []).reduce((t, ci) => t + Number(ci.scu || 0), 0);
                    return (
                      <div key={c.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                        borderBottom: '1px solid #f5f5f5',
                      }}>
                        <span style={{
                          ...display, fontWeight: 700, fontSize: 9,
                          padding: '2px 7px', background: (typeColor[c.type] || '#555') + '22',
                          border: `1.5px solid ${typeColor[c.type] || '#555'}`,
                          color: typeColor[c.type] || '#555', textTransform: 'uppercase', letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                        }}>{c.type}</span>
                        <span style={{ ...display, fontWeight: 700, fontSize: 11, flex: 1 }}>{c.system || '—'}</span>
                        {cSCU > 0 && <span style={{ ...mono, fontSize: 10, ...muted }}>{cSCU.toLocaleString()} SCU</span>}
                        {Number(c.payout) > 0 && (
                          <span style={{ ...mono, fontSize: 10, color: '#2d8659', fontWeight: 700 }}>{Number(c.payout).toLocaleString()} aUEC</span>
                        )}
                        {Number(c.claim_cost) > 0 && (
                          <span style={{ ...mono, fontSize: 10, color: '#c41e3a' }}>−{Number(c.claim_cost).toLocaleString()} claim</span>
                        )}
                        {c.done && <span style={pill('#2d8659')}>Done</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-panel: Banner Manager ─────────────────────────────────────────────────
function BannerManagerPanel() {
  const { sets, loading: setsLoading, refresh } = useBanners();
  const [itemMeta, setItemMeta]   = useState({});
  const [setMeta,  setSetMetaMap] = useState({});
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved]   = useState({});
  const [expanded, setExpanded] = useState({});

  const loadMeta = useCallback(async () => {
    const [items, sets_] = await Promise.all([
      supabase.from('banner_items').select('filename, display_name, description'),
      supabase.from('banner_sets_meta').select('set_name, description'),
    ]);
    const im = {};
    for (const r of (items.data ?? [])) im[r.filename] = { displayName: r.display_name || '', description: r.description || '' };
    const sm = {};
    for (const r of (sets_.data ?? [])) sm[r.set_name] = { description: r.description || '' };
    setItemMeta(im);
    setSetMetaMap(sm);
    setMetaLoading(false);
  }, []);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const flashSaved = (key) => {
    setSaved(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 1800);
  };

  const saveItem = async (filename, displayName, description) => {
    setSaving(filename);
    const { error } = await supabase.from('banner_items').upsert({
      filename,
      display_name: displayName ?? null,
      description: description ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'filename' });
    if (error) alert('Save failed: ' + error.message);
    else { await loadMeta(); flashSaved(filename); }
    setSaving(null);
  };

  const saveSet = async (setName, description) => {
    setSaving('set_' + setName);
    const { error } = await supabase.from('banner_sets_meta').upsert({
      set_name: setName,
      description: description ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'set_name' });
    if (error) alert('Save failed: ' + error.message);
    else { await loadMeta(); flashSaved('set_' + setName); }
    setSaving(null);
  };

  if (setsLoading || metaLoading) return <div style={{ ...mono, fontSize: 11, ...muted, padding: 20 }}>Loading banner data…</div>;
  if (sets.length === 0) return (
    <div style={{ ...mono, fontSize: 11, ...muted, padding: 20 }}>
      No banner images found. Upload images to the <code>images</code> Supabase Storage bucket first.
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {sets.length} set{sets.length !== 1 ? 's' : ''} · {sets.reduce((t, s) => t + s.banners.length, 0)} banners
        </div>
        <button
          onClick={refresh}
          style={{ background: 'none', border: 'none', cursor: 'pointer', ...mono, fontSize: 9, ...muted, textDecoration: 'underline' }}
        >↻ reload</button>
      </div>

      {sets.map(set => {
        const isExp = !!expanded[set.name];
        const sm = setMeta[set.name] || { description: '' };

        return (
          <div key={set.name} style={{ border: '2px solid #000', background: '#fff', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: isExp ? '2px solid #000' : 'none', background: '#f5f5f5' }}>
              <button onClick={() => setExpanded(prev => ({ ...prev, [set.name]: !isExp }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', ...display, fontWeight: 800, fontSize: 14, padding: 0 }}>
                {set.name} <span style={{ ...mono, fontSize: 10, ...muted }}>{isExp ? '▲' : '▼'}</span>
              </button>
              <span style={{ ...mono, fontSize: 9, ...muted }}>{set.banners.length} banner{set.banners.length !== 1 ? 's' : ''}</span>
            </div>

            <SetDescEditor
              key={'set_' + set.name}
              initialValue={sm.description}
              saving={saving === 'set_' + set.name}
              saved={saved['set_' + set.name]}
              onSave={(desc) => saveSet(set.name, desc)}
            />

            {isExp && (
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {set.banners.map(b => {
                    const im = itemMeta[b.id] || { displayName: '', description: '' };
                    return (
                      <BannerItemEditor
                        key={b.id}
                        banner={b}
                        initialDisplayName={im.displayName}
                        initialDescription={im.description}
                        saving={saving === b.id}
                        saved={!!saved[b.id]}
                        onSave={(dn, desc) => saveItem(b.id, dn, desc)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SetDescEditor({ initialValue, saving, saved, onSave }) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => { setValue(initialValue); }, [initialValue]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid #e8e8e8' }}>
      <span style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Collection description</span>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="A short subtitle for this collection…"
        style={{ flex: 1, padding: '5px 8px', border: '1.5px solid #ccc', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }}
      />
      <button
        onClick={() => onSave(value)}
        disabled={saving}
        style={{
          padding: '5px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
          border: '1.5px solid #c41e3a', background: saving ? '#f5f5f5' : '#c41e3a',
          color: saving ? '#999' : '#fff', cursor: saving ? 'default' : 'pointer',
        }}>
        {saving ? '…' : saved ? '✓' : 'Save'}
      </button>
    </div>
  );
}

function BannerItemEditor({ banner, initialDisplayName, initialDescription, saving, saved, onSave }) {
  const [dn, setDn]     = useState(initialDisplayName);
  const [desc, setDesc] = useState(initialDescription);

  useEffect(() => { setDn(initialDisplayName); setDesc(initialDescription); }, [initialDisplayName, initialDescription]);

  return (
    <div style={{ width: 200, border: '1.5px solid #ccc', background: '#fafafa' }}>
      <div style={{ width: '100%', height: 120, position: 'relative', overflow: 'hidden', background: '#111' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${banner.src})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      </div>
      <div style={{ padding: '6px 8px 0', ...mono, fontSize: 8, ...muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {banner.id}
      </div>
      <div style={{ padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <input
          value={dn}
          onChange={e => setDn(e.target.value)}
          placeholder="Display name"
          style={{ width: '100%', padding: '4px 7px', border: '1.5px solid #ccc', ...mono, fontSize: 10, outline: 'none', boxSizing: 'border-box' }}
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description…"
          rows={2}
          style={{ width: '100%', padding: '4px 7px', border: '1.5px solid #ccc', ...mono, fontSize: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.4 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => onSave(dn, desc)}
            disabled={saving}
            style={{
              flex: 1, padding: '5px 0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              border: '1.5px solid #c41e3a', background: saving ? '#f5f5f5' : '#c41e3a',
              color: saving ? '#999' : '#fff', cursor: saving ? 'default' : 'pointer',
            }}>
            {saving ? '…' : 'Save'}
          </button>
          {saved && <span style={{ ...mono, fontSize: 9, color: '#2d8659' }}>✓</span>}
        </div>
      </div>
    </div>
  );
}

// ── Sub-panel: Broadcasts ─────────────────────────────────────────────────────
function fmtRelative(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts);
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function BroadcastLogEntry({ entry, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(entry.broadcast_id, entry.id);
    setDeleting(false);
    setConfirm(false);
  };

  const confirmLabel = entry.broadcast_id ? 'Remove from all inboxes?' : 'Remove this message?';

  return (
    <div style={{ border: '2px solid #e0e0e0', background: '#fafafa', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ background: '#c41e3a', color: '#fff', ...mono, fontSize: 8, padding: '2px 6px', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>⚡ SYS</span>
        {!entry.broadcast_id && (
          <span style={{ background: '#55555522', border: '1.5px solid #555', color: '#555', ...mono, fontSize: 8, padding: '2px 6px', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Preview</span>
        )}
        {entry.sender ? (
          <span style={{ ...display, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: entry.sender.color || '#000' }}>
            {entry.sender.callsign}
          </span>
        ) : (
          <span style={{ ...mono, fontSize: 10, color: '#aaa' }}>admin</span>
        )}
        <span style={{ ...mono, fontSize: 9, color: '#aaa', marginLeft: 'auto' }}>{fmtRelative(entry.created_at)}</span>
        {confirm ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ ...mono, fontSize: 9, color: '#c41e3a' }}>{confirmLabel}</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ ...mono, fontSize: 9, padding: '2px 8px', cursor: 'pointer', background: '#c41e3a', border: '1.5px solid #a01830', color: '#fff' }}
            >{deleting ? '…' : 'Yes'}</button>
            <button
              onClick={() => setConfirm(false)}
              disabled={deleting}
              style={{ ...mono, fontSize: 9, padding: '2px 8px', cursor: 'pointer', background: 'transparent', border: '1.5px solid #ccc', color: '#555' }}
            >No</button>
          </span>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            title="Delete"
            style={{ background: 'none', border: 'none', cursor: 'pointer', ...mono, fontSize: 13, color: '#bbb', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c41e3a'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#bbb'; }}
          >×</button>
        )}
      </div>
      <div style={{ ...mono, fontSize: 11, color: '#333', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {entry.content}
      </div>
    </div>
  );
}

function BroadcastsPanel() {
  const [body,       setBody]       = useState('');
  const [sending,    setSending]    = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result,     setResult]     = useState(null);
  const [log,        setLog]        = useState([]);
  const [adminId,    setAdminId]    = useState(null);

  const loadLog = useCallback(async (uid) => {
    const { data: rows } = await supabase
      .from('messages')
      .select('id, broadcast_id, content, created_at, sender:profiles!sender_id(id, callsign, color)')
      .eq('is_system', true)
      .eq('recipient_id', uid)
      .order('created_at', { ascending: false })
      .limit(50);
    setLog(rows || []);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (!uid) return;
      setAdminId(uid);
      loadLog(uid);
    });
  }, [loadLog]);

  const submit = async () => {
    if (!body.trim() || sending || !adminId) return;
    setSending(true);
    setResult(null);

    const { data: profiles, error: fetchErr } = await supabase
      .from('profiles')
      .select('id');

    if (fetchErr || !profiles?.length) {
      setResult({ error: fetchErr?.message || 'No users found' });
      setSending(false);
      return;
    }

    const broadcastId = crypto.randomUUID();
    const rows = profiles.map(p => ({
      sender_id:    adminId,
      recipient_id: p.id,
      content:      body.trim(),
      is_system:    true,
      broadcast_id: broadcastId,
    }));

    const { error: insertErr } = await supabase.from('messages').insert(rows);
    setSending(false);
    if (insertErr) {
      setResult({ error: insertErr.message });
    } else {
      const sent = body.trim();
      setBody('');
      setResult({ sent: profiles.length });
      setTimeout(() => setResult(null), 5000);
      setLog(prev => [{
        id: broadcastId,
        broadcast_id: broadcastId,
        content: sent,
        created_at: new Date().toISOString(),
        sender: null,
      }, ...prev]);
    }
  };

  const preview = async () => {
    if (!body.trim() || previewing || !adminId) return;
    setPreviewing(true);
    setResult(null);
    const { error } = await supabase.from('messages').insert({
      sender_id:    adminId,
      recipient_id: adminId,
      content:      body.trim(),
      is_system:    true,
    });
    setPreviewing(false);
    if (error) {
      setResult({ error: error.message });
    } else {
      setResult({ preview: true });
      setTimeout(() => setResult(null), 4000);
      await loadLog(adminId);
    }
  };

  const deleteBroadcast = useCallback(async (broadcastId, messageId) => {
    let error;
    if (broadcastId) {
      ({ error } = await supabase.from('messages').delete().eq('broadcast_id', broadcastId));
    } else {
      ({ error } = await supabase.from('messages').delete().eq('id', messageId));
    }
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      setLog(prev => broadcastId
        ? prev.filter(e => e.broadcast_id !== broadcastId)
        : prev.filter(e => e.id !== messageId));
    }
  }, []);

  return (
    <div>
      {/* ── Compose ── */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: 20, marginBottom: 20 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Broadcast System Message</div>
        <div style={{ ...mono, fontSize: 10, color: '#888', marginBottom: 14, lineHeight: 1.6 }}>
          Sends a post to <strong>all pilots</strong> from "Nexus Hub System". Recipients cannot reply.
          Supports <strong>**bold**</strong>, <em>*italic*</em>, bullet lists, and other Markdown.
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Message (Markdown supported)</div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 1000))}
            placeholder={'e.g. **Alpha 0.2 is live!**\n\n- Salvaging overhaul\n- Bug fixes\n\nThank you for flying with us.'}
            rows={5}
            style={{ width: '100%', padding: '9px 12px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
          />
          <div style={{ ...mono, fontSize: 9, ...muted, textAlign: 'right', marginTop: 3 }}>{body.length}/1000</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={preview}
            disabled={!body.trim() || previewing || sending}
            style={{
              padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              border: `2px solid ${!body.trim() ? '#ccc' : '#555'}`,
              background: !body.trim() ? '#f5f5f5' : '#fff',
              color: !body.trim() ? '#999' : '#555',
              cursor: !body.trim() || previewing || sending ? 'default' : 'pointer',
            }}>
            {previewing ? 'Sending…' : 'Preview to Me'}
          </button>
          <button
            onClick={submit}
            disabled={!body.trim() || sending}
            style={{
              padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              border: `2px solid ${!body.trim() ? '#ccc' : '#c41e3a'}`,
              background: !body.trim() ? '#f5f5f5' : '#c41e3a',
              color: !body.trim() ? '#999' : '#fff',
              cursor: !body.trim() || sending ? 'default' : 'pointer',
            }}>
            {sending ? 'Sending…' : 'Send to All'}
          </button>
          {result?.preview && <span style={{ ...mono, fontSize: 10, color: '#555' }}>Preview sent to your inbox ✓</span>}
          {result?.sent    && <span style={{ ...mono, fontSize: 10, color: '#2d8659' }}>Sent to {result.sent} pilots ✓</span>}
          {result?.error   && <span style={{ ...mono, fontSize: 10, color: '#c41e3a' }}>Error: {result.error}</span>}
        </div>
      </div>

      {/* ── Broadcast log ── */}
      <div style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>
        Broadcast History ({log.length})
      </div>
      {log.length === 0 ? (
        <div style={{ ...mono, fontSize: 11, color: '#aaa', padding: '20px 0' }}>No broadcasts sent yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {log.map(entry => (
            <BroadcastLogEntry key={entry.id} entry={entry} onDelete={deleteBroadcast} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main AdminView ────────────────────────────────────────────────────────────
// ── Sub-panel: Stats ──────────────────────────────────────────────────────────
function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
    ]).then(([p, s, c, m]) => {
      setStats({
        pilots:   p.count ?? 0,
        sessions: s.count ?? 0,
        contracts: c.count ?? 0,
        messages: m.count ?? 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = stats ? [
    ['Registered Pilots',  stats.pilots],
    ['Total Sessions',     stats.sessions],
    ['Total Contracts',    stats.contracts],
    ['Messages Sent',      stats.messages],
  ] : [];

  if (loading) return <div style={{ ...mono, fontSize: 11, ...muted, padding: 20 }}>Loading stats…</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {cards.map(([label, val]) => (
          <div key={label} style={{ border: '2px solid #000', background: '#fff', padding: '16px 22px', minWidth: 130 }}>
            <div style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
            <div style={{ ...display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>{val.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{ ...mono, fontSize: 9, ...muted, marginTop: 14, lineHeight: 1.6 }}>
        Messages Sent counts every stored message row including system broadcasts — a broadcast to 5 pilots adds 5 to the total.
      </div>
    </div>
  );
}

// ── Badge definitions (editable) ────────────────────────────────────────────
const DEFAULT_BADGE_DEFS = [
  { id: 'alpha',              label: 'α',           description: 'Been around since the very beginning.',      bgColor: '#100d00', accentColor: '#e8c030', shape: 'square' },
  { id: 'home_region_area18', label: 'AREA18',       description: 'Primary residence: Area 18, ArcCorp.',      bgColor: '#0b1f0b', accentColor: '#5dd65d', shape: 'square' },
  { id: 'home_region_lorville',label: 'LORVILLE',    description: 'Primary residence: Lorville, Hurston.',     bgColor: '#060d1c', accentColor: '#4d8fd4', shape: 'square' },
  { id: 'home_region_orison', label: 'ORISON',       description: 'Primary residence: Orison, Crusader.',      bgColor: '#040f14', accentColor: '#2ec9d4', shape: 'square' },
  { id: 'home_region_new_babbage', label: 'NEW BABBAGE', description: 'Primary residence: New Babbage, MicroTech.', bgColor: '#060b1f', accentColor: '#55aaff', shape: 'square' },
];

const SHAPE_OPTIONS = [
  { key: 'square',   label: 'Square' },
  { key: 'rounded',  label: 'Rounded' },
  { key: 'circle',   label: 'Circle' },
  { key: 'diamond',  label: 'Diamond' },
];

function BadgeEditorPanel() {
  const [defs, setDefs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState({});
  const [saved, setSaved]     = useState({});

  useEffect(() => {
    supabase.from('badge_config').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        // Merge DB data with defaults (DB wins)
        const merged = DEFAULT_BADGE_DEFS.map(def => {
          const db = data.find(d => d.badge_id === def.id);
          return db ? { id: db.badge_id, label: db.label, description: db.description, bgColor: db.bg_color, accentColor: db.accent_color, shape: db.shape, iconUrl: db.icon_url || null } : def;
        });
        setDefs(merged);
      } else {
        setDefs(DEFAULT_BADGE_DEFS);
      }
      setLoading(false);
    });
  }, []);

  const [uploading, setUploading] = useState({});

  const update = (id, field, value) =>
    setDefs(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));

  const uploadIcon = async (def, file) => {
    if (!file) return;
    setUploading(p => ({ ...p, [def.id]: true }));
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `badge-icons/${def.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      alert('Upload failed: ' + upErr.message);
      setUploading(p => ({ ...p, [def.id]: false }));
      return;
    }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    update(def.id, 'iconUrl', data.publicUrl);
    setUploading(p => ({ ...p, [def.id]: false }));
  };

  const saveBadge = async (def) => {
    setSaving(p => ({ ...p, [def.id]: true }));
    await supabase.from('badge_config').upsert({
      badge_id: def.id,
      label: def.label,
      description: def.description,
      bg_color: def.bgColor,
      accent_color: def.accentColor,
      shape: def.shape,
      icon_url: def.iconUrl || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'badge_id' });
    invalidateBadgeIcons();
    setSaving(p => ({ ...p, [def.id]: false }));
    setSaved(p => ({ ...p, [def.id]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [def.id]: false })), 2000);
  };

  if (loading) return <div style={{ ...mono, fontSize: 12, color: 'var(--muted)', padding: 20 }}>Loading…</div>;

  return (
    <div>
      <div style={{ ...display, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Badge Definitions</div>
      <div style={{ ...mono, fontSize: 10, color: 'var(--muted)', marginBottom: 20 }}>
        Edit badge appearance and descriptions. Changes affect all users globally.
        Upload an icon to use a custom symbol in place of the letters — clear it to revert.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {defs.map(def => (
          <div key={def.id} style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', padding: '16px 18px' }}>
            {/* Preview + ID row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              {/* Live preview */}
              <div style={{
                width: 44, height: 44, background: def.bgColor,
                border: `1.5px solid ${def.accentColor}66`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, gap: 2, overflow: 'hidden',
                borderRadius: def.shape === 'circle' ? '50%' : def.shape === 'rounded' ? '8px' : 0,
                transform: def.shape === 'diamond' ? 'rotate(45deg)' : 'none',
                boxShadow: `0 0 8px ${def.accentColor}22`,
              }}>
                {def.iconUrl ? (
                  <img src={def.iconUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain', transform: def.shape === 'diamond' ? 'rotate(-45deg)' : 'none' }} />
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: def.accentColor, fontWeight: 700, transform: def.shape === 'diamond' ? 'rotate(-45deg)' : 'none' }}>
                    {def.shape === 'diamond' ? def.label.slice(0,2) : def.label.slice(0,6)}
                  </span>
                )}
              </div>
              <div>
                <div style={{ ...mono, fontWeight: 700, fontSize: 11 }}>{def.id}</div>
                <div style={{ ...mono, fontSize: 9, color: 'var(--muted)' }}>badge_id</div>
              </div>
              {/* Icon upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <label style={{
                  padding: '5px 12px', cursor: uploading[def.id] ? 'default' : 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  border: '1.5px solid #555', background: 'transparent', color: '#555',
                }}>
                  {uploading[def.id] ? 'Uploading…' : def.iconUrl ? '↻ Replace Icon' : '⬆ Upload Icon'}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    disabled={uploading[def.id]}
                    onChange={e => { uploadIcon(def, e.target.files?.[0]); e.target.value = ''; }} />
                </label>
                {def.iconUrl && (
                  <button onClick={() => update(def.id, 'iconUrl', null)}
                    title="Remove icon (revert to letters)"
                    style={{ background: 'none', border: '1.5px solid #ccc', cursor: 'pointer', ...mono, fontSize: 11, color: '#c41e3a', padding: '4px 8px' }}>
                    ✕ Clear
                  </button>
                )}
                {saved[def.id] && <span style={{ ...mono, fontSize: 10, color: '#2d8659' }}>Saved ✓</span>}
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {/* Label */}
              <div>
                <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Label</div>
                <input value={def.label} onChange={e => update(def.id, 'label', e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {/* Shape */}
              <div>
                <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shape</div>
                <select value={def.shape} onChange={e => update(def.id, 'shape', e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}>
                  {SHAPE_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              {/* BG Color */}
              <div>
                <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Background Color</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color" value={def.bgColor} onChange={e => update(def.id, 'bgColor', e.target.value)}
                    style={{ width: 36, height: 28, padding: 2, border: '1.5px solid var(--border)', cursor: 'pointer', background: 'none' }} />
                  <input value={def.bgColor} onChange={e => update(def.id, 'bgColor', e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', border: '1.5px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }} />
                </div>
              </div>
              {/* Accent Color */}
              <div>
                <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Accent / Icon Color</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color" value={def.accentColor} onChange={e => update(def.id, 'accentColor', e.target.value)}
                    style={{ width: 36, height: 28, padding: 2, border: '1.5px solid var(--border)', cursor: 'pointer', background: 'none' }} />
                  <input value={def.accentColor} onChange={e => update(def.id, 'accentColor', e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', border: '1.5px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none' }} />
                </div>
              </div>
            </div>
            {/* Description */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...mono, fontSize: 9, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tooltip Description</div>
              <input value={def.description} onChange={e => update(def.id, 'description', e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--border)', background: 'var(--bg-0)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {/* Save */}
            <button onClick={() => saveBadge(def)} disabled={saving[def.id]}
              style={{ padding: '7px 18px', background: '#c41e3a', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: saving[def.id] ? 0.6 : 1 }}>
              {saving[def.id] ? 'Saving…' : 'Save Badge'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const PANELS = [
  { key: 'stats',      label: 'Stats' },
  { key: 'users',      label: 'Users' },
  { key: 'sessions',   label: 'Sessions & Contracts' },
  { key: 'banners',    label: 'Banner Manager' },
  { key: 'badges',     label: 'Badges' },
  { key: 'data',       label: 'Data Tables' },
  { key: 'broadcasts', label: 'Broadcasts' },
];

export default function AdminView() {
  const [panel, setPanel] = useState('stats');

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Admin Portal</div>
        <span style={{ ...pill('#7c3aed') }}>Admin Access</span>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #000' }}>
        {PANELS.map(p => (
          <button key={p.key} onClick={() => setPanel(p.key)} style={{
            padding: '8px 18px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            border: 'none', borderBottom: panel === p.key ? '2px solid #c41e3a' : '2px solid transparent',
            marginBottom: -2,
            background: 'none', cursor: 'pointer',
            color: panel === p.key ? '#c41e3a' : 'var(--muted)',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {panel === 'stats'      && <StatsPanel />}
      {panel === 'users'      && <UsersPanel />}
      {panel === 'sessions'   && <SessionsPanel />}
      {panel === 'banners'    && <BannerManagerPanel />}
      {panel === 'badges'     && <BadgeEditorPanel />}
      {panel === 'data'       && <DataTablesPanel />}
      {panel === 'broadcasts' && <BroadcastsPanel />}
    </div>
  );
}
