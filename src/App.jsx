import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import { useSessions } from '@/hooks/useSessions.js';
import { useRefData } from '@/hooks/useRefData.js';
import CalendarView from '@/components/Calendar/CalendarView.jsx';
import SessionView from '@/components/Session/SessionView.jsx';
import AddContractModal from '@/components/Contract/AddContractModal.jsx';
import LoginScreen from '@/components/Auth/LoginScreen.jsx';
import AuthLog from '@/components/Auth/AuthLog.jsx';
import RosterView from '@/components/Roster/RosterView.jsx';
import StatsView from '@/components/Stats/StatsView.jsx';
import { DEFAULT_PLAYERS, PLAYER_COLORS } from '@/data/players.js';
import { fmtKey } from '@/utils/dateUtils.js';

const TODAY = new Date();

const getUserName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.user_name ||
  user?.user_metadata?.name ||
  (user?.email ? user.email.split('@')[0] : null) ||
  'Pilot';

// ─── NEW SESSION MODAL ────────────────────────────────────────────────────────

function NewSessionModal({ dateKey, onSave, onClose, profiles }) {
  const [players, setPlayers] = useState([]);
  const d = new Date(dateKey + 'T12:00:00');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const toggle = (callsign) =>
    setPlayers(prev => prev.includes(callsign) ? prev.filter(x => x !== callsign) : [...prev, callsign]);

  // Use DB profiles if available, otherwise fall back to static list
  const displayList = profiles.length > 0
    ? profiles
    : DEFAULT_PLAYERS.map(callsign => ({ id: callsign, callsign, color: PLAYER_COLORS[callsign] || '#8b949e', avatar_url: null }));

  const lbl = {
    display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, color: '#000',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', border: '2px solid #000', padding: 28, width: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>New Session</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</div>
        </div>
        <div style={{ height: 2, background: '#000', marginBottom: 20 }} />

        <span style={lbl}>Who's flying today?</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {displayList.map(p => {
            const active = players.includes(p.callsign);
            const color = p.color || '#8b949e';
            return (
              <button key={p.id} onClick={() => toggle(p.callsign)} style={{
                padding: '7px 16px', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                border: `2px solid ${active ? color : '#000'}`,
                background: active ? `${color}18` : '#fff',
                color: active ? color : '#000',
              }}>{p.callsign}</button>
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
            onClick={() => players.length && onSave({ date: dateKey, players })}
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

  // ── Profiles ──
  const [profiles, setProfiles] = useState([]);

  // ── Nav ──
  const [activeTab, setActiveTab] = useState('calendar');
  const [view, setView] = useState('calendar');
  const [viewDate, setViewDate] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal] = useState(null);

  // ── Data hooks ──
  const { sessions, loading: sessionsLoading, createSession, createContract, toggleDone, deleteContract } = useSessions(!!authSession);
  const { commodities, systemsMap } = useRefData(!!authSession);

  // ── Auth log ──
  const addLog = useCallback((event, name) => {
    setAuthLog(prev => [{ id: Date.now() + Math.random(), time: new Date(), event, name }, ...prev].slice(0, 100));
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

  // ── Load profiles when authenticated ──
  useEffect(() => {
    if (!authSession) { setProfiles([]); return; }
    supabase.from('profiles').select('id, callsign, color, avatar_url').order('callsign')
      .then(({ data }) => { if (data) setProfiles(data); });
  }, [authSession]);

  // ── Player color map (DB colors override static) ──
  const playerColors = { ...PLAYER_COLORS };
  profiles.forEach(p => { if (p.color) playerColors[p.callsign] = p.color; });

  // ── Handlers ──
  const navMonth = (dir) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1));
  const openSession = (key) => { setSelectedDate(key); setView('session'); };

  const saveSession = async ({ date: dateKey, players }) => {
    const sess = await createSession(dateKey, players);
    if (sess) { setModal(null); setSelectedDate(dateKey); setView('session'); }
  };

  const addContract = async (contract) => {
    const sessionId = sessions[selectedDate]?.id;
    if (sessionId) await createContract(sessionId, contract);
    setModal(null);
  };

  const totalSessions  = Object.keys(sessions).length;
  const totalContracts = Object.values(sessions).reduce((t, s) => t + s.contracts.length, 0);
  const totalSCU       = Object.values(sessions).reduce((t, s) => t + s.contracts.reduce((ct, c) => ct + c.cargo.reduce((cg, x) => cg + Number(x.scu || 0), 0), 0), 0);
  const monthName      = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ── Auth gates ──
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Initializing…</div>
      </div>
    );
  }

  if (!authSession) return <LoginScreen />;

  if (sessionsLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Loading sessions…</div>
      </div>
    );
  }

  const userName  = getUserName(authSession.user);
  const avatarUrl = authSession.user?.user_metadata?.avatar_url;

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab !== 'calendar') setView('calendar'); // reset session view when leaving calendar tab
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--text)' }}>

      {/* ── Top bar ── */}
      <div style={{ background: '#000', borderBottom: '3px solid #e50000', padding: '0 24px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: 0 }}>
        <div style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: '#fff', textTransform: 'uppercase' }}>Missions Tracker</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginTop: 2, textTransform: 'uppercase' }}>UEE Cargo Ops · v0.1</div>
        </div>

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {avatarUrl && (
            <img src={avatarUrl} alt={userName} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.7)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ padding: '5px 12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e50000'; e.currentTarget.style.borderColor = '#e50000'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
          >Sign out</button>
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div style={{ background: '#fff', borderBottom: '2px solid #000', display: 'flex' }}>
        {[['calendar', 'Calendar'], ['roster', 'Roster'], ['stats', 'Stats']].map(([tab, label]) => (
          <button key={tab}
            onClick={() => switchTab(tab)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'transparent',
              color: activeTab === tab ? '#e50000' : '#666',
              borderBottom: activeTab === tab ? '3px solid #e50000' : '3px solid transparent',
              marginBottom: -2,
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Calendar tab */}
        {activeTab === 'calendar' && view === 'calendar' && (
          <div>
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
            <CalendarView sessions={sessions} viewDate={viewDate} onSelectDate={openSession} onNewSession={key => setModal({ type: 'new-session', dateKey: key })} />
            <div style={{ padding: '8px 20px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              Click any day to open an existing session or start a new one.
            </div>
          </div>
        )}

        {activeTab === 'calendar' && view === 'session' && selectedDate && sessions[selectedDate] && (
          <SessionView
            session={sessions[selectedDate]}
            onBack={() => setView('calendar')}
            onAddContract={() => setModal({ type: 'add-contract' })}
            onToggleDone={toggleDone}
            onDeleteContract={deleteContract}
            playerColors={playerColors}
          />
        )}

        {activeTab === 'roster' && <RosterView sessions={sessions} profiles={profiles} />}
        {activeTab === 'stats'  && <StatsView sessions={sessions} />}
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'new-session' && (
        <NewSessionModal dateKey={modal.dateKey} onSave={saveSession} onClose={() => setModal(null)} profiles={profiles} />
      )}
      {modal?.type === 'add-contract' && (
        <AddContractModal onSave={addContract} onClose={() => setModal(null)} commodities={commodities} systemsMap={systemsMap} />
      )}

      <AuthLog entries={authLog} />
    </div>
  );
}
