import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase.js';

const xf = (s) => ({
  id: s.id,
  date: s.date,
  players: (s.session_players || []).map(sp => sp.profiles?.callsign).filter(Boolean),
  contracts: (s.contracts || []).map(c => ({
    id: c.id,
    type: c.type,
    system: c.system,
    done: c.done,
    pickups: (c.contract_waypoints || [])
      .filter(w => w.kind === 'pickup')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(w => ({ name: w.location_name, body: w.body })),
    dropoffs: (c.contract_waypoints || [])
      .filter(w => w.kind === 'dropoff')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(w => ({ name: w.location_name, body: w.body })),
    cargo: (c.cargo_items || []).map(ci => ({ id: ci.id, commodity: ci.commodity, scu: ci.scu })),
  })),
});

export function useSessions(enabled = true) {
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, date,
        session_players ( profiles ( id, callsign, color, avatar_url ) ),
        contracts (
          id, type, system, done, created_at,
          contract_waypoints ( kind, location_name, body, sort_order ),
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

  useEffect(() => { if (enabled) load(); }, [load, enabled]);

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

    const newSession = { id: sess.id, date: dateKey, players, contracts: [] };
    setSessions(prev => ({ ...prev, [dateKey]: newSession }));
    return newSession;
  }, []);

  // ── createContract ─────────────────────────────────────────
  const createContract = useCallback(async (sessionId, contract) => {
    const { data: c, error } = await supabase
      .from('contracts')
      .insert({ session_id: sessionId, type: contract.type, system: contract.system, done: false })
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

    const newContract = {
      id: c.id, type: contract.type, system: contract.system, done: false,
      pickups: contract.pickups.filter(p => p.name),
      dropoffs: contract.dropoffs.filter(p => p.name),
      cargo: insertedCargo,
    };

    setSessions(prev => {
      const key = Object.keys(prev).find(k => prev[k].id === sessionId);
      if (!key) return prev;
      return { ...prev, [key]: { ...prev[key], contracts: [...prev[key].contracts, newContract] } };
    });
  }, []);

  // ── toggleDone ─────────────────────────────────────────────
  // Not memoized — always captures fresh `sessions` from current render
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

  return { sessions, loading, createSession, createContract, toggleDone, deleteContract };
}
