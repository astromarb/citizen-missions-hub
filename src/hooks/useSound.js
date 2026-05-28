const _cache = {};

function _get(name) {
  if (!_cache[name]) {
    const a = new Audio(`/sounds/${name}.wav`);
    a.preload = 'auto';
    _cache[name] = a;
  }
  return _cache[name];
}

function _play(name) {
  const a = _get(name);
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

export const SFX = {
  back:  () => _play('back-tap'),
  boop:  () => _play('entry-boop'),
  open:  () => _play('login-open'),
  plus:  () => _play('login-plus'),
  halt:  () => _play('halt-screetch'),
  tab:   (id) => _play(TAB_SOUNDS[id] || 'entry-boop'),
};
