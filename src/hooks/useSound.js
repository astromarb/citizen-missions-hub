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

export const SFX = {
  back:  () => _play('back-tap'),
  boop:  () => _play('entry-boop'),
  open:  () => _play('login-open'),
  plus:  () => _play('login-plus'),
  halt:  () => _play('halt-screetch'),
};
