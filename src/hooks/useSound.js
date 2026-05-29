// Volumes tuned relative to each other: tab switches are subtle background
// feedback; interaction sounds (boop, open, plus) are slightly louder;
// halt is most prominent since it signals an error.
const SOUND_VOL = {
  'missions-switch':        0.28,
  'calendar-switch':        0.28,
  'stats-switch':           0.28,
  'leaderboards-switch':    0.28,
  'friends-switch':         0.28,
  'settings-switch':        0.28,
  'active-sessions-switch': 0.28,
  'entry-boop':             0.38,
  'login-open':             0.36,
  'login-plus':             0.36,
  'back-tap':               0.32,
  'halt-screetch':          0.42,
  'mission-complete':       0.44,
};

const _cache = {};

// Pre-create every Audio element at module load so first play has no fetch delay.
Object.keys(SOUND_VOL).forEach(name => {
  const a = new Audio(`/sounds/${name}.wav`);
  a.preload = 'auto';
  a.volume  = SOUND_VOL[name];
  _cache[name] = a;
});

function _play(name) {
  const a = _cache[name];
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {});
}

const TAB_SOUNDS = {
  missions:          'missions-switch',
  calendar:          'calendar-switch',
  stats:             'stats-switch',
  leaderboard:       'leaderboards-switch',
  friends:           'friends-switch',
  settings:          'settings-switch',
  'active-sessions': 'active-sessions-switch',
};

// ── Shared AudioContext for synthesized sounds ────────────────────────────────
// iOS Safari requires AudioContext to be created (or resumed) within a user
// gesture. We create it lazily on first interaction so mobile sounds work.
let _sharedCtx = null;

function _getCtx() {
  if (!_sharedCtx) {
    try {
      _sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return null; }
  }
  if (_sharedCtx.state === 'suspended') {
    _sharedCtx.resume().catch(() => {});
  }
  return _sharedCtx;
}

function _unlockAudio() {
  const ctx = _getCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', _unlockAudio, { once: true, passive: true });
  document.addEventListener('mousedown',  _unlockAudio, { once: true, passive: true });
}

// ─────────────────────────────────────────────────────────────────────────────

export const SFX = {
  back:     () => _play('back-tap'),
  boop:     () => _play('entry-boop'),
  open:     () => _play('login-open'),
  plus:     () => _play('login-plus'),
  halt:     () => _play('halt-screetch'),
  complete: () => _play('mission-complete'),
  tab:      (id) => _play(TAB_SOUNDS[id] || 'entry-boop'),

  msgIn: () => {
    try {
      const ctx = _getCtx();
      if (!ctx) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880,  ctx.currentTime);        // A5
      osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.08); // C6
      gain.gain.setValueAtTime(0.13, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  },

  notify: () => {
    try {
      const ctx = _getCtx();
      if (!ctx) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046, ctx.currentTime);       // C6
      osc.frequency.setValueAtTime(1318, ctx.currentTime + 0.1); // E6
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.55);
    } catch {}
  },
};
