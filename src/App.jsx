import { useState, useEffect, useRef, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { supabase } from '@/lib/supabase.js';
import { useSessions } from '@/hooks/useSessions.js';
import { useRefData } from '@/hooks/useRefData.js';
import { useProfile } from '@/hooks/useProfile.js';
import { useFriends } from '@/hooks/useFriends.js';
import { useSessionInvites } from '@/hooks/useSessionInvites.js';
import { useMessages } from '@/hooks/useMessages.js';
import { useIsMobile } from '@/hooks/useIsMobile.js';
import { SFX } from '@/hooks/useSound.js';
import { A } from '@/styles/animations.js';
import CalendarView from '@/components/Calendar/CalendarView.jsx';
import { getTheme } from '@/data/cardThemes.js';
import SessionView from '@/components/Session/SessionView.jsx';
import JoinSessionModal from '@/components/Session/JoinSessionModal.jsx';
import AddContractModal from '@/components/Contract/AddContractModal.jsx';
import SessionManageList from '@/components/Session/SessionManageList.jsx';
import LoginScreen from '@/components/Auth/LoginScreen.jsx';
import GuestSessionView from '@/components/Session/GuestSessionView.jsx';
import StatsView from '@/components/Stats/StatsView.jsx';
import FriendsView from '@/components/Friends/FriendsView.jsx';
import SettingsView from '@/components/Settings/SettingsView.jsx';
import OnboardingFlow from '@/components/Onboarding/OnboardingFlow.jsx';
import MissionsView from '@/components/Missions/MissionsView.jsx';
import LeaderboardView from '@/components/Leaderboard/LeaderboardView.jsx';
import FriendProfileView from '@/components/Friends/FriendProfileView.jsx';
import PublicProfileView from '@/components/Public/PublicProfileView.jsx';
import ActiveSessionsView from '@/components/ActiveSessions/ActiveSessionsView.jsx';
import AdminView from '@/components/Admin/AdminView.jsx';
import { ToastProvider, useToast } from '@/components/shared/Toast.jsx';
import { PLAYER_COLORS } from '@/data/players.js';
import { fmtKey } from '@/utils/dateUtils.js';
import { useTheme } from '@/hooks/useTheme.js';

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
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const d = new Date(dateKey + 'T12:00:00');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const friendList = (friends || []).map(f => ({ id: f.id, callsign: f.callsign, color: f.color || '#8b949e' }));
  const hasFriends = friendList.length > 0;

  const filtered = friendList.filter(f =>
    !players.includes(f.callsign) &&
    (query.trim() === '' || f.callsign.toLowerCase().includes(query.toLowerCase()))
  );

  const addPlayer = (callsign) => {
    SFX.boop();
    setPlayers(prev => [...prev, callsign]);
    setQuery('');
    setDropdownOpen(false);
  };

  const removePlayer = (callsign) => {
    setPlayers(prev => prev.filter(x => x !== callsign));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) { SFX.back(); onClose(); } }}>
      <div style={{ background: 'var(--bg-1)', border: '2px solid var(--border)', padding: '32px 28px', width: 420, maxWidth: '100%', animation: A.pop() }}>
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
        }}>Select crew from friends <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em' }}>(optional — leave empty to fly solo)</span></div>

        {!hasFriends ? (
          <div style={{ padding: '18px 14px', background: 'var(--bg-2)', border: '2px dashed #ccc', marginBottom: 28, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>No friends yet</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>You can still fly solo — or add crew from the Friends tab.</div>
          </div>
        ) : (
          <div style={{ marginBottom: 28 }}>
            {/* Selected crew chips */}
            {players.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {players.map(cs => {
                  const f = friendList.find(x => x.callsign === cs);
                  const chipColor = f?.color || '#8b949e';
                  return (
                    <div key={cs} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 8px 4px 10px',
                      border: `2px solid ${chipColor}`,
                      background: `${chipColor}22`,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: chipColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: chipColor }}>{cs}</span>
                      <button
                        onClick={() => removePlayer(cs)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: chipColor, fontWeight: 800, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                      >×</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search input + dropdown */}
            <div style={{ position: 'relative' }}
              onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropdownOpen(false); }}>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                placeholder={players.length ? 'Add more crew…' : 'Search crew by callsign…'}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '2px solid var(--border)', background: 'var(--bg-1)',
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
                  color: 'var(--text)', outline: 'none', letterSpacing: '0.02em',
                }}
              />
              {dropdownOpen && filtered.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  border: '2px solid var(--border)', borderTop: 'none',
                  background: 'var(--bg-1)', zIndex: 10, maxHeight: 200, overflowY: 'auto',
                  animation: A.slideDown(),
                }}>
                  {filtered.map(f => (
                    <button
                      key={f.id}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => addPlayer(f.callsign)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '9px 14px', cursor: 'pointer',
                        border: 'none', borderBottom: '1px solid var(--bg-2)',
                        background: 'var(--bg-1)', textAlign: 'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-1)'; }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: f.color, border: '1px solid var(--border)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)' }}>{f.callsign}</span>
                    </button>
                  ))}
                </div>
              )}
              {dropdownOpen && filtered.length === 0 && query.trim() !== '' && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  border: '2px solid var(--border)', borderTop: 'none',
                  background: 'var(--bg-1)', zIndex: 10,
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
                }}>No match found</div>
              )}
            </div>
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
              border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#a01830'; e.currentTarget.style.borderColor = '#a01830'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
            onClick={() => { SFX.open(); onSave({ date: dateKey, players }); }}
          >{players.length ? 'Open Session →' : 'Fly Solo →'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

function AppInner() {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const [darkMode, setDarkMode] = useTheme();

  // ── Auth ──
  const [authSession, setAuthSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [forceLogin, setForceLogin] = useState(false);

  // ── Profiles ──
  const [profiles, setProfiles] = useState([]);

  // ── Nav ──
  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab) return urlTab;
    const urlUser = new URLSearchParams(window.location.search).get('user');
    if (urlUser) return 'friends'; // will redirect to missions if it's own callsign
    try { return localStorage.getItem('cmh-active-tab') || 'missions'; } catch { return 'missions'; }
  });
  const [view, setView] = useState('calendar');
  const [viewDate, setViewDate] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [modal, setModal] = useState(null);
  const [viewingFriend, setViewingFriend] = useState(null);
  const [manageMode, setManageMode] = useState(false);
  const restoredRef = useRef(false);
  const urlUserOnLoad = useRef(new URLSearchParams(window.location.search).get('user')?.toLowerCase() ?? null);
  const urlUserProcessed = useRef(false);

  const userId = authSession?.user?.id || null;

  // ── Data hooks ──
  const {
    sessions, loading: sessionsLoading,
    createSession, createContract, toggleDone, deleteContract,
    setWaypointStatus, castRemovalVote, withdrawRemovalVote, addPlayerToSession,
    startSession, pauseSession, resumeSession, endSession,
    deleteSession, updateSession, updateContract,
    updateWaypoint, updateCargoItem, addCargoItemLive, addWaypointLive, logTradeSell,
    leaveSession, removePlayerFromSession,
  } = useSessions(!!authSession, userId);
  const { commodities, systemsMap } = useRefData(!!authSession);
  const { profile, loading: profileLoading, checkCallsign, updateProfile, reload: reloadProfile } = useProfile(userId);
  const { friends, pending, sent, searchUsers, sendRequest, respond, remove: removeFriend } = useFriends(userId, !!authSession);
  const [joinToken, setJoinToken] = useState(() => new URLSearchParams(window.location.search).get('join'));

  // Declared early so they're available in useEffect dependency arrays below
  const myProfileId = profile?.id || null;
  const myCallsign  = profile?.callsign || null;

  const { incoming: sessionInvites, createInvite, respondToInvite } = useSessionInvites(myProfileId, !!authSession);

  const friendsRef   = useRef(friends);
  friendsRef.current = friends;
  const activeTabRef   = useRef(activeTab);
  activeTabRef.current = activeTab;

  const handleNewMessage = useCallback((row) => {
    let label;
    if (row.is_system) {
      label = 'New message from Nexus Hub System';
    } else {
      const sender = friendsRef.current?.find(f => f.id === row.sender_id);
      label = sender ? `New message from ${sender.callsign}` : 'New message received';
    }
    showToast(label, 'message', 8000);
    // Skip the global notify sound when already on the Social tab — the
    // ChatModal plays its own in-chat sound so the user hears it once.
    if (activeTabRef.current !== 'friends') SFX.notify();
  }, [showToast]);

  const { conversations, sendMessage, markRead, deleteMessage, deleteAllSystemMessages, unreadCount: msgUnread } = useMessages(myProfileId, !!authSession, handleNewMessage);

  useEffect(() => {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('auth-timeout')), 12000));
    Promise.race([supabase.auth.getSession(), timeout])
      .then(({ data: { session } }) => {
        setAuthSession(session);
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthSession(session);
      if (event === 'SIGNED_IN') SFX.open();
      else if (event === 'SIGNED_OUT') SFX.back();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authSession) { setProfiles([]); return; }
    supabase.from('profiles').select('id, callsign, color, avatar_url, auec_balance, auec_balance_verified_at, owned_ships').order('callsign')
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
      setViewDate(new Date(sess.date + 'T12:00:00').setDate(1) && new Date(new Date(sess.date + 'T12:00:00').getFullYear(), new Date(sess.date + 'T12:00:00').getMonth(), 1));
    }
  }, [sessions, sessionsLoading]);

  // ── Deep-link: ?user=callsign ──────────────────────────────────────────────
  useEffect(() => {
    if (urlUserProcessed.current) return;
    if (!urlUserOnLoad.current) { urlUserProcessed.current = true; return; }
    if (profileLoading || sessionsLoading) return;

    const target = urlUserOnLoad.current;
    urlUserProcessed.current = true;

    if (myCallsign?.toLowerCase() === target) {
      setActiveTab('missions');
      window.history.replaceState(null, '', `?tab=missions`);
      return;
    }

    const knownFriend = (friends || []).find(f => f.callsign?.toLowerCase() === target);
    if (knownFriend) {
      setViewingFriend(knownFriend);
      setActiveTab('friends');
      return;
    }

    supabase.from('profiles')
      .select('id, callsign, color, avatar_url, home_region, badges, banner_panel')
      .ilike('callsign', target)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setViewingFriend(data); setActiveTab('friends'); }
      });
  }, [profileLoading, sessionsLoading, myCallsign, friends]);

  const openFriendProfile = (f) => {
    SFX.open();
    setViewingFriend(f);
    window.history.replaceState(null, '', `?user=${encodeURIComponent(f.callsign?.toLowerCase() ?? '')}`);
  };

  const closeFriendProfile = () => {
    SFX.back();
    setViewingFriend(null);
    window.history.replaceState(null, '', `?tab=friends`);
  };

  const navMonth = (dir) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1));

  const openSession = (id) => {
    SFX.open();
    setSelectedSessionId(id);
    setView('session');
    window.history.replaceState(null, '', `?tab=${activeTab}&session=${id}`);
  };

  const closeSession = () => {
    SFX.back();
    setView('calendar');
    setSelectedSessionId(null);
    window.history.replaceState(null, '', `?tab=${activeTab}`);
  };

  const saveSession = async ({ date: dateKey, players }) => {
    const sess = await createSession(dateKey, players);
    if (sess) {
      setModal(null);
      setActiveTab('calendar');
      openSession(sess.id);
    }
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
    openSession(id);
  };

  const handleToggleDone = (sessionId, contractId) => {
    const contract = sessions[sessionId]?.contracts.find(c => c.id === contractId);
    const wasDone = contract?.done ?? false;
    const wasPartial = contract?.partial ?? false;
    toggleDone(sessionId, contractId);
    // pending → complete
    if (!wasDone) SFX.complete();
    // complete → partial, or partial → pending
    else SFX.boop();
    if (wasDone && wasPartial) SFX.back();
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

  const handleInvitePlayer = async (sessionId, profileId) => {
    const ok = await createInvite(sessionId, profileId);
    SFX.boop();
    showToast(ok ? 'Session invite sent' : 'Could not send invite — pilot may already be in session', ok ? 'success' : 'error');
  };

  const handleRespondToSessionInvite = async (inviteId, accept, sessionId) => {
    const result = await respondToInvite(inviteId, accept, sessionId);
    if (accept && result) {
      SFX.open();
      showToast('Joined session!', 'success');
      handleOpenSession(sessionId);
    } else if (!accept) {
      SFX.back();
      showToast('Invite declined', 'info');
    } else {
      showToast('Could not join session', 'error');
    }
  };

  const handleLeaveSession = async (sessionId) => {
    await leaveSession(sessionId);
    closeSession();
    showToast('You left the session', 'info');
    SFX.back();
  };

  const handleRemovePlayer = async (sessionId, profileId) => {
    await removePlayerFromSession(sessionId, profileId);
    showToast('Pilot removed from session', 'info');
    SFX.boop();
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

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Initializing…</div>
      </div>
    );
  }

  if (!authSession) {
    const publicUser = new URLSearchParams(window.location.search).get('user');
    if (publicUser && !forceLogin) {
      return (
        <PublicProfileView
          callsign={publicUser}
          onSignIn={() => {
            window.history.replaceState(null, '', '/');
            setForceLogin(true);
          }}
        />
      );
    }
    if (joinToken && !forceLogin) {
      return (
        <GuestSessionView
          inviteToken={joinToken}
          onSignIn={() => setForceLogin(true)}
        />
      );
    }
    return <LoginScreen joinToken={joinToken} />;
  }

  if (sessionsLoading || profileLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Loading…</div>
      </div>
    );
  }

  if (!profile || !profile.onboarding_complete) {
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

  const switchTab = (tab) => {
    SFX.tab(tab);
    setActiveTab(tab);
    try { localStorage.setItem('cmh-active-tab', tab); } catch {}
    if (tab !== 'calendar') setView('calendar');
    if (tab !== 'friends') setViewingFriend(null);
    if (tab !== 'active-sessions') setManageMode(false);
    window.history.replaceState(null, '', `?tab=${tab}`);
  };

  const totalPendingRequests = (pending?.length || 0) + (sessionInvites?.length || 0);
  const socialBadge = totalPendingRequests + msgUnread;
  const TABS = [
    ['missions',        'Missions',     '◎'],
    ['calendar',        'Calendar',     '⊞'],
    ['active-sessions', 'Sessions',     '▦'],
    ['stats',           'Stats',        '◷'],
    ['leaderboard',     'Leaderboards', '★'],
    ['friends',         socialBadge > 0 ? `Social (${socialBadge})` : 'Social', '◈'],
    ['settings',        'Settings',     '⊡'],
    ...(profile?.is_admin ? [['admin', 'Admin', '⊘']] : []),
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
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 13 : 18,
            letterSpacing: '0.06em', color: '#fff', textTransform: 'uppercase', lineHeight: 1,
          }}>CITIZEN</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 7 : 10,
            letterSpacing: '0.18em', color: '#c41e3a', textTransform: 'uppercase', marginTop: 2,
          }}>MISSIONS HUB</div>
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
            color: '#fff',
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
      <div className="no-scrollbar" style={{
        background: 'var(--bg-1)',
        borderBottom: '2px solid #000',
        display: isMobile ? 'none' : 'flex',
        padding: isMobile ? '0 8px' : '0 24px',
        flexShrink: 0,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {TABS.map(([tab, label, icon]) => (
          <button key={tab}
            onClick={() => switchTab(tab)}
            style={{
              padding: isMobile ? '10px 14px' : '10px 24px',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: isMobile ? 11 : 12,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'transparent',
              color: activeTab === tab ? '#c41e3a' : 'var(--muted)',
              borderBottom: activeTab === tab ? '3px solid #c41e3a' : '3px solid transparent',
              marginBottom: -2,
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--muted)'; }}
          >{label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 64 : 0 }}>
        <div style={{ maxWidth: (activeTab === 'calendar' && view === 'calendar') ? '100%' : isMobile ? '100%' : 1400, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Session view — rendered regardless of which tab opened it */}
          {view === 'session' && selectedSessionId && sessions[selectedSessionId] && (
            <SessionView
              session={sessions[selectedSessionId]}
              onBack={closeSession}
              onAddContract={() => { SFX.open(); setModal({ type: 'add-contract' }); }}
              onToggleDone={handleToggleDone}
              onDeleteContract={handleDeleteContract}
              onSetWaypointStatus={handleSetWaypointStatus}
              onCastRemovalVote={handleCastVote}
              onWithdrawVote={handleWithdrawVote}
              onInvitePlayer={handleInvitePlayer}
              onStartSession={handleStartSession}
              onPauseSession={handlePauseSession}
              onResumeSession={handleResumeSession}
              onEndSession={handleEndSession}
              onDeleteSession={handleDeleteSession}
              onUpdateSession={updateSession}
              onUpdateContract={updateContract}
              onUpdateWaypoint={updateWaypoint}
              onUpdateCargoItem={updateCargoItem}
              onAddCargoItemLive={addCargoItemLive}
              onAddWaypointLive={addWaypointLive}
              onLogTradeSell={logTradeSell}
              onLeaveSession={handleLeaveSession}
              onRemovePlayer={handleRemovePlayer}
              commodities={commodities}
              systemsMap={systemsMap}
              playerColors={playerColors}
              myProfileId={myProfileId}
              myCallsign={myCallsign}
              friends={friends}
              onCopyInviteLink={() => {
                const token = sessions[selectedSessionId]?.inviteToken;
                if (!token) return;
                const link = `${window.location.origin}${window.location.pathname}?join=${token}`;
                navigator.clipboard.writeText(link).then(() => showToast('Invite link copied to clipboard', 'success'));
              }}
            />
          )}

          {/* Tab content — hidden while session is open */}
          {view !== 'session' && (<>

          {/* Calendar tab — full width */}
          {activeTab === 'calendar' && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '12px 12px 6px' : '16px 24px 8px',
              }}>
                <button
                  style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
                  onClick={() => { SFX.back(); navMonth(-1); }}
                >←</button>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 14 : 18, letterSpacing: '-0.01em', color: 'var(--text)', textTransform: 'uppercase' }}>{monthName}</div>
                <button
                  style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(); e.currentTarget.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }}
                  onClick={() => { SFX.back(); navMonth(1); }}
                >→</button>
              </div>
              <CalendarView
                sessionsByDate={sessionsByDate}
                viewDate={viewDate}
                myProfileId={myProfileId}
                onSelectDate={(id) => openSession(id)}
                onShowPicker={(key, sessList) => setModal({ type: 'session-picker', dateKey: key, sessions: sessList })}
                onNewSession={key => {
                  if (key > TODAY_KEY) { showToast('Cannot create sessions for future dates', 'info'); SFX.halt(); return; }
                  SFX.boop(); setModal({ type: 'new-session', dateKey: key });
                }}
                cardTheme={getTheme(profile?.card_theme)}
              />
              <div style={{ padding: isMobile ? '6px 12px 12px' : '8px 24px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                Click any day to open an existing session or start a new one.
              </div>
            </div>
          )}

          {activeTab === 'missions' && (
            <div style={{ animation: A.fadeUp(), flex: 1, minHeight: 0 }}>
              <MissionsView sessions={sessions} myProfileId={myProfileId} profile={profile} avatarUrl={avatarUrl} onOpenSession={handleOpenSession} cardTheme={getTheme(profile?.card_theme)} />
            </div>
          )}
          {activeTab === 'active-sessions' && (
            <div style={{ animation: A.fadeUp(), flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {/* ── Sessions action bar ── */}
              <div style={{
                padding: isMobile ? '10px 12px' : '14px 24px',
                display: 'flex', gap: 8, flexWrap: 'wrap',
                borderBottom: '2px solid var(--border)',
                background: 'var(--bg-1)',
                flexShrink: 0,
              }}>
                <button
                  onClick={() => { SFX.boop(); setManageMode(false); setModal({ type: 'new-session', dateKey: TODAY_KEY }); }}
                  style={{
                    padding: '9px 18px', cursor: 'pointer',
                    border: '2px solid #c41e3a', background: '#c41e3a', color: '#fff',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#a01830'; e.currentTarget.style.borderColor = '#a01830'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#c41e3a'; e.currentTarget.style.borderColor = '#c41e3a'; }}
                >+ Add Session Today</button>
                <button
                  onClick={() => { SFX.boop(); setManageMode(m => !m); }}
                  style={{
                    padding: '9px 18px', cursor: 'pointer',
                    border: `2px solid ${manageMode ? 'var(--text)' : 'var(--border)'}`,
                    background: manageMode ? 'var(--text)' : 'var(--bg-1)',
                    color: manageMode ? 'var(--bg-0)' : 'var(--muted)',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}
                  onMouseEnter={e => { if (!manageMode) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--text)'; } }}
                  onMouseLeave={e => { if (!manageMode) { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
                >{manageMode ? '← Sessions' : 'Manage Sessions'}</button>
              </div>
              {manageMode ? (
                <SessionManageList
                  sessions={sessions}
                  myProfileId={myProfileId}
                  onDelete={handleDeleteSession}
                  onUpdate={updateSession}
                  onOpen={id => { setManageMode(false); handleOpenSession(id); }}
                />
              ) : (
                <ActiveSessionsView sessions={sessions} myProfileId={myProfileId} onOpenSession={handleOpenSession} cardTheme={getTheme(profile?.card_theme)} />
              )}
            </div>
          )}
          {activeTab === 'stats' && (
            <div style={{ animation: A.fadeUp(), flex: 1, minHeight: 0 }}>
              <StatsView sessions={sessions} myProfileId={myProfileId} />
            </div>
          )}
          {activeTab === 'leaderboard' && (
            <div style={{ animation: A.fadeUp(), flex: 1, minHeight: 0 }}>
              <LeaderboardView sessions={sessions} myProfileId={myProfileId} profiles={profiles} friends={friends} />
            </div>
          )}
          {activeTab === 'friends' && !viewingFriend && (
            <div style={{ animation: A.fadeUp(), flex: 1, minHeight: 0 }}>
              <FriendsView
                friends={friends}
                pending={pending}
                sent={sent}
                sessionInvites={sessionInvites}
                searchUsers={searchUsers}
                sendRequest={handleFriendRequest}
                respond={handleFriendRespond}
                remove={handleRemoveFriend}
                onViewProfile={openFriendProfile}
                onRespondToSessionInvite={handleRespondToSessionInvite}
                conversations={conversations}
                sendMessage={sendMessage}
                markRead={markRead}
                deleteMessage={deleteMessage}
                myProfileId={myProfileId}
                isMobile={isMobile}
              />
            </div>
          )}
          {activeTab === 'friends' && viewingFriend && (
            <div style={{ animation: A.fadeUp(), flex: 1, minHeight: 0 }}>
              <FriendProfileView
                friend={viewingFriend}
                sessions={sessions}
                myProfileId={myProfileId}
                onBack={closeFriendProfile}
                onOpenSession={handleOpenSession}
              />
            </div>
          )}
          {activeTab === 'settings' && profile && (
            <div style={{ animation: A.fadeUp(), flex: 1, minHeight: 0 }}>
              <SettingsView
                profile={profile}
                updateProfile={updateProfile}
                checkCallsign={checkCallsign}
                systemMsgCount={conversations.filter(c => c.isSystem).length}
                deleteAllSystemMessages={deleteAllSystemMessages}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            </div>
          )}

          {activeTab === 'admin' && profile?.is_admin && (
            <div style={{ animation: A.fadeUp(), flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <AdminView />
            </div>
          )}

          </>)}
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
          background: 'var(--bg-1)', borderTop: '2px solid #000',
          display: 'flex', alignItems: 'stretch',
        }}>
          {TABS.map(([tab, label, icon]) => (
            <button key={tab}
              onClick={() => switchTab(tab)}
              style={{
                flex: 1, padding: '8px 2px 6px', border: 'none', cursor: 'pointer',
                background: 'transparent', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                color: activeTab === tab ? '#c41e3a' : 'var(--muted)',
                borderTop: activeTab === tab ? '2px solid #c41e3a' : '2px solid transparent',
                marginTop: -2,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>{label.split(' (')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Join Session Modal (from invite link ?join=TOKEN) ── */}
      {joinToken && myProfileId && (
        <JoinSessionModal
          token={joinToken}
          myProfileId={myProfileId}
          onJoined={(sessionId) => {
            setJoinToken(null);
            SFX.open();
            showToast('Joined session!', 'success');
            handleOpenSession(sessionId);
          }}
          onDismiss={() => {
            setJoinToken(null);
            SFX.back();
            window.history.replaceState(null, '', `?tab=${activeTab}`);
          }}
        />
      )}

      {/* ── Modals ── */}
      {modal?.type === 'session-picker' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { SFX.back(); setModal(null); } }}>
          <div style={{ background: 'var(--bg-1)', border: '2px solid var(--border)', padding: '28px 24px', width: 380, animation: A.pop() }}>
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

      {/* ── Mobile bottom nav ── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: 'var(--bg-1)', borderTop: '2px solid var(--border)',
          display: 'flex', alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          {TABS.slice(0, 6).map(([tab, label, icon]) => {
            const active = activeTab === tab;
            const hasBadge = tab === 'friends' && socialBadge > 0;
            return (
              <button key={tab} onClick={() => switchTab(tab)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 4px 6px', border: 'none', background: 'transparent', cursor: 'pointer',
                  borderTop: active ? '2px solid #c41e3a' : '2px solid transparent',
                  marginTop: -2, position: 'relative',
                }}>
                {hasBadge && (
                  <div style={{ position: 'absolute', top: 6, right: '50%', marginRight: -16, width: 7, height: 7, borderRadius: '50%', background: '#c41e3a' }} />
                )}
                <span style={{ fontSize: 16, lineHeight: 1, color: active ? '#c41e3a' : 'var(--muted)', marginBottom: 3 }}>{icon}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: active ? '#c41e3a' : 'var(--muted)' }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
      <Analytics />
    </ToastProvider>
  );
}
