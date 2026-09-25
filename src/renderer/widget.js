(() => {
  'use strict';

  const avatarEl = document.getElementById('widget-avatar');
  const trackEl = document.getElementById('widget-track');
  const focusTimeEl = document.getElementById('widget-focus-time');
  const focusModeEl = document.getElementById('widget-focus-mode');
  const playBtn = document.getElementById('widget-play-btn');

  let lastAvatarSvg = null;

  function render(state) {
    if (!state) return;
    if (state.avatarSvg && state.avatarSvg !== lastAvatarSvg) {
      avatarEl.innerHTML = state.avatarSvg;
      lastAvatarSvg = state.avatarSvg;
    }
    trackEl.textContent = state.trackName || 'Nothing playing';
    focusTimeEl.textContent = state.focusTime || '25:00';
    focusModeEl.textContent = state.focusMode || 'Focus';
    playBtn.textContent = state.playing ? '⏸' : '▶';
  }

  if (window.codevibe && window.codevibe.onWidgetStateUpdate) {
    window.codevibe.onWidgetStateUpdate(render);
  }

  function sendAction(action) {
    if (window.codevibe && window.codevibe.sendWidgetAction) window.codevibe.sendWidgetAction(action);
  }

  playBtn.addEventListener('click', () => sendAction('play-pause'));
  document.getElementById('widget-prev-btn').addEventListener('click', () => sendAction('prev'));
  document.getElementById('widget-next-btn').addEventListener('click', () => sendAction('next'));
  document.getElementById('widget-close-btn').addEventListener('click', () => window.close());
})();
