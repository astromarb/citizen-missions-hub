import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase.js';

const xf = (s) => ({
  id: s.id,
  date: s.date,
  startedAt: s.started_at || null,
  pausedAt: s.paused_at || null,
  totalPausedMs: s.total_paused_ms || 0,
  endedAt: s.ended_at || null,
  players: (s.session_players || []).map(sp => sp.profiles?.callsign).filter(Boolean),
  members: (s.session_players || []).map(sp => sp.profiles).filter(Boolean),
  contracts: (s.contracts || []).map(c => ({
    id: c.id,
    type: c.type,
    system: c.system,
    done: c.done,
    payout: Number(c.payout) || 0,
    creatorId: c.creator_id || null,
    creatorCallsign: c.creator?.callsign || null,
    creatorColor: c.creator?.color || null,
    removalVotes: (c.contract_removal_votes || []).map(v => v.voter_id),
    pickups: (c.contract_waypoints || [])
      .filter(w => w.kind === 'pickup')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(w => ({
        id: w.id,
        name: w.location_name,
        body: w.body,
        completions: (w.waypoint_completions || []).map(wc => ({ profileId: wc.profile_id, status: wc.status })),
      })),
    dropoffs: (c.contract_waypoints || [])
      .filter(w => w.kind === 'dropoff')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(w => ({
        id: w.id,
        name: w.location_name,
        body: w.body,
        completions: (w.waypoint_completions || []).map(wc => ({ profileId: wc.profile_id, status: wc.status })),
      })),
    cargo: (c.cargo_items || []).map(ci => ({ id: ci.id, commodity: ci.commodity, scu: ci.scu })),
  })),
});

export function useSessions(enabled = true, userId) {
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        session_players ( profiles ( id, callsign, color, avatar_url, home_region ) ),
        contracts (
          *,
          creator:profiles!creator_id ( callsign, color ),
          contract_removal_votes ( voter_id ),
          contract_waypoints (
            id, kind, location_name, body, sort_order,
            waypoint_completions ( profile_id, status )
          ),
          cargo_items ( id, commodity, scu )
        )
      `)
      .order('date', { ascending: false });

    if (error) { console.error('useSessions:', error); setLoading(false); return; }

    const map = {};
    for (const s of (data || [])) map[s.date] = xf(s);
    setSessions(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();

    channelRef.current = supabase
      .channel('social-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waypoint_completions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contract_removal_votes' }, load)
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [load, enabled]);

  // ── createSession ──────────────────────────────────────────
  const createSession = useCallback(async (dateKey, players) => {
    const { data: sess, error } = await supabase
      .from('sessions')
      .insert({ date: dateKey })
      .select('id')
      .single();
    if (error) { console.error('createSession:', error); return null; }

    if (players.length) {
      const { data: profs } = await supabase
        .from('profiles').select('id, callsign').in('callsign', players);
      if (profs?.length) {
        await supabase.from('session_players').insert(
          profs.map(p => ({ session_id: sess.id, profile_id: p.id }))
        );
      }
    }

    const newSession = { id: sess.id, date: dateKey, players, members: [], contracts: [] };
    setSessions(prev => ({ ...prev, [dateKey]: newSession }));
    return newSession;
  }, []);

  // ── createContract ─────────────────────────────────────────
  const createContract = useCallback(async (sessionId, contract) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: c, error } = await supabase
      .from('contracts')
      .insert({ session_id: sessionId, type: contract.type, system: contract.system, done: false, creator_id: user?.id || null, payout: Number(contract.payout) || 0 })
      .select('id')
      .single();
    if (error) { console.error('createContract:', error); return; }

    const origin = contract.system.includes(' → ') ? contract.system.split(' → ')[0] : contract.system;
    const dest   = contract.system.includes(' → ') ? contract.system.split(' → ')[1] : contract.system;

    const waypoints = [
      ...contract.pickups.filter(p => p.name).map((p, i) => ({
        contract_id: c.id, kind: 'pickup', body: p.body || origin, location_name: p.name, sort_order: i,
      })),
      ...contract.dropoffs.filter(p => p.name).map((p, i) => ({
        contract_id: c.id, kind: 'dropoff', body: p.body || dest, location_name: p.name, sort_order: i,
      })),
    ];
    if (waypoints.length) await supabase.from('contract_waypoints').insert(waypoints);

    const cargoRows = contract.cargo.filter(ci => ci.commodity && Number(ci.scu) > 0);
    let insertedCargo = cargoRows.map(ci => ({ commodity: ci.commodity, scu: Number(ci.scu) }));
    if (cargoRows.length) {
      const { data: ins } = await supabase.from('cargo_items')
        .insert(cargoRows.map(ci => ({ contract_id: c.id, commodity: ci.commodity, scu: Number(ci.scu) })))
        .select('id, commodity, scu');
      if (ins) insertedCargo = ins;
    }

    await load();
  }, [load]);

  // ── toggleDone ─────────────────────────────────────────────
  const toggleDone = async (sessionId, contractId) => {
    let currentDone = false;
    for (const sess of Object.values(sessions)) {
      if (sess.id === sessionId) {
        const c = sess.contracts.find(c => c.id === contractId);
        if (c) { currentDone = c.done; break; }
      }
    }
    setSessions(prev => {
      const next = {};
      for (const [k, s] of Object.entries(prev)) {
        next[k] = s.id === sessionId
          ? { ...s, contracts: s.contracts.map(c => c.id === contractId ? { ...c, done: !c.done } : c) }
          : s;
      }
      return next;
    });
    const { error } = await supabase.from('contracts').update({ done: !currentDone }).eq('id', contractId);
    if (error) { console.error('toggleDone:', error); load(); }
  };

  // ── deleteContract ─────────────────────────────────────────
  const deleteContract = async (sessionId, contractId) => {
    setSessions(prev => {
      const next = {};
      for (const [k, s] of Object.entries(prev)) {
        next[k] = s.id === sessionId
          ? { ...s, contracts: s.contracts.filter(c => c.id !== contractId) }
          : s;
      }
      return next;
    });
    const { error } = await supabase.from('contracts').delete().eq('id', contractId);
    if (error) { console.error('deleteContract:', error); load(); }
  };

  // ── setWaypointStatus ──────────────────────────────────────
  const setWaypointStatus = useCallback(async (waypointId, status) => {
    if (!userId) return;
    if (status === null) {
      await supabase.from('waypoint_completions')
        .delete()
        .eq('waypoint_id', waypointId)
        .eq('profile_id', userId);
    } else {
      await supabase.from('waypoint_completions')
        .upsert({ waypoint_id: waypointId, profile_id: userId, status, updated_at: new Date().toISOString() }, { onConflict: 'waypoint_id,profile_id' });
    }
    await load();
  }, [userId, load]);

  // ── castRemovalVote ────────────────────────────────────────
  const castRemovalVote = useCallback(async (contractId, sessionId) => {
    if (!userId) return;
    await supabase.from('contract_removal_votes')
      .insert({ contract_id: contractId, voter_id: userId });

    const sess = Object.values(sessions).find(s => s.id === sessionId);
    const memberCount = sess?.members?.length || sess?.players?.length || 1;
    const threshold = Math.ceil(memberCount / 2 + 0.01);

    const { data: votes } = await supabase
      .from('contract_removal_votes')
      .select('voter_id')
      .eq('contract_id', contractId);

    if (votes && votes.length >= threshold) {
      await supabase.from('contracts').delete().eq('id', contractId);
    }

    await load();
  }, [userId, sessions, load]);

  // ── withdrawRemovalVote ────────────────────────────────────
  const withdrawRemovalVote = useCallback(async (contractId) => {
    if (!userId) return;
    await supabase.from('contract_removal_votes')
      .delete()
      .eq('contract_id', contractId)
      .eq('voter_id', userId);
    await load();
  }, [userId, load]);

  // ── addPlayerToSession ─────────────────────────────────────
  const addPlayerToSession = useCallback(async (sessionId, profileId) => {
    await supabase.from('session_players')
      .insert({ session_id: sessionId, profile_id: profileId });
    await load();
  }, [load]);

  // ── startSession ───────────────────────────────────────────
  const startSession = useCallback(async (sessionId) => {
    const now = new Date().toISOString();
    await supabase.from('sessions').update({ started_at: now, paused_at: null }).eq('id', sessionId);
    await load();
  }, [load]);

  // ── pauseSession ───────────────────────────────────────────
  const pauseSession = useCallback(async (sessionId) => {
    const now = new Date().toISOString();
    await supabase.from('sessions').update({ paused_at: now }).eq('id', sessionId);
    await load();
  }, [load]);

  // ── resumeSession ──────────────────────────────────────────
  const resumeSession = useCallback(async (sessionId) => {
    // Find current paused_at and accumulate
    const sess = Object.values(sessions).find(s => s.id === sessionId);
    if (!sess?.pausedAt) return;
    const addedMs = Date.now() - new Date(sess.pausedAt).getTime();
    await supabase.from('sessions').update({
      paused_at: null,
      total_paused_ms: (sess.totalPausedMs || 0) + addedMs,
    }).eq('id', sessionId);
    await load();
  }, [sessions, load]);

  // ── endSession ─────────────────────────────────────────────
  const endSession = useCallback(async (sessionId) => {
    const sess = Object.values(sessions).find(s => s.id === sessionId);
    let totalPausedMs = sess?.totalPausedMs || 0;
    // If currently paused, accumulate that pause too
    if (sess?.pausedAt) {
      totalPausedMs += Date.now() - new Date(sess.pausedAt).getTime();
    }
    await supabase.from('sessions').update({
      ended_at: new Date().toISOString(),
      paused_at: null,
      total_paused_ms: totalPausedMs,
    }).eq('id', sessionId);
    await load();
  }, [sessions, load]);

  return {
    sessions, loading,
    createSession, createContract, toggleDone, deleteContract,
    setWaypointStatus, castRemovalVote, withdrawRemovalVote, addPlayerToSession,
    startSession, pauseSession, resumeSession, endSession,
  };
}
