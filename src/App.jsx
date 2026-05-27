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

  const lbl = {
    display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, color: '#000',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', border: '2px solid #000', padding: 28, width: 400 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>New Session</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</div>
        </div>
        <div style={{ height: 2, background: '#000', marginBottom: 20 }} />

        <span style={lbl}>Who's flying today?</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {DEFAULT_PLAYERS.map((p) => {
            const active = players.includes(p);
            const color = PLAYER_COLORS[p] || '#000';
            return (
              <button key={p} onClick={() => toggle(p)} style={{
                padding: '7px 16px', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                border: `2px solid ${active ? color : '#000'}`,
                background: active ? `${color}18` : '#fff',
                color: active ? color : '#000',
              }}>{p}</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button
            style={{ padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', border: '2px solid #000', background: '#fff', color: '#000', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
            onClick={onClose}
          >Cancel</button>
          <button
            style={{
              padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              border: `2px solid ${players.length ? '#e50000' : '#ccc'}`,
              background: players.length ? '#e50000' : 'var(--bg-3)',
              color: players.length ? '#fff' : '#999',
              cursor: players.length ? 'pointer' : 'default',
            }}
            onClick={() => players.length && onSave({ id: 's' + Date.now(), date: dateKey, players, contracts: [] })}
          >Open Session →</button>
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
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Initializing…
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
      <div style={{ background: '#000', borderBottom: '3px solid #e50000', padding: '0 24px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: 0 }}>

        {/* Brand */}
        <div style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: '#fff', textTransform: 'uppercase' }}>
            Missions Tracker
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginTop: 2, textTransform: 'uppercase' }}>
            UEE Cargo Ops · v0.1
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {[['Sessions', totalSessions], ['Contracts', totalContracts], ['Total SCU', totalSCU.toLocaleString()]].map(([l, v], i) => (
            <div key={l} style={{
              padding: '12px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              borderRight: i === 2 ? '1px solid rgba(255,255,255,0.12)' : 'none',
              background: i === 0 ? 'rgba(229,0,0,0.15)' : 'transparent',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: i === 0 ? '#e50000' : '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* User + sign-out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {avatarUrl && (
            <img src={avatarUrl} alt={userName}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }}
            />
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.7)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              padding: '5px 12px', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.25)', background: 'transparent',
              color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e50000'; e.currentTarget.style.borderColor = '#e50000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {view === 'calendar' && (
          <div>
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px' }}>
              <button
                style={{ border: '2px solid #000', background: '#fff', color: '#000', padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                onClick={() => navMonth(-1)}
              >←</button>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', color: '#000' }}>{monthName}</div>
              <button
                style={{ border: '2px solid #000', background: '#fff', color: '#000', padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                onClick={() => navMonth(1)}
              >→</button>
            </div>

            <CalendarView sessions={sessions} viewDate={viewDate} onSelectDate={openSession} onNewSession={(key) => setModal({ type: 'new-session', dateKey: key })} />

            <div style={{ padding: '8px 20px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
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
