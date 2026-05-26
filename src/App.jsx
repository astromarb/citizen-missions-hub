import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import CalendarView from '@/components/Calendar/CalendarView.jsx';
import SessionView from '@/components/Session/SessionView.jsx';
import AddContractModal from '@/components/Contract/AddContractModal.jsx';
import LoginScreen from '@/components/Auth/LoginScreen.jsx';
import AuthLog from '@/components/Auth/AuthLog.jsx';
import { DEFAULT_PLAYERS, PLAYER_COLORS } from '@/data/players.js';
import { fmtKey } from '@/utils/dateUtils.js';

const TODAY = new Date();

const SAMPLE_SESSIONS = {
  [fmtKey(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 7))]: {
    id: 's1', date: fmtKey(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 7)),
    players: ['Marvin', 'Trevor', 'Cam'],
    contracts: [
      { id: 'c1', type: 'Hauling - Stellar', system: 'Stanton',
        pickups: ['ARC Mining 045'], dropoffs: ['Baijini Point'],
        cargo: [{ commodity: 'Agricium', scu: 24 }], done: true },
      { id: 'c2', type: 'Hauling - Stellar', system: 'Stanton',
        pickups: ['Vivere OLP'], dropoffs: ['Port Tressler'],
        cargo: [{ commodity: 'Construction Materials', scu: 32 }], done: true },
    ],
  },
  [fmtKey(TODAY)]: {
    id: 's2', date: fmtKey(TODAY),
    players: ['Marvin', 'Trevor', 'Cam', 'Camden'],
    contracts: [
      { id: 'c3', type: 'Hauling - Interstellar', system: 'Stanton → Pyro',
        pickups: ['ARC Mining 061'], dropoffs: ['Ruin Station'],
        cargo: [{ commodity: 'Laranite', scu: 48 }, { commodity: 'Gold', scu: 16 }], done: false },
    ],
  },
};

const getUserName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.user_name ||
  user?.user_metadata?.name ||
  (user?.email ? user.email.split('@')[0] : null) ||
  'Pilot';

// ─── NEW SESSION MODAL ────────────────────────────────────────────────────────

function NewSessionModal({ dateKey, onSave, onClose }) {
  const [players, setPlayers] = useState([]);
  const d = new Date(dateKey + 'T12:00:00');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const toggle = (p) => setPlayers((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const btn = (primary, disabled) => ({
    padding: '8px 22px', borderRadius: 6, fontSize: 13, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-mono)', border: `1px solid ${primary ? 'var(--gold)' : 'var(--border)'}`,
    background: primary ? 'var(--gold-dim)' : 'transparent',
    color: primary ? 'var(--gold)' : 'var(--muted)', opacity: disabled ? 0.4 : 1,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-0)', border: '1px solid var(--border)', borderRadius: 12, padding: 26, width: 400 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          <span style={{ color: 'var(--gold)' }}>// </span>NEW GROUP SESSION
        </div>
        <div style={{ fontSize: 17, color: 'var(--text)', fontFamily: 'var(--font-mono)', marginBottom: 22 }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Who's flying today?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {DEFAULT_PLAYERS.map((p) => {
            const active = players.includes(p);
            return (
              <button key={p} onClick={() => toggle(p)} style={{
                padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13,
                border: `1px solid ${active ? (PLAYER_COLORS[p] || 'var(--gold)') : 'var(--border)'}`,
                background: active ? `${PLAYER_COLORS[p]}22` : 'var(--bg-1)',
                color: active ? (PLAYER_COLORS[p] || 'var(--gold)') : 'var(--muted)',
              }}>{p}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button style={btn(false, false)} onClick={onClose}>Cancel</button>
          <button style={btn(true, !players.length)} onClick={() => players.length && onSave({ id: 's' + Date.now(), date: dateKey, players, contracts: [] })}>
            Open Session →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── Auth ──
  const [authSession, setAuthSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authLog, setAuthLog] = useState([]);
  const lastNameRef = useRef('Pilot');

  // ── App ──
  const [sessions, setSessions] = useState(SAMPLE_SESSIONS);
  const [view, setView] = useState('calendar');
  const [viewDate, setViewDate] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal] = useState(null);

  const addLog = useCallback((event, name) => {
    setAuthLog((prev) => [
      { id: Date.now() + Math.random(), time: new Date(), event, name },
      ...prev,
    ].slice(0, 100));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      if (session?.user) lastNameRef.current = getUserName(session.user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        const name = getUserName(session.user);
        lastNameRef.current = name;
        addLog('SIGNED_IN', name);
      } else if (event === 'SIGNED_OUT') {
        addLog('SIGNED_OUT', lastNameRef.current);
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        const name = getUserName(session.user);
        lastNameRef.current = name;
        addLog('INITIAL_SESSION', name);
      } else if (event === 'TOKEN_REFRESHED') {
        addLog('TOKEN_REFRESHED', lastNameRef.current);
      }
    });

    return () => subscription.unsubscribe();
  }, [addLog]);

  // ── Handlers ──
  const navMonth = (dir) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1));
  const openSession = (key) => { setSelectedDate(key); setView('session'); };

  const saveSession = (session) => {
    setSessions((prev) => ({ ...prev, [session.date]: session }));
    setModal(null); setSelectedDate(session.date); setView('session');
  };

  const addContract = (contract) => {
    setSessions((prev) => ({ ...prev, [selectedDate]: { ...prev[selectedDate], contracts: [...prev[selectedDate].contracts, contract] } }));
    setModal(null);
  };

  const toggleDone = (sid, cid) => {
    setSessions((prev) => ({ ...prev, [selectedDate]: { ...prev[selectedDate], contracts: prev[selectedDate].contracts.map((c) => c.id === cid ? { ...c, done: !c.done } : c) } }));
  };

  const deleteContract = (sid, cid) => {
    setSessions((prev) => ({ ...prev, [selectedDate]: { ...prev[selectedDate], contracts: prev[selectedDate].contracts.filter((c) => c.id !== cid) } }));
  };

  const totalSessions = Object.keys(sessions).length;
  const totalContracts = Object.values(sessions).reduce((t, s) => t + s.contracts.length, 0);
  const totalSCU = Object.values(sessions).reduce((t, s) => t + s.contracts.reduce((ct, c) => ct + c.cargo.reduce((cg, x) => cg + Number(x.scu || 0), 0), 0), 0);
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ── Auth gates ──
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.14em' }}>
          INITIALIZING…
        </div>
      </div>
    );
  }

  if (!authSession) return <LoginScreen />;

  const userName = getUserName(authSession.user);
  const avatarUrl = authSession.user?.user_metadata?.avatar_url;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--text)' }}>

      {/* ── Top bar ── */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>UEE Cargo Ops</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.16em', marginTop: 1 }}>Mission Tracking System · v0.1</div>
        </div>

        <div style={{ display: 'flex', gap: 28 }}>
          {[['Sessions', totalSessions], ['Contracts', totalContracts], ['Total SCU', totalSCU.toLocaleString()]].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--gold)' }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* User + sign-out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {avatarUrl && (
            <img src={avatarUrl} alt={userName}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0 }}
            />
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#E24B4A'; e.currentTarget.style.borderColor = '#E24B4A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {view === 'calendar' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 4px' }}>
              <button style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => navMonth(-1)}>←</button>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text)' }}>{monthName}</div>
              <button style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => navMonth(1)}>→</button>
            </div>
            <CalendarView sessions={sessions} viewDate={viewDate} onSelectDate={openSession} onNewSession={(key) => setModal({ type: 'new-session', dateKey: key })} />
            <div style={{ padding: '0 20px 10px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Click any day to open an existing session or start a new one.
            </div>
          </div>
        )}
        {view === 'session' && selectedDate && sessions[selectedDate] && (
          <SessionView session={sessions[selectedDate]} onBack={() => setView('calendar')} onAddContract={() => setModal({ type: 'add-contract' })} onToggleDone={toggleDone} onDeleteContract={deleteContract} />
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'new-session' && <NewSessionModal dateKey={modal.dateKey} onSave={saveSession} onClose={() => setModal(null)} />}
      {modal?.type === 'add-contract' && <AddContractModal onSave={addContract} onClose={() => setModal(null)} />}

      {/* ── Auth log (testing panel) ── */}
      <AuthLog entries={authLog} />
    </div>
  );
}
