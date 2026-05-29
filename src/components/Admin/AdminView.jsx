import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import { useBanners } from '../../hooks/useBanners.js';

// ── Admin-actions edge function caller ──────────────────────────────────────
async function adminAction(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action, ...payload },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { data, error };
}

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
    const { data, error } = await adminAction('list_users');
    if (error) setError(error.message || String(error));
    else setUsers(data?.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetOnboarding = async (userId, callsign) => {
    if (!window.confirm(`Reset onboarding for ${callsign}? They will see the setup flow on next login.`)) return;
    setResetting(userId);
    const { error } = await adminAction('reset_onboarding', { userId });
    if (error) alert('Error: ' + (error.message || String(error)));
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
        {/* Header */}
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
    adminAction('list_sessions').then(({ data, error }) => {
      if (error) setError(error.message || String(error));
      else setSessions(data?.sessions ?? []);
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
      {/* Stats row */}
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
                  {members.slice(0, 5).map(m => (
                    <ColorDot key={m.id} color={m.color} size={14} />
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
  const [itemMeta, setItemMeta]   = useState({});  // { filename: { displayName, description } }
  const [setMeta,  setSetMetaMap] = useState({});  // { setName: { description } }
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key being saved
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
    const { error } = await adminAction('upsert_banner_item', { filename, displayName, description });
    if (error) alert('Save failed: ' + (error.message || error));
    else { await loadMeta(); flashSaved(filename); }
    setSaving(null);
  };

  const saveSet = async (setName, description) => {
    setSaving('set_' + setName);
    const { error } = await adminAction('upsert_banner_set', { setName, description });
    if (error) alert('Save failed: ' + (error.message || error));
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
            {/* Set header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: isExp ? '2px solid #000' : 'none', background: '#f5f5f5' }}>
              <button onClick={() => setExpanded(prev => ({ ...prev, [set.name]: !isExp }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', ...display, fontWeight: 800, fontSize: 14, padding: 0 }}>
                {set.name} <span style={{ ...mono, fontSize: 10, ...muted }}>{isExp ? '▲' : '▼'}</span>
              </button>
              <span style={{ ...mono, fontSize: 9, ...muted }}>{set.banners.length} banner{set.banners.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Set description editor */}
            <SetDescEditor
              key={'set_' + set.name}
              initialValue={sm.description}
              saving={saving === 'set_' + set.name}
              saved={saved['set_' + set.name]}
              onSave={(desc) => saveSet(set.name, desc)}
            />

            {/* Individual banners */}
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
      {/* Thumbnail */}
      <div style={{ width: '100%', height: 120, position: 'relative', overflow: 'hidden', background: '#111' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${banner.src})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      </div>
      {/* Filename */}
      <div style={{ padding: '6px 8px 0', ...mono, fontSize: 8, ...muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {banner.id}
      </div>
      {/* Fields */}
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
function BroadcastsPanel() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const load = useCallback(async () => {
    const { data } = await adminAction('list_broadcasts');
    setBroadcasts(data?.broadcasts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await adminAction('create_broadcast', { title, bodyText: body });
    if (error) alert('Error: ' + (error.message || error));
    else {
      setTitle(''); setBody('');
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      load();
    }
    setSaving(false);
  };

  return (
    <div>
      {/* Compose */}
      <div style={{ border: '2px solid #000', background: '#fff', padding: 20, marginBottom: 20 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>New Broadcast</div>
        <div style={{
          padding: '10px 12px', marginBottom: 14,
          background: 'rgba(196,30,58,0.04)', border: '1.5px solid #c41e3a',
          ...mono, fontSize: 9, color: '#c41e3a', lineHeight: 1.6,
        }}>
          Broadcasts are saved as drafts. Delivery to users is not yet implemented.
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Title</div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Server Maintenance Tonight"
            style={{ width: '100%', padding: '9px 12px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Body</div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Message body…"
            rows={4}
            style={{ width: '100%', padding: '9px 12px', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={submit}
            disabled={!title.trim() || saving}
            style={{
              padding: '9px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              border: `2px solid ${!title.trim() ? '#ccc' : '#c41e3a'}`,
              background: !title.trim() ? '#f5f5f5' : '#c41e3a',
              color: !title.trim() ? '#999' : '#fff',
              cursor: !title.trim() || saving ? 'default' : 'pointer',
            }}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          {saved && <span style={{ ...mono, fontSize: 10, color: '#2d8659' }}>Saved ✓</span>}
        </div>
      </div>

      {/* Existing broadcasts */}
      {loading ? (
        <div style={{ ...mono, fontSize: 11, ...muted }}>Loading broadcasts…</div>
      ) : broadcasts.length === 0 ? (
        <div style={{ ...mono, fontSize: 11, ...muted }}>No broadcasts yet.</div>
      ) : (
        <div style={{ border: '2px solid #000', background: '#fff' }}>
          <div style={{ ...mono, fontSize: 9, ...muted, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px', borderBottom: '1px solid #e8e8e8', background: '#f5f5f5' }}>
            Saved Drafts ({broadcasts.length})
          </div>
          {broadcasts.map((b, i) => (
            <div key={b.id} style={{ padding: '12px 14px', borderBottom: i < broadcasts.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ ...display, fontWeight: 700, fontSize: 13 }}>{b.title}</div>
                <div style={{ ...mono, fontSize: 9, ...muted }}>
                  {new Date(b.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
              {b.body && <div style={{ ...mono, fontSize: 11, color: '#555', lineHeight: 1.5 }}>{b.body}</div>}
              {b.sent_at ? (
                <span style={{ ...pill('#2d8659'), marginTop: 6, display: 'inline-block' }}>Sent</span>
              ) : (
                <span style={{ ...pill('#888'), marginTop: 6, display: 'inline-block' }}>Draft</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main AdminView ────────────────────────────────────────────────────────────
const PANELS = [
  { key: 'users',     label: 'Users' },
  { key: 'sessions',  label: 'Sessions & Contracts' },
  { key: 'banners',   label: 'Banner Manager' },
  { key: 'broadcasts',label: 'Broadcasts' },
];

export default function AdminView() {
  const [panel, setPanel] = useState('users');

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Admin Portal</div>
        <span style={{ ...pill('#7c3aed') }}>Restricted</span>
      </div>

      {/* Sub-nav */}
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

      {/* Panel content */}
      {panel === 'users'      && <UsersPanel />}
      {panel === 'sessions'   && <SessionsPanel />}
      {panel === 'banners'    && <BannerManagerPanel />}
      {panel === 'broadcasts' && <BroadcastsPanel />}
    </div>
  );
}
