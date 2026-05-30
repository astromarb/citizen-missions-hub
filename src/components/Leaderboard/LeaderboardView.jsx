import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { A } from '../../styles/animations.js';
import AnimatedNumber from '../shared/AnimatedNumber.jsx';
import { calcFleetValue } from '../../data/ships.js';

const rankMedal = (i) => i === 0 ? '#c41e3a' : i === 1 ? '#555' : i === 2 ? '#7a5c00' : 'var(--muted)';
const fmtSCU  = (n) => `${n.toLocaleString()} SCU`;
const fmtAUEC = (n) => n > 0 ? `${n.toLocaleString()} aUEC` : '—';
const fmt     = (n) => n.toLocaleString();

function Board({ title, rows, valueKey, format, myProfileId }) {
  const [open, setOpen] = useState(false);
  const top5 = rows.slice(0, 5);

  return (
    <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', overflow: 'hidden', animation: A.fadeIn() }}>

      {/* Clickable header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', border: 'none', cursor: 'pointer',
          background: open ? '#222' : '#1a1a1a',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
          color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? '#222' : '#1a1a1a'; }}
      >
        <span>{title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {rows.length > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
              TOP {Math.min(rows.length, 5)}
            </span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: open ? '#c41e3a' : 'rgba(255,255,255,0.45)',
            display: 'inline-block', transition: 'transform 0.2s ease, color 0.15s',
            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
          }}>▲</span>
        </span>
      </button>

      {open && rows.length === 0 && (
        <div style={{ padding: '20px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textAlign: 'center', animation: A.fadeIn() }}>
          No data yet.
        </div>
      )}

      {open && top5.map((p, i) => {
        const isMe = p.id === myProfileId;
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', borderBottom: '1px solid var(--bg-3)',
            background: isMe ? 'rgba(196,30,58,0.04)' : 'transparent',
            animation: A.rowOut(i),
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13, color: rankMedal(i), width: 22, flexShrink: 0, textAlign: 'center' }}>
              {i === 0 ? '★' : `${i + 1}`}
            </div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0, border: '2px solid var(--border)' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: isMe ? 800 : 700, fontSize: 13, color: isMe ? '#c41e3a' : 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>
              {p.callsign}{isMe ? ' ★' : ''}
            </div>
            <AnimatedNumber
              value={p[valueKey]}
              format={format}
              duration={500 + i * 80}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: i === 0 ? '#c41e3a' : 'var(--text)' }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, open, onToggle, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', border: '2px solid var(--border)', background: 'var(--bg-2)',
          cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
          textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)',
          marginBottom: open ? 12 : 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-3)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-2)'; }}
      >
        <span>{title}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--muted)', lineHeight: 1,
          transition: 'transform 0.2s ease',
          display: 'inline-block',
          transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
        }}>▲</span>
      </button>
      {open && (
        <div style={{ animation: A.slideDown() }}>
          {children}
        </div>
      )}
    </div>
  );
}

function WalletBoard({ rows, myProfileId, emptyMsg, title = 'Verified Balance', subtitle }) {
  const [open, setOpen] = useState(false);
  const top5 = rows.slice(0, 5);

  return (
    <div style={{ border: '2px solid var(--border)', background: 'var(--bg-1)', overflow: 'hidden', animation: A.fadeIn() }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', border: 'none', cursor: 'pointer',
          background: open ? '#222' : '#1a1a1a',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? '#222' : '#1a1a1a'; }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
            {subtitle || `self-reported · ${rows.length} pilot${rows.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {rows.length > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
              TOP {Math.min(rows.length, 5)}
            </span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: open ? '#c41e3a' : 'rgba(255,255,255,0.45)',
            display: 'inline-block', transition: 'transform 0.2s ease, color 0.15s',
            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
          }}>▲</span>
        </span>
      </button>

      {open && rows.length === 0 && (
        <div style={{ padding: '20px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textAlign: 'center', animation: A.fadeIn() }}>
          {emptyMsg}
        </div>
      )}

      {open && top5.map((p, i) => {
        const isMe = p.id === myProfileId;
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', borderBottom: '1px solid var(--bg-3)',
            background: isMe ? 'rgba(196,30,58,0.04)' : 'transparent',
            animation: A.rowOut(i),
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13, color: rankMedal(i), width: 22, flexShrink: 0, textAlign: 'center' }}>
              {i === 0 ? '★' : `${i + 1}`}
            </div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0, border: '2px solid var(--border)' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: isMe ? 800 : 700, fontSize: 13, color: isMe ? '#c41e3a' : 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>
              {p.callsign}{isMe ? ' ★' : ''}
            </div>
            <AnimatedNumber
              value={Number(p.balance)}
              format={(n) => `${n.toLocaleString()} aUEC`}
              duration={500 + i * 80}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: i === 0 ? '#c41e3a' : '#2d8659' }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardView({ sessions, myProfileId, profiles = [], friends = [] }) {
  const isMobile = useIsMobile();
  const [scope, setScope] = useState('global');
  const [walletOpen, setWalletOpen] = useState(true);
  const [netWorthOpen, setNetWorthOpen] = useState(true);

  const friendIds = new Set(friends.map(f => f.id));

  const statsMap = {};
  Object.values(sessions).forEach(sess => {
    const mc = sess.members?.length || 1;
    const sessSCU    = sess.contracts.reduce((t, c) => t + c.cargo.reduce((s, ci) => s + Number(ci.scu || 0), 0), 0);
    const sessPayout = sess.contracts.reduce((t, c) => t + (c.payout || 0), 0);

    sess.members?.forEach(m => {
      if (!statsMap[m.id]) statsMap[m.id] = { id: m.id, callsign: m.callsign, color: m.color || '#8b949e', sessions: 0, scu: 0, payout: 0, waypoints: 0 };
      statsMap[m.id].sessions++;
      statsMap[m.id].scu    += Math.floor(sessSCU    / mc);
      statsMap[m.id].payout += Math.floor(sessPayout / mc);
    });

    sess.contracts.forEach(c => {
      [...c.pickups, ...c.dropoffs].forEach(wp => {
        wp.completions?.forEach(comp => {
          if (comp.status === 'done' && statsMap[comp.profileId]) {
            statsMap[comp.profileId].waypoints++;
          }
        });
      });
    });
  });

  const isFriendsScope = scope === 'friends';
  const inScope = (id) => !isFriendsScope || id === myProfileId || friendIds.has(id);

  const players    = Object.values(statsMap).filter(p => inScope(p.id));
  const bySCU      = [...players].sort((a, b) => b.scu      - a.scu);
  const byPayout   = [...players].sort((a, b) => b.payout   - a.payout);
  const bySessions = [...players].sort((a, b) => b.sessions - a.sessions);
  const byWaypoints= [...players].sort((a, b) => b.waypoints- a.waypoints);

  const walletRows = profiles
    .filter(p => p.auec_balance > 0 && inScope(p.id))
    .sort((a, b) => b.auec_balance - a.auec_balance)
    .map(p => ({ id: p.id, callsign: p.callsign, color: p.color || '#8b949e', balance: p.auec_balance }));

  const netWorthRows = profiles
    .filter(p => inScope(p.id))
    .map(p => ({
      id: p.id,
      callsign: p.callsign,
      color: p.color || '#8b949e',
      balance: (Number(p.auec_balance) || 0) + calcFleetValue(p.owned_ships || []),
    }))
    .filter(p => p.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  const scopeTab = (key, label) => (
    <button
      key={key}
      onClick={() => setScope(key)}
      style={{
        padding: '8px 20px',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        cursor: 'pointer', border: 'none', borderBottom: `3px solid ${scope === key ? '#c41e3a' : 'transparent'}`,
        background: 'transparent',
        color: scope === key ? '#c41e3a' : 'var(--muted)',
        transition: 'color 0.15s',
      }}
    >{label}</button>
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '20px' }}>

      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 0 }}>Leaderboards</div>

      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 24, marginTop: 6 }}>
        {scopeTab('global',  'Global')}
        {scopeTab('friends', 'Friends')}
      </div>

      {/* ── Sessions Logged ── */}
      <div style={{ marginBottom: 16 }}>
        <Board title="Sessions Logged" rows={bySessions} valueKey="sessions" format={fmt} myProfileId={myProfileId} />
      </div>

      {/* ── WALLET section ── */}
      <Section title="Wallet" open={walletOpen} onToggle={() => setWalletOpen(v => !v)}>
        <WalletBoard
          key={scope}
          rows={walletRows}
          myProfileId={myProfileId}
          emptyMsg={isFriendsScope ? 'No friends have verified their wallet yet.' : 'No verified wallets yet.'}
        />
      </Section>

      {/* ── NET WORTH section ── */}
      <Section title="Net Worth" open={netWorthOpen} onToggle={() => setNetWorthOpen(v => !v)}>
        <WalletBoard
          key={scope + '-nw'}
          rows={netWorthRows}
          myProfileId={myProfileId}
          title="Net Worth"
          subtitle={`fleet + balance · ${netWorthRows.length} pilot${netWorthRows.length !== 1 ? 's' : ''}`}
          emptyMsg={isFriendsScope ? 'No friends have set up their fleet yet.' : 'No net worth data yet.'}
        />
      </Section>

    </div>
  );
}
