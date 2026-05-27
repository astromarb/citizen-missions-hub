import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';
import { useSessions } from '@/hooks/useSessions.js';
import { useRefData } from '@/hooks/useRefData.js';
import { useProfile } from '@/hooks/useProfile.js';
import { useFriends } from '@/hooks/useFriends.js';
import { SFX } from '@/hooks/useSound.js';
import CalendarView from '@/components/Calendar/CalendarView.jsx';
import SessionView from '@/components/Session/SessionView.jsx';
import AddContractModal from '@/components/Contract/AddContractModal.jsx';
import LoginScreen from '@/components/Auth/LoginScreen.jsx';
import AuthLog from '@/components/Auth/AuthLog.jsx';
import StatsView from '@/components/Stats/StatsView.jsx';
import FriendsView from '@/components/Friends/FriendsView.jsx';
import SettingsView from '@/components/Settings/SettingsView.jsx';
import OnboardingFlow from '@/components/Onboarding/OnboardingFlow.jsx';
import MissionsView from '@/components/Missions/MissionsView.jsx';
import LeaderboardView from '@/components/Leaderboard/LeaderboardView.jsx';
import { ToastProvider, useToast } from '@/components/shared/Toast.jsx';
import { PLAYER_COLORS } from '@/data/players.js';
import { fmtKey } from '@/utils/dateUtils.js';

const TODAY_KEY = fmtKey(new Date());

const TODAY = new Date();

const getUserName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.user_name ||
  user?.user_metadata?.name ||
  (user?.email ? user.email.split('@')[0] : null) ||
  'Pilot';

// ─── NEW SESSION MODAL ────────────────────────────────────────────────────────

function NewSessionModal({ dateKey, onSave, onClose, profiles, friends }) {
  const [players, setPlayers] = useState([]);
  const d = new Date(dateKey + 'T12:00:00');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const toggle = (callsign) => {
    SFX.boop();
    setPlayers(prev => prev.includes(callsign) ? prev.filter(x => x !== callsign) : [...prev, callsign]);
  };

  const friendList = (friends || []).map(f => ({ id: f.id, callsign: f.callsign, color: f.color || '#8b949e' }));
  const hasFriends = friendList.length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) { SFX.back(); onClose(); } }}>
      <div style={{ background: 'var(--bg-1)', border: '2px solid var(--border)', padding: '32px 28px', width: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
            textTransform: 'uppercase', letterSpacing: '-0.01em',
          }}>New Session</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>{label}</div>
        </div>
        <div style={{ height: 3, background: '#c41e3a', marginBottom: 22 }} />

        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, color: 'var(--text)',
        }}>Select crew from friends</div>

        {!hasFriends ? (
          <div style={{ padding: '18px 14px', background: 'var(--bg-2)', border: '2px dashed #ccc', marginBottom: 28, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>No friends yet</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Add crew from the Friends tab first.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {friendList.map(p => {
              const active = players.includes(p.callsign);
              const color = p.color;
              return (
                <button key={p.id} onClick={() => toggle(p.callsign)} style={{
                  padding: '7px 16px', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  border: `2px solid ${active ? color : 'var(--border)'}`,
                  background: active ? `${color}20` : 'var(--bg-1)',
                  color: active ? color : 'var(--text)',
                }}>{p.callsign}</button>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button
            style={{
              padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
            onClick={() => { SFX.back(); onClose(); }}
          >Cancel</button>
          <button
            style={{
              padding: '10px 24px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              border: `2px solid ${players.length ? '#c41e3a' : '#ccc'}`,
              background: players.length ? '#c41e3a' : 'var(--bg-3)',
              color: players.length ? '#fff' : '#999',
              cursor: players.length ? 'pointer' : 'default',
            }}
            onClick={() => { if (players.length) { SFX.open(); onSave({ date: dateKey, players }); } }}
          >Open Session →</button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

function AppInner() {
  const showToast = useToast();

  // ── Auth ──
  const [authSession, setAuthSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authLog, setAuthLog] = useState([]);
  const lastNameRef = useRef('Pilot');

  // ── Profiles ──
  const [profiles, setProfiles] = useState([]);

  // ── Nav ──
  const [activeTab, setActiveTab] = useState('missions');
  const [view, setView] = useState('calendar');
  const [viewDate, setViewDate] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [modal, setModal] = useState(null);
  const restoredRef = useRef(false);

  const userId = authSession?.user?.id || null;

  // ── Data hooks ──
  const {
    sessions, loading: sessionsLoading,
    createSession, createContract, toggleDone, deleteContract,
    setWaypointStatus, castRemovalVote, withdrawRemovalVote, addPlayerToSession,
    startSession, pauseSession, resumeSession, endSession,
    deleteSession, updateSession,
  } = useSessions(!!authSession, userId);
  const { commodities, systemsMap } = useRefData(!!authSession);
  const { profile, loading: profileLoading, checkCallsign, updateProfile, reload: reloadProfile } = useProfile(userId);
  const { friends, pending, sent, searchUsers, sendRequest, respond, remove: removeFriend } = useFriends(userId, !!authSession);

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
        SFX.open();
      } else if (event === 'SIGNED_OUT') {
        addLog('SIGNED_OUT', lastNameRef.current);
        SFX.back();
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

  useEffect(() => {
    if (!authSession) { setProfiles([]); return; }
    supabase.from('profiles').select('id, callsign, color, avatar_url').order('callsign')
      .then(({ data }) => { if (data) setProfiles(data); });
  }, [authSession]);

  const playerColors = { ...PLAYER_COLORS };
  profiles.forEach(p => { if (p.color) playerColors[p.callsign] = p.color; });

  // Restore session from URL on first load
  useEffect(() => {
    if (sessionsLoading || restoredRef.current) return;
    restoredRef.current = true;
    const sid = new URLSearchParams(window.location.search).get('session');
    if (sid && sessions[sid]) {
      const sess = sessions[sid];
      setSelectedSessionId(sid);
      setView('session');
      setActiveTab('calendar');
      setViewDate(new Date(sess.date + 'T12:00:00').setDate(1) && new Date(new Date(sess.date + 'T12:00:00').getFullYear(), new Date(sess.date + 'T12:00:00').getMonth(), 1));
    }
  }, [sessions, sessionsLoading]);

  const navMonth = (dir) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1));

  const openSession = (id) => {
    SFX.open();
    setSelectedSessionId(id);
    setView('session');
    window.history.replaceState(null, '', `?session=${id}`);
  };

  const closeSession = () => {
    SFX.back();
    setView('calendar');
    setSelectedSessionId(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const saveSession = async ({ date: dateKey, players }) => {
    const sess = await createSession(dateKey, players);
    if (sess) { setModal(null); openSession(sess.id); }
  };

  const addContract = async (contract) => {
    if (selectedSessionId) await createContract(selectedSessionId, contract);
    setModal(null);
    showToast('Contract added', 'success');
    SFX.plus();
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId);
    closeSession();
    showToast('Session deleted', 'info');
    SFX.halt();
  };

  const handleOpenSession = (id) => {
    const sess = sessions[id];
    if (!sess) return;
    const d = new Date(sess.date + 'T12:00:00');
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setActiveTab('calendar');
    openSession(id);
  };

  const handleToggleDone = (sessionId, contractId) => {
    toggleDone(sessionId, contractId);
    SFX.boop();
  };

  const handleDeleteContract = (sessionId, contractId) => {
    deleteContract(sessionId, contractId);
    showToast('Contract removed', 'info');
    SFX.back();
  };

  const handleSetWaypointStatus = (waypointId, status) => {
    setWaypointStatus(waypointId, status);
    if (status === 'failed') { SFX.halt(); showToast('Waypoint marked failed', 'error'); }
    else if (status === 'done') { SFX.boop(); showToast('Waypoint marked complete', 'success'); }
    else SFX.boop();
  };

  const handleCastVote = (contractId, sessionId) => {
    castRemovalVote(contractId, sessionId);
    SFX.boop();
    showToast('Removal vote cast', 'info');
  };

  const handleWithdrawVote = (contractId) => {
    withdrawRemovalVote(contractId);
    SFX.back();
    showToast('Vote withdrawn', 'info');
  };

  const handleAddPlayer = (sessionId, profileId) => {
    addPlayerToSession(sessionId, profileId);
    SFX.boop();
    showToast('Pilot invited to session', 'success');
  };

  const handleStartSession  = (sessionId) => { startSession(sessionId);  SFX.open(); showToast('Session started', 'success'); };
  const handlePauseSession  = (sessionId) => { pauseSession(sessionId);  SFX.back(); showToast('Session paused', 'info'); };
  const handleResumeSession = (sessionId) => { resumeSession(sessionId); SFX.boop(); showToast('Session resumed', 'success'); };
  const handleEndSession    = (sessionId) => { endSession(sessionId);    SFX.back(); showToast('Session ended', 'info'); };

  const handleFriendRequest = async (id) => {
    await sendRequest(id);
    SFX.plus();
    showToast('Friend request sent', 'success');
  };

  const handleFriendRespond = async (fid, accept) => {
    await respond(fid, accept);
    if (accept) { SFX.boop(); showToast('Friend request accepted', 'success'); }
    else { SFX.halt(); showToast('Request declined', 'info'); }
  };

  const handleRemoveFriend = async (fid) => {
    await removeFriend(fid);
    SFX.halt();
    showToast('Removed from crew', 'info');
  };

  // Derive per-date session lists for calendar
  const sessionsByDate = {};
  Object.values(sessions).forEach(s => {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  });

  const totalSessions  = Object.keys(sessions).length;
  const totalContracts = Object.values(sessions).reduce((t, s) => t + s.contracts.length, 0);
  const totalSCU       = Object.values(sessions).reduce((t, s) => t + s.contracts.reduce((ct, c) => ct + c.cargo.reduce((cg, x) => cg + Number(x.scu || 0), 0), 0), 0);
  const monthName      = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Initializing…</div>
      </div>
    );
  }

  if (!authSession) return <LoginScreen />;

  if (sessionsLoading || profileLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Loading…</div>
      </div>
    );
  }

  if (profile && !profile.onboarding_complete) {
    return (
      <OnboardingFlow
        profile={profile}
        updateProfile={updateProfile}
        checkCallsign={checkCallsign}
        onComplete={reloadProfile}
      />
    );
  }

  const userName  = getUserName(authSession.user);
  const avatarUrl = authSession.user?.user_metadata?.avatar_url;
  const myProfileId = profile?.id || null;
  const myCallsign  = profile?.callsign || null;

  const switchTab = (tab) => {
    SFX.boop();
    setActiveTab(tab);
    if (tab !== 'calendar') setView('calendar');
  };

  const TABS = [
    ['missions',     'Missions'],
    ['calendar',     'Calendar'],
    ['stats',        'Stats'],
    ['leaderboard',  'Leaderboard'],
    ['friends',      'Friends'],
    ['settings',     'Settings'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div style={{
        background: '#1a1a1a',
        borderBottom: '2px solid #000',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        gap: 0,
        flexShrink: 0,
      }}>
        {/* Wordmark */}
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
            letterSpacing: '0.06em', color: '#fff', textTransform: 'uppercase', lineHeight: 1,
          }}>CITIZEN</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
            letterSpacing: '0.18em', color: '#c41e3a', textTransform: 'uppercase', marginTop: 2,
          }}>MISSIONS HUB</div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {[['Sessions', totalSessions], ['Contracts', totalContracts], ['Total SCU', totalSCU.toLocaleString()]].map(([l, v], i) => (
            <div key={l} style={{
              padding: '10px 22px', textAlign: 'center', display: 'flex',
              flexDirection: 'column', justifyContent: 'center',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              borderRight: i === 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
                color: i === 2 ? '#c41e3a' : '#fff',
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>{v}</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 8,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3,
              }}>{l}</div>
            </div>
          ))}
        </div>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {avatarUrl && (
            <img src={avatarUrl} alt={userName}
              style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
          )}
          {!avatarUrl && (
            <div style={{
              width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)',
              background: profile?.color || '#8b949e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, fontFamily: 'var(--font-display)' }}>
                {(myCallsign || userName)[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            color: '#fff', maxWidth: 130,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {myCallsign || userName}
          </span>
          <button
            onClick={() => { SFX.back(); supabase.auth.signOut(); }}
            style={{
              padding: '5px 12px', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
          >Sign out</button>
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div style={{
        background: 'var(--bg-1)',
        borderBottom: '2px solid #000',
        display: 'flex',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        {TABS.map(([tab, label]) => (
          <button key={tab}
            onClick={() => switchTab(tab)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              background: 'transparent',
              color: activeTab === tab ? '#c41e3a' : 'var(--muted)',
              borderBottom: activeTab === tab ? '3px solid #c41e3a' : '3px solid transparent',
              marginBottom: -2,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--muted)'; }}
          >{label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 900, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Calendar tab */}
          {activeTab === 'calendar' && view === 'calendar' && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px 8px',
              }}>
                <button
                  style={{
                    border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', padding: '5px 14px',
                    cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
                  onClick={() => { SFX.back(); navMonth(-1); }}
                >←</button>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
                  letterSpacing: '-0.01em', color: 'var(--text)', textTransform: 'uppercase',
                }}>{monthName}</div>
                <button
                  style={{
                    border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', padding: '5px 14px',
                    cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
                  onClick={() => { SFX.back(); navMonth(1); }}
                >→</button>
              </div>
              <CalendarView
                sessionsByDate={sessionsByDate}
                viewDate={viewDate}
                onSelectDate={(id) => openSession(id)}
                onShowPicker={(key, sessList) => setModal({ type: 'session-picker', dateKey: key, sessions: sessList })}
                onNewSession={key => {
                  if (key > TODAY_KEY) { showToast('Cannot create sessions for future dates', 'info'); SFX.halt(); return; }
                  SFX.boop(); setModal({ type: 'new-session', dateKey: key });
                }}
              />
              <div style={{ padding: '8px 20px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                Click any day to open an existing session or start a new one.
              </div>
            </div>
          )}

          {activeTab === 'calendar' && view === 'session' && selectedSessionId && sessions[selectedSessionId] && (
            <SessionView
              session={sessions[selectedSessionId]}
              onBack={closeSession}
              onAddContract={() => { SFX.open(); setModal({ type: 'add-contract' }); }}
              onToggleDone={handleToggleDone}
              onDeleteContract={handleDeleteContract}
              onSetWaypointStatus={handleSetWaypointStatus}
              onCastRemovalVote={handleCastVote}
              onWithdrawVote={handleWithdrawVote}
              onAddPlayer={handleAddPlayer}
              onStartSession={handleStartSession}
              onPauseSession={handlePauseSession}
              onResumeSession={handleResumeSession}
              onEndSession={handleEndSession}
              onDeleteSession={handleDeleteSession}
              onUpdateSession={updateSession}
              playerColors={playerColors}
              myProfileId={myProfileId}
              myCallsign={myCallsign}
              friends={friends}
            />
          )}

          {activeTab === 'missions'    && <MissionsView sessions={sessions} myProfileId={myProfileId} profile={profile} avatarUrl={avatarUrl} onOpenSession={handleOpenSession} />}
          {activeTab === 'stats'       && <StatsView sessions={sessions} />}
          {activeTab === 'leaderboard' && <LeaderboardView sessions={sessions} myProfileId={myProfileId} />}
          {activeTab === 'friends'  && (
            <FriendsView
              friends={friends}
              pending={pending}
              sent={sent}
              searchUsers={searchUsers}
              sendRequest={handleFriendRequest}
              respond={handleFriendRespond}
              remove={handleRemoveFriend}
            />
          )}
          {activeTab === 'settings' && profile && (
            <SettingsView
              profile={profile}
              updateProfile={updateProfile}
              checkCallsign={checkCallsign}
            />
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'session-picker' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { SFX.back(); setModal(null); } }}>
          <div style={{ background: 'var(--bg-1)', border: '2px solid var(--border)', padding: '28px 24px', width: 380 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 6 }}>
              {new Date(modal.dateKey + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ height: 3, background: '#c41e3a', marginBottom: 18 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              {modal.sessions.length} sessions on this date
            </div>
            {modal.sessions.map(s => (
              <button key={s.id}
                onClick={() => { setModal(null); openSession(s.id); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                  padding: '12px 14px', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
                  border: '2px solid var(--border)', background: 'var(--bg-2)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)'; }}
              >
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {s.members?.map(m => m.callsign).join(', ') || s.players?.join(', ') || 'Solo'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>
                  {s.contracts.length}c
                </span>
              </button>
            ))}
            <button
              onClick={() => setModal({ type: 'new-session', dateKey: modal.dateKey })}
              style={{
                display: 'block', width: '100%', padding: '10px', marginTop: 4, cursor: 'pointer',
                border: '2px dashed var(--border)', background: 'transparent',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)',
              }}
            >+ New Session on this Date</button>
          </div>
        </div>
      )}

      {modal?.type === 'new-session' && (
        <NewSessionModal
          dateKey={modal.dateKey}
          onSave={saveSession}
          onClose={() => { SFX.back(); setModal(null); }}
          profiles={profiles}
          friends={friends}
        />
      )}
      {modal?.type === 'add-contract' && (
        <AddContractModal
          onSave={addContract}
          onClose={() => { SFX.back(); setModal(null); }}
          commodities={commodities}
          systemsMap={systemsMap}
        />
      )}

      <AuthLog entries={authLog} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
