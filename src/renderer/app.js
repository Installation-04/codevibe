(() => {
  'use strict';

  const STORAGE_KEY = 'codevibe.settings.v1';

  const THEMES = {
    lofi:      { label: 'Lofi Sunset',   bg1: '#241726', bg2: '#0d0714', accent: '#ff9f6e' },
    ambient:   { label: 'Ambient Forest',bg1: '#0f2318', bg2: '#04120c', accent: '#7fd8a0' },
    synthwave: { label: 'Synthwave',     bg1: '#1a0b2e', bg2: '#05010f', accent: '#ff3fa4' },
    midnight:  { label: 'Midnight Focus',bg1: '#0b1220', bg2: '#02030a', accent: '#5fb4ff' },
    codefi:    { label: 'Codefi Neon',   bg1: '#0a0f12', bg2: '#020404', accent: '#39ff9c' },
    rain:      { label: 'Rainy Night',   bg1: '#151b26', bg2: '#05070c', accent: '#8ea9c9' },
    matrix:    { label: 'Matrix',        bg1: '#001904', bg2: '#000000', accent: '#00ff41', vizStyle: 'matrix' },
    cyberpunk: { label: 'Cyberpunk',     bg1: '#150826', bg2: '#050014', accent: '#00e5ff' },
    retrocyber:{ label: 'Retro Cyberpunk', bg1: '#2b0a3d', bg2: '#0a0014', accent: '#ff2079' },
    retrogames:{ label: 'Retro Games',   bg1: '#101820', bg2: '#03060a', accent: '#ffd400' },
    sleek:     { label: 'Sleek',         bg1: '#14161a', bg2: '#050607', accent: '#5b8def' },
    minimalist:{ label: 'Minimalist',    bg1: '#111214', bg2: '#000000', accent: '#d8d8d8' },
    vibecoding:{ label: 'VibeCoding',    bg1: '#1e1b4b', bg2: '#020617', accent: '#a78bfa' },
    hacker:    { label: 'Retro Hacker',  bg1: '#1a1400', bg2: '#000000', accent: '#ffb000', vizStyle: 'matrix' }
  };

  const defaultState = {
    theme: 'lofi',
    customAccent: null,
    customBg1: null,
    customBg2: null,
    vizStyle: 'bars',
    clockVisible: true,
    clockFormat: '24',
    clockSeconds: true,
    clockPos: null,
    volume: 70,
    tracks: [],
    streamHistory: [],
    bgMode: 'dynamic',
    bgPattern: 'gradient',
    wallpaperPath: null,
    wallpaperFit: 'cover',
    wallpaperDim: 35,
    wallpaperBlur: 0,
    wallpaperShowViz: true,
    panelBlur: 18,
    panelOpacity: 55,
    clockStyle: 'digital',
    clockFont: 'sans',
    clockSize: 100,
    jellyfinDeviceId: null,
    jellyfinServer: null,
    jellyfinToken: null,
    jellyfinUserId: null,
    jellyfinUsername: null,
    plexClientId: null,
    plexToken: null,
    plexServer: null
  };

  const ACCENT_SWATCHES = [
    '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9',
    '#22b8cf', '#4dabf7', '#748ffc', '#9775fa', '#f783ac',
    '#ffffff', '#00ff41'
  ];

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      return { ...defaultState, ...JSON.parse(raw) };
    } catch {
      return { ...defaultState };
    }
  }

  // Jellyfin/Plex tokens are credentials, not settings — they're persisted
  // separately via safeStorage (see loadSecureTokens/secureSet calls below)
  // and deliberately excluded from the plain settings blob.
  const SECURE_FIELDS = ['jellyfinToken', 'plexToken'];

  function saveState() {
    const persisted = { ...state };
    SECURE_FIELDS.forEach((f) => delete persisted[f]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }

  async function loadSecureTokens() {
    if (!window.codevibe || !window.codevibe.secureGet) return;
    const [jellyfinToken, plexToken] = await Promise.all([
      window.codevibe.secureGet('jellyfinToken'),
      window.codevibe.secureGet('plexToken')
    ]);
    if (jellyfinToken) state.jellyfinToken = jellyfinToken;
    if (plexToken) state.plexToken = plexToken;
  }

  // ---------- Theme ----------
  function applyTheme() {
    const preset = THEMES[state.theme] || THEMES.lofi;
    const bg1 = state.customBg1 || preset.bg1;
    const bg2 = state.customBg2 || preset.bg2;
    const accent = state.customAccent || preset.accent;
    const root = document.body.style;
    root.setProperty('--bg-1', bg1);
    root.setProperty('--bg-2', bg2);
    root.setProperty('--accent', accent);
    root.setProperty('--accent-soft', hexToRgba(accent, 0.25));
    document.body.dataset.theme = state.theme;
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function renderPresetGrid() {
    const grid = document.getElementById('preset-grid');
    grid.innerHTML = '';
    Object.entries(THEMES).forEach(([key, t]) => {
      const card = document.createElement('div');
      card.className = 'preset-card' + (state.theme === key ? ' active' : '');
      card.style.background = `linear-gradient(135deg, ${t.bg1}, ${t.bg2})`;
      card.style.borderColor = state.theme === key ? t.accent : 'transparent';
      card.textContent = t.label;
      card.addEventListener('click', () => {
        state.theme = key;
        state.customAccent = null;
        state.customBg1 = null;
        state.customBg2 = null;
        if (t.vizStyle) {
          state.vizStyle = t.vizStyle;
          document.querySelectorAll('#viz-style-row .chip').forEach((c) => {
            c.classList.toggle('active', c.dataset.style === t.vizStyle);
          });
        }
        applyTheme();
        renderPresetGrid();
        syncColorInputs();
        renderAccentSwatches();
        saveState();
      });
      grid.appendChild(card);
    });
  }

  function syncColorInputs() {
    const preset = THEMES[state.theme] || THEMES.lofi;
    document.getElementById('accent-color').value = state.customAccent || preset.accent;
    document.getElementById('bg-color-1').value = state.customBg1 || preset.bg1;
    document.getElementById('bg-color-2').value = state.customBg2 || preset.bg2;
  }

  function renderAccentSwatches() {
    const row = document.getElementById('accent-swatch-row');
    row.innerHTML = '';
    const preset = THEMES[state.theme] || THEMES.lofi;
    const current = state.customAccent || preset.accent;
    ACCENT_SWATCHES.forEach((hex) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (current.toLowerCase() === hex.toLowerCase() ? ' active' : '');
      sw.style.background = hex;
      sw.title = hex;
      sw.addEventListener('click', () => {
        state.customAccent = hex;
        applyTheme();
        renderAccentSwatches();
        syncColorInputs();
        saveState();
      });
      row.appendChild(sw);
    });
  }

  document.getElementById('accent-color').addEventListener('input', (e) => {
    state.customAccent = e.target.value;
    applyTheme();
    renderAccentSwatches();
    saveState();
  });
  document.getElementById('bg-color-1').addEventListener('input', (e) => {
    state.customBg1 = e.target.value;
    applyTheme();
    saveState();
  });
  document.getElementById('bg-color-2').addEventListener('input', (e) => {
    state.customBg2 = e.target.value;
    applyTheme();
    saveState();
  });

  // ---------- Tabs ----------
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });

  // ---------- Visualizer style chips ----------
  document.querySelectorAll('#viz-style-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#viz-style-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.vizStyle = chip.dataset.style;
      saveState();
    });
  });

  // ---------- Clock ----------
  const clockWidget = document.getElementById('clock-widget');
  const clockTimeEl = document.getElementById('clock-time');
  const clockDateEl = document.getElementById('clock-date');
  const clockToggle = document.getElementById('clock-toggle');
  const secondsToggle = document.getElementById('seconds-toggle');
  const clockAnalogCanvas = document.getElementById('clock-analog');
  const clockAnalogCtx = clockAnalogCanvas.getContext('2d');

  function updateClock() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    let suffix = '';
    if (state.clockFormat === '12') {
      suffix = h >= 12 ? ' PM' : ' AM';
      h = h % 12 || 12;
    }
    const hh = String(h).padStart(2, '0');
    clockTimeEl.textContent = `${hh}:${m}${state.clockSeconds ? ':' + s : ''}${suffix}`;
    clockDateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
    drawAnalogClock();
  }
  setInterval(updateClock, 1000);
  updateClock();

  clockToggle.addEventListener('change', () => {
    state.clockVisible = clockToggle.checked;
    clockWidget.classList.toggle('hidden', !state.clockVisible);
    saveState();
  });
  secondsToggle.addEventListener('change', () => {
    state.clockSeconds = secondsToggle.checked;
    saveState();
  });
  document.querySelectorAll('[data-format]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-format]').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.clockFormat = chip.dataset.format;
      saveState();
    });
  });

  const CLOCK_STYLES = ['digital', 'minimal', 'boxed', 'neon', 'analog'];
  const CLOCK_FONTS = ['sans', 'serif', 'mono', 'display', 'condensed'];

  function applyClockAppearance() {
    CLOCK_STYLES.forEach((s) => clockWidget.classList.remove('style-' + s));
    clockWidget.classList.add('style-' + state.clockStyle);
    CLOCK_FONTS.forEach((f) => clockWidget.classList.remove('font-' + f));
    clockWidget.classList.add('font-' + state.clockFont);
    clockWidget.style.setProperty('--clock-scale', state.clockSize / 100);
  }

  function drawAnalogClock() {
    if (state.clockStyle !== 'analog') return;
    const now = new Date();
    const size = clockAnalogCanvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 6;
    const [ar, ag, ab] = accentRGB();
    const accentColor = `rgb(${ar}, ${ag}, ${ab})`;

    clockAnalogCtx.clearRect(0, 0, size, size);

    clockAnalogCtx.beginPath();
    clockAnalogCtx.arc(cx, cy, r, 0, Math.PI * 2);
    clockAnalogCtx.strokeStyle = accentColor;
    clockAnalogCtx.lineWidth = 2;
    clockAnalogCtx.stroke();

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const inner = r - 8;
      clockAnalogCtx.beginPath();
      clockAnalogCtx.moveTo(cx + Math.sin(angle) * inner, cy - Math.cos(angle) * inner);
      clockAnalogCtx.lineTo(cx + Math.sin(angle) * r, cy - Math.cos(angle) * r);
      clockAnalogCtx.strokeStyle = 'rgba(255,255,255,0.5)';
      clockAnalogCtx.lineWidth = 2;
      clockAnalogCtx.stroke();
    }

    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2;
    const minuteAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2;
    const secondAngle = (seconds / 60) * Math.PI * 2;

    drawHand(hourAngle, r * 0.5, 4, 'rgba(255,255,255,0.9)');
    drawHand(minuteAngle, r * 0.72, 3, 'rgba(255,255,255,0.75)');
    if (state.clockSeconds) drawHand(secondAngle, r * 0.8, 1.5, accentColor);

    clockAnalogCtx.beginPath();
    clockAnalogCtx.arc(cx, cy, 3, 0, Math.PI * 2);
    clockAnalogCtx.fillStyle = accentColor;
    clockAnalogCtx.fill();

    function drawHand(angle, length, width, color) {
      clockAnalogCtx.beginPath();
      clockAnalogCtx.moveTo(cx, cy);
      clockAnalogCtx.lineTo(cx + Math.sin(angle) * length, cy - Math.cos(angle) * length);
      clockAnalogCtx.strokeStyle = color;
      clockAnalogCtx.lineWidth = width;
      clockAnalogCtx.lineCap = 'round';
      clockAnalogCtx.stroke();
    }
  }

  document.querySelectorAll('#clock-style-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#clock-style-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.clockStyle = chip.dataset.clockstyle;
      applyClockAppearance();
      drawAnalogClock();
      saveState();
    });
  });

  document.querySelectorAll('#clock-font-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#clock-font-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.clockFont = chip.dataset.clockfont;
      applyClockAppearance();
      saveState();
    });
  });

  document.getElementById('clock-size').addEventListener('input', (e) => {
    state.clockSize = Number(e.target.value);
    applyClockAppearance();
    saveState();
  });

  // Draggable clock
  (function makeDraggable() {
    let dragging = false, offX = 0, offY = 0;
    clockWidget.addEventListener('mousedown', (e) => {
      dragging = true;
      const rect = clockWidget.getBoundingClientRect();
      offX = e.clientX - rect.left;
      offY = e.clientY - rect.top;
      clockWidget.style.right = 'auto';
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      clockWidget.style.left = `${e.clientX - offX}px`;
      clockWidget.style.top = `${e.clientY - offY}px`;
    });
    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      state.clockPos = { left: clockWidget.style.left, top: clockWidget.style.top };
      saveState();
    });
  })();

  // ---------- Wallpaper / background mode ----------
  const wallpaperBg = document.getElementById('wallpaper-bg');
  const wallpaperOverlay = document.getElementById('wallpaper-overlay');
  const wallpaperControls = document.getElementById('wallpaper-controls');
  const visualizerCanvas = document.getElementById('visualizer');

  function applyBackgroundMode() {
    const isWallpaper = state.bgMode === 'wallpaper';
    wallpaperControls.classList.toggle('hidden', !isWallpaper);
    wallpaperBg.classList.toggle('hidden', !isWallpaper || !state.wallpaperPath);
    document.getElementById('bg-glow').classList.toggle('hidden', isWallpaper);

    if (isWallpaper && state.wallpaperPath) {
      wallpaperBg.style.backgroundImage = `url("file://${state.wallpaperPath.replace(/\\/g, '/')}")`;
      wallpaperBg.style.filter = state.wallpaperBlur > 0 ? `blur(${state.wallpaperBlur}px)` : 'none';
      wallpaperBg.classList.remove('fit-cover', 'fit-contain', 'fit-tile');
      wallpaperBg.classList.add('fit-' + state.wallpaperFit);
      wallpaperOverlay.style.opacity = state.wallpaperDim / 100;
    }

    const hideViz = isWallpaper && !state.wallpaperShowViz;
    visualizerCanvas.classList.toggle('viz-hidden', hideViz);
  }

  document.querySelectorAll('#bg-mode-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#bg-mode-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.bgMode = chip.dataset.bgmode;
      applyBackgroundMode();
      saveState();
    });
  });

  function applyBackgroundPattern() {
    const bgGlow = document.getElementById('bg-glow');
    bgGlow.classList.remove('pattern-grid', 'pattern-vignette', 'pattern-noise');
    if (state.bgPattern !== 'gradient') bgGlow.classList.add('pattern-' + state.bgPattern);
  }

  document.querySelectorAll('#bg-pattern-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#bg-pattern-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.bgPattern = chip.dataset.pattern;
      applyBackgroundPattern();
      saveState();
    });
  });

  function applyPanelAppearance() {
    document.body.style.setProperty('--panel-blur', state.panelBlur + 'px');
    document.body.style.setProperty('--panel-opacity', state.panelOpacity / 100);
  }

  document.getElementById('panel-blur').addEventListener('input', (e) => {
    state.panelBlur = Number(e.target.value);
    applyPanelAppearance();
    saveState();
  });
  document.getElementById('panel-opacity').addEventListener('input', (e) => {
    state.panelOpacity = Number(e.target.value);
    applyPanelAppearance();
    saveState();
  });

  document.getElementById('choose-wallpaper-btn').addEventListener('click', async () => {
    const img = await window.codevibe.pickWallpaperImage();
    if (img) {
      state.wallpaperPath = img.path;
      applyBackgroundMode();
      saveState();
    }
  });

  document.getElementById('clear-wallpaper-btn').addEventListener('click', () => {
    state.wallpaperPath = null;
    applyBackgroundMode();
    saveState();
  });

  document.querySelectorAll('#wallpaper-fit-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#wallpaper-fit-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.wallpaperFit = chip.dataset.fit;
      applyBackgroundMode();
      saveState();
    });
  });

  document.getElementById('wallpaper-dim').addEventListener('input', (e) => {
    state.wallpaperDim = Number(e.target.value);
    applyBackgroundMode();
    saveState();
  });
  document.getElementById('wallpaper-blur').addEventListener('input', (e) => {
    state.wallpaperBlur = Number(e.target.value);
    applyBackgroundMode();
    saveState();
  });
  document.getElementById('wallpaper-viz-toggle').addEventListener('change', (e) => {
    state.wallpaperShowViz = e.target.checked;
    applyBackgroundMode();
    saveState();
  });

  // ---------- Local library ----------
  const audioEl = document.getElementById('audio-el');
  const trackListEl = document.getElementById('track-list');
  const npTitle = document.getElementById('np-title');
  const npSub = document.getElementById('np-sub');
  const nowPlayingEl = document.getElementById('now-playing');
  const playBtn = document.getElementById('play-btn');
  const seekEl = document.getElementById('seek');
  const timeDisplay = document.getElementById('time-display');
  const volumeEl = document.getElementById('volume');

  let currentIndex = -1;
  let mode = 'idle'; // 'local' | 'stream' | 'idle'

  function renderTrackList() {
    trackListEl.innerHTML = '';
    state.tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'track-item' + (i === currentIndex && mode === 'local' ? ' playing' : '');
      const name = document.createElement('span');
      name.textContent = t.name;
      const rm = document.createElement('span');
      rm.className = 'rm';
      rm.textContent = '✕';
      rm.title = 'Remove';
      rm.addEventListener('click', (ev) => {
        ev.stopPropagation();
        state.tracks.splice(i, 1);
        if (currentIndex === i) stopPlayback();
        else if (currentIndex > i) currentIndex--;
        saveState();
        renderTrackList();
      });
      li.appendChild(name);
      li.appendChild(rm);
      li.addEventListener('click', () => playLocalTrack(i));
      trackListEl.appendChild(li);
    });
    document.getElementById('library-hint').classList.toggle('hidden', state.tracks.length > 0);
  }

  document.getElementById('add-files-btn').addEventListener('click', async () => {
    const files = await window.codevibe.pickAudioFiles();
    if (files.length) {
      state.tracks.push(...files);
      saveState();
      renderTrackList();
    }
  });
  document.getElementById('add-folder-btn').addEventListener('click', async () => {
    const files = await window.codevibe.pickAudioFolder();
    if (files.length) {
      state.tracks.push(...files);
      saveState();
      renderTrackList();
    }
  });

  function hideStreamFrame() {
    document.getElementById('stream-frame-wrap').classList.add('hidden');
    document.getElementById('stream-frame').src = '';
    nowPlayingEl.classList.remove('hidden');
  }

  function switchToLocalMode() {
    mode = 'local';
    hideStreamFrame();
  }

  function playLocalTrack(i) {
    if (i < 0 || i >= state.tracks.length) return;
    switchToLocalMode();
    currentIndex = i;
    const track = state.tracks[i];
    audioEl.crossOrigin = 'anonymous';
    audioEl.src = 'file://' + track.path;
    audioEl.play().catch(() => {});
    npTitle.textContent = track.name;
    npSub.textContent = 'Local file';
    renderTrackList();
    ensureAudioGraph();
  }

  function stopPlayback() {
    audioEl.pause();
    audioEl.src = '';
    currentIndex = -1;
    mode = 'idle';
    npTitle.textContent = 'Nothing playing';
    npSub.textContent = 'Add a track or streaming link to begin';
    renderTrackList();
  }

  playBtn.addEventListener('click', () => {
    if (mode === 'idle' || mode === 'stream') {
      if (state.tracks.length) playLocalTrack(0);
      return;
    }
    if (audioEl.paused) audioEl.play(); else audioEl.pause();
  });

  audioEl.addEventListener('play', () => { playBtn.textContent = '⏸'; });
  audioEl.addEventListener('pause', () => { playBtn.textContent = '▶'; });
  audioEl.addEventListener('ended', () => {
    if (currentIndex < state.tracks.length - 1) playLocalTrack(currentIndex + 1);
    else stopPlayback();
  });

  document.getElementById('prev-btn').addEventListener('click', () => {
    if (mode === 'local' && currentIndex > 0) playLocalTrack(currentIndex - 1);
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    if (mode === 'local' && currentIndex < state.tracks.length - 1) playLocalTrack(currentIndex + 1);
  });

  audioEl.addEventListener('timeupdate', () => {
    if (!audioEl.duration) return;
    seekEl.value = (audioEl.currentTime / audioEl.duration) * 100;
    timeDisplay.textContent = `${fmtTime(audioEl.currentTime)} / ${fmtTime(audioEl.duration)}`;
  });
  seekEl.addEventListener('input', () => {
    if (audioEl.duration) audioEl.currentTime = (seekEl.value / 100) * audioEl.duration;
  });

  function fmtTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  volumeEl.addEventListener('input', () => {
    state.volume = Number(volumeEl.value);
    audioEl.volume = state.volume / 100;
    saveState();
  });

  // ---------- Streaming links ----------
  const streamFrameWrap = document.getElementById('stream-frame-wrap');
  const streamFrame = document.getElementById('stream-frame');
  const streamHistoryEl = document.getElementById('stream-history');

  function buildEmbedUrl(raw) {
    let url;
    try { url = new URL(raw.trim()); } catch { return null; }
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = url.searchParams.get('v');
      const list = url.searchParams.get('list');
      if (id) return `https://www.youtube.com/embed/${id}${list ? '?list=' + list : ''}`;
      if (url.pathname.startsWith('/shorts/')) {
        const shortId = url.pathname.split('/')[2];
        if (shortId) return `https://www.youtube.com/embed/${shortId}`;
      }
      if (url.pathname.startsWith('/playlist') && list) return `https://www.youtube.com/embed/videoseries?list=${list}`;
      return null;
    }
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'open.spotify.com') {
      const parts = url.pathname.split('/').filter(Boolean); // [track, id] etc.
      if (parts.length >= 2) return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
      return null;
    }
    if (host === 'soundcloud.com') {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}&color=%23ff9f6e&auto_play=true&visual=false`;
    }
    return null;
  }

  const streamErrorEl = document.getElementById('stream-error');
  const streamOpenExternalBtn = document.getElementById('stream-open-external-btn');
  let lastStreamRaw = null;

  function showStreamError(message) {
    streamErrorEl.textContent = message;
    streamErrorEl.classList.remove('hidden');
    streamOpenExternalBtn.classList.remove('hidden');
  }

  function hideStreamError() {
    streamErrorEl.classList.add('hidden');
    streamOpenExternalBtn.classList.add('hidden');
  }

  function loadStreamUrl(raw) {
    const embed = buildEmbedUrl(raw);
    if (!embed) {
      alert('Unsupported link. Try a YouTube, Spotify, or SoundCloud URL.');
      return;
    }
    mode = 'stream';
    lastStreamRaw = raw;
    hideStreamError();
    audioEl.pause();
    streamFrame.src = embed;
    streamFrameWrap.classList.remove('hidden');
    nowPlayingEl.classList.remove('hidden');
    npTitle.textContent = 'Streaming';
    npSub.textContent = raw;

    if (!state.streamHistory.includes(raw)) {
      state.streamHistory.unshift(raw);
      state.streamHistory = state.streamHistory.slice(0, 12);
      saveState();
      renderStreamHistory();
    }
  }

  streamFrame.addEventListener('did-fail-load', (e) => {
    if (mode !== 'stream' || !lastStreamRaw) return;
    if (e.errorCode === -3) return; // ERR_ABORTED, usually just a redirect/navigation, not a real failure
    showStreamError("This link didn't load — the video/track owner may have disabled embedding, or it may be region-locked.");
  });

  streamOpenExternalBtn.addEventListener('click', () => {
    if (lastStreamRaw && window.codevibe && window.codevibe.openExternal) {
      window.codevibe.openExternal(lastStreamRaw);
    }
  });

  function renderStreamHistory() {
    streamHistoryEl.innerHTML = '';
    state.streamHistory.forEach((url) => {
      const li = document.createElement('li');
      li.className = 'track-item';
      const span = document.createElement('span');
      span.textContent = url;
      li.appendChild(span);
      li.addEventListener('click', () => loadStreamUrl(url));
      streamHistoryEl.appendChild(li);
    });
  }

  document.getElementById('stream-load-btn').addEventListener('click', () => {
    const val = document.getElementById('stream-url').value;
    if (val.trim()) loadStreamUrl(val.trim());
  });
  document.getElementById('stream-url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('stream-load-btn').click();
  });

  // ---------- Shared helper for remote (Jellyfin/Plex) playback ----------
  function playRemoteTrack(url, title, subtitle) {
    mode = 'remote';
    hideStreamFrame();
    // Requesting these in CORS mode would fail outright on servers that don't send
    // Access-Control-Allow-Origin headers; drop it so playback works regardless,
    // trading away visualizer reactivity for these sources (same as streaming links).
    audioEl.removeAttribute('crossorigin');
    audioEl.crossOrigin = null;
    audioEl.src = url;
    audioEl.play().catch(() => {});
    npTitle.textContent = title;
    npSub.textContent = subtitle;
  }

  // ---------- Jellyfin ----------
  const jellyfinConnectForm = document.getElementById('jellyfin-connect-form');
  const jellyfinConnectedEl = document.getElementById('jellyfin-connected');
  const jellyfinErrorEl = document.getElementById('jellyfin-error');
  const jellyfinTrackListEl = document.getElementById('jellyfin-track-list');

  function getJellyfinDeviceId() {
    if (!state.jellyfinDeviceId) {
      state.jellyfinDeviceId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `cv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      saveState();
    }
    return state.jellyfinDeviceId;
  }

  function updateJellyfinUi() {
    const connected = !!(state.jellyfinServer && state.jellyfinToken);
    jellyfinConnectForm.classList.toggle('hidden', connected);
    jellyfinConnectedEl.classList.toggle('hidden', !connected);
    if (connected) {
      document.getElementById('jellyfin-user-label').textContent = state.jellyfinUsername || 'user';
    }
  }

  async function jellyfinFetch(path, options = {}) {
    const res = await fetch(state.jellyfinServer + path, {
      ...options,
      headers: { 'X-Emby-Token': state.jellyfinToken, ...(options.headers || {}) }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadJellyfinTracks() {
    if (!state.jellyfinServer || !state.jellyfinToken) return;
    jellyfinTrackListEl.innerHTML = '<li class="hint">Loading…</li>';
    try {
      const data = await jellyfinFetch(`/Users/${state.jellyfinUserId}/Items?IncludeItemTypes=Audio&Recursive=true&SortBy=Album,SortName`);
      renderJellyfinTracks(data.Items || []);
    } catch (err) {
      jellyfinTrackListEl.innerHTML = `<li class="hint hint-error">Couldn't load library: ${err.message}</li>`;
    }
  }

  function renderJellyfinTracks(items) {
    jellyfinTrackListEl.innerHTML = '';
    if (!items.length) {
      jellyfinTrackListEl.innerHTML = '<li class="hint">No audio items found on this server.</li>';
      return;
    }
    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'track-item';
      const label = document.createElement('span');
      label.textContent = item.Name + (item.AlbumArtist ? ` — ${item.AlbumArtist}` : '');
      li.appendChild(label);
      li.addEventListener('click', () => {
        const url = `${state.jellyfinServer}/Audio/${item.Id}/stream?static=true&api_key=${encodeURIComponent(state.jellyfinToken)}`;
        playRemoteTrack(url, item.Name, (item.AlbumArtist ? `${item.AlbumArtist} · ` : '') + 'Jellyfin');
      });
      jellyfinTrackListEl.appendChild(li);
    });
  }

  document.getElementById('jellyfin-connect-btn').addEventListener('click', async () => {
    const server = document.getElementById('jellyfin-server').value.trim().replace(/\/$/, '');
    const username = document.getElementById('jellyfin-username').value.trim();
    const password = document.getElementById('jellyfin-password').value;
    jellyfinErrorEl.classList.add('hidden');
    if (!server || !username) {
      jellyfinErrorEl.textContent = 'Server address and username are required.';
      jellyfinErrorEl.classList.remove('hidden');
      return;
    }
    try {
      const deviceId = getJellyfinDeviceId();
      const res = await fetch(`${server}/Users/AuthenticateByName`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization': `MediaBrowser Client="CodeVibe", Device="Desktop", DeviceId="${deviceId}", Version="1.0.0"`
        },
        body: JSON.stringify({ Username: username, Pw: password })
      });
      if (!res.ok) throw new Error(`login failed (HTTP ${res.status})`);
      const data = await res.json();
      state.jellyfinServer = server;
      state.jellyfinToken = data.AccessToken;
      state.jellyfinUserId = data.User.Id;
      state.jellyfinUsername = data.User.Name;
      saveState();
      if (window.codevibe && window.codevibe.secureSet) window.codevibe.secureSet('jellyfinToken', data.AccessToken);
      updateJellyfinUi();
      loadJellyfinTracks();
    } catch (err) {
      jellyfinErrorEl.textContent = `Couldn't connect: ${err.message}`;
      jellyfinErrorEl.classList.remove('hidden');
    }
  });

  document.getElementById('jellyfin-disconnect-btn').addEventListener('click', () => {
    state.jellyfinServer = null;
    state.jellyfinToken = null;
    state.jellyfinUserId = null;
    state.jellyfinUsername = null;
    jellyfinTrackListEl.innerHTML = '';
    saveState();
    if (window.codevibe && window.codevibe.secureDelete) window.codevibe.secureDelete('jellyfinToken');
    updateJellyfinUi();
  });

  document.getElementById('jellyfin-refresh-btn').addEventListener('click', loadJellyfinTracks);

  // ---------- Plex ----------
  const plexLoginForm = document.getElementById('plex-login-form');
  const plexServerForm = document.getElementById('plex-server-form');
  const plexConnectedEl = document.getElementById('plex-connected');
  const plexLoginStatusEl = document.getElementById('plex-login-status');
  const plexLoginErrorEl = document.getElementById('plex-login-error');
  const plexServerErrorEl = document.getElementById('plex-server-error');
  const plexTrackListEl = document.getElementById('plex-track-list');

  function getPlexClientId() {
    if (!state.plexClientId) {
      state.plexClientId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `cv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      saveState();
    }
    return state.plexClientId;
  }

  function updatePlexUi() {
    const hasToken = !!state.plexToken;
    const hasServer = !!state.plexServer;
    plexLoginForm.classList.toggle('hidden', hasToken);
    plexServerForm.classList.toggle('hidden', !hasToken || hasServer);
    plexConnectedEl.classList.toggle('hidden', !(hasToken && hasServer));
    if (hasToken && hasServer) {
      document.getElementById('plex-server-label').textContent = state.plexServer;
    }
  }

  document.getElementById('plex-login-btn').addEventListener('click', async () => {
    plexLoginErrorEl.classList.add('hidden');
    plexLoginStatusEl.textContent = 'Opening plex.tv to sign in…';
    const clientId = getPlexClientId();
    try {
      const pinRes = await fetch('https://plex.tv/api/v2/pins?strong=true', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Plex-Client-Identifier': clientId,
          'X-Plex-Product': 'CodeVibe'
        }
      });
      if (!pinRes.ok) throw new Error(`HTTP ${pinRes.status}`);
      const pin = await pinRes.json();

      const authUrl = `https://app.plex.tv/auth#?clientID=${encodeURIComponent(clientId)}&code=${encodeURIComponent(pin.code)}&context%5Bdevice%5D%5Bproduct%5D=CodeVibe`;
      if (window.codevibe && window.codevibe.openExternal) window.codevibe.openExternal(authUrl);

      plexLoginStatusEl.textContent = 'Waiting for you to sign in in your browser…';
      const token = await pollPlexPin(pin.id, clientId);
      if (!token) {
        plexLoginStatusEl.textContent = '';
        plexLoginErrorEl.textContent = 'Sign-in timed out. Please try again.';
        plexLoginErrorEl.classList.remove('hidden');
        return;
      }
      state.plexToken = token;
      saveState();
      if (window.codevibe && window.codevibe.secureSet) window.codevibe.secureSet('plexToken', token);
      plexLoginStatusEl.textContent = '';
      updatePlexUi();
    } catch (err) {
      plexLoginStatusEl.textContent = '';
      plexLoginErrorEl.textContent = `Couldn't sign in: ${err.message}`;
      plexLoginErrorEl.classList.remove('hidden');
    }
  });

  async function pollPlexPin(pinId, clientId) {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(`https://plex.tv/api/v2/pins/${pinId}`, {
        headers: { 'Accept': 'application/json', 'X-Plex-Client-Identifier': clientId }
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.authToken) return data.authToken;
    }
    return null;
  }

  document.getElementById('plex-server-btn').addEventListener('click', async () => {
    const server = document.getElementById('plex-server').value.trim().replace(/\/$/, '');
    plexServerErrorEl.classList.add('hidden');
    if (!server) {
      plexServerErrorEl.textContent = 'Server address is required.';
      plexServerErrorEl.classList.remove('hidden');
      return;
    }
    try {
      const res = await fetch(`${server}/library/sections`, {
        headers: { 'Accept': 'application/json', 'X-Plex-Token': state.plexToken }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.plexServer = server;
      saveState();
      updatePlexUi();
      loadPlexTracks();
    } catch (err) {
      plexServerErrorEl.textContent = `Couldn't reach that server: ${err.message}`;
      plexServerErrorEl.classList.remove('hidden');
    }
  });

  document.getElementById('plex-disconnect-btn').addEventListener('click', () => {
    state.plexToken = null;
    state.plexServer = null;
    plexTrackListEl.innerHTML = '';
    saveState();
    if (window.codevibe && window.codevibe.secureDelete) window.codevibe.secureDelete('plexToken');
    updatePlexUi();
  });

  document.getElementById('plex-refresh-btn').addEventListener('click', loadPlexTracks);

  async function loadPlexTracks() {
    if (!state.plexServer || !state.plexToken) return;
    plexTrackListEl.innerHTML = '<li class="hint">Loading…</li>';
    try {
      const sectionsRes = await fetch(`${state.plexServer}/library/sections`, {
        headers: { 'Accept': 'application/json', 'X-Plex-Token': state.plexToken }
      });
      if (!sectionsRes.ok) throw new Error(`HTTP ${sectionsRes.status}`);
      const sectionsData = await sectionsRes.json();
      const musicSections = (sectionsData.MediaContainer.Directory || []).filter((d) => d.type === 'artist');

      const allTracks = [];
      for (const section of musicSections) {
        const tracksRes = await fetch(`${state.plexServer}/library/sections/${section.key}/all?type=10`, {
          headers: { 'Accept': 'application/json', 'X-Plex-Token': state.plexToken }
        });
        if (!tracksRes.ok) continue;
        const tracksData = await tracksRes.json();
        allTracks.push(...(tracksData.MediaContainer.Metadata || []));
      }
      renderPlexTracks(allTracks);
    } catch (err) {
      plexTrackListEl.innerHTML = `<li class="hint hint-error">Couldn't load library: ${err.message}</li>`;
    }
  }

  function renderPlexTracks(items) {
    plexTrackListEl.innerHTML = '';
    if (!items.length) {
      plexTrackListEl.innerHTML = '<li class="hint">No tracks found in your music libraries.</li>';
      return;
    }
    items.forEach((item) => {
      const part = item.Media && item.Media[0] && item.Media[0].Part && item.Media[0].Part[0];
      if (!part) return;
      const li = document.createElement('li');
      li.className = 'track-item';
      const label = document.createElement('span');
      label.textContent = item.title + (item.grandparentTitle ? ` — ${item.grandparentTitle}` : '');
      li.appendChild(label);
      li.addEventListener('click', () => {
        const url = `${state.plexServer}${part.key}?X-Plex-Token=${encodeURIComponent(state.plexToken)}`;
        playRemoteTrack(url, item.title, (item.grandparentTitle ? `${item.grandparentTitle} · ` : '') + 'Plex');
      });
      plexTrackListEl.appendChild(li);
    });
  }

  // ---------- Audio-reactive visualizer ----------
  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d');
  let audioCtx, analyser, sourceNode, dataArray;
  let particles = [];

  const MATRIX_FONT_SIZE = 16;
  const MATRIX_CHARS = 'アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:・."=*+-<>';
  let matrixDrops = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initMatrix();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function ensureAudioGraph() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    sourceNode = audioCtx.createMediaElementSource(audioEl);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  function accentRGB() {
    const cs = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    const h = cs.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }

  function initParticles() {
    particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      vy: Math.random() * 0.3 + 0.1,
      phase: Math.random() * Math.PI * 2
    }));
  }
  initParticles();

  function initMatrix() {
    const cols = Math.max(1, Math.floor(canvas.width / MATRIX_FONT_SIZE));
    matrixDrops = Array.from({ length: cols }, () => Math.random() * -50);
  }
  initMatrix();

  function drawMatrixRain() {
    const [r, g, b] = accentRGB();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${MATRIX_FONT_SIZE}px monospace`;
    let speedBoost = 1;
    if (mode === 'local' && analyser && !audioEl.paused) {
      analyser.getByteFrequencyData(dataArray);
      speedBoost = 1 + (dataArray.reduce((a, v) => a + v, 0) / dataArray.length / 255) * 1.5;
    }
    for (let i = 0; i < matrixDrops.length; i++) {
      const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      const x = i * MATRIX_FONT_SIZE;
      const y = matrixDrops[i] * MATRIX_FONT_SIZE;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.75 + Math.random() * 0.25})`;
      ctx.fillText(char, x, y);
      if (y > canvas.height && Math.random() > 0.975) matrixDrops[i] = 0;
      matrixDrops[i] += 0.6 * speedBoost;
    }
  }

  function drawAmbient(t) {
    const [r, g, b] = accentRGB();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      const pulse = 1 + 0.5 * Math.sin(t / 900 + p.phase);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.25 * pulse})`;
      ctx.fill();
      p.y -= p.vy;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
    });
  }

  function drawBars() {
    analyser.getByteFrequencyData(dataArray);
    const [r, g, b] = accentRGB();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barCount = dataArray.length;
    const barWidth = canvas.width / barCount;
    for (let i = 0; i < barCount; i++) {
      const v = dataArray[i] / 255;
      const h = v * canvas.height * 0.65;
      const alpha = 0.25 + v * 0.6;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fillRect(i * barWidth, canvas.height - h, barWidth * 0.8, h);
    }
  }

  function drawWave() {
    analyser.getByteTimeDomainData(dataArray);
    const [r, g, b] = accentRGB();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
    ctx.beginPath();
    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
  }

  function drawParticlesReactive() {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
    const [r, g, b] = accentRGB();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      const energy = dataArray[i % dataArray.length] / 255;
      const radius = p.r + energy * 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + energy * 0.6})`;
      ctx.fill();
      p.y -= p.vy * (1 + avg * 3);
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
    });
  }

  function drawRadialBars() {
    analyser.getByteFrequencyData(dataArray);
    const [r, g, b] = accentRGB();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.15;
    const barCount = dataArray.length;
    for (let i = 0; i < barCount; i++) {
      const v = dataArray[i] / 255;
      const angle = (i / barCount) * Math.PI * 2;
      const len = v * Math.min(canvas.width, canvas.height) * 0.35;
      const x1 = cx + Math.cos(angle) * baseRadius;
      const y1 = cy + Math.sin(angle) * baseRadius;
      const x2 = cx + Math.cos(angle) * (baseRadius + len);
      const y2 = cy + Math.sin(angle) * (baseRadius + len);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + v * 0.6})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  function drawKaleidoscope() {
    analyser.getByteFrequencyData(dataArray);
    const [r, g, b] = accentRGB();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const segments = 8;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.48;
    for (let i = 0; i < dataArray.length; i += 2) {
      const v = dataArray[i] / 255;
      const radius = (i / dataArray.length) * maxRadius;
      const size = 2 + v * 10;
      for (let s = 0; s < segments; s++) {
        const angle = (s / segments) * Math.PI * 2 + (Date.now() / 4000);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + v * 0.6})`;
        ctx.fill();
      }
    }
  }

  function tick(t) {
    if (state.vizStyle === 'matrix') {
      drawMatrixRain();
    } else {
      const hasAudioData = mode === 'local' && analyser && !audioEl.paused;
      if (hasAudioData) {
        if (state.vizStyle === 'wave') drawWave();
        else if (state.vizStyle === 'particles') drawParticlesReactive();
        else if (state.vizStyle === 'radial') drawRadialBars();
        else if (state.vizStyle === 'kaleidoscope') drawKaleidoscope();
        else drawBars();
      } else {
        drawAmbient(t);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ---------- App version & auto-update ----------
  function initUpdater() {
    const versionEl = document.getElementById('app-version');
    if (window.codevibe && window.codevibe.getAppVersion) {
      window.codevibe.getAppVersion().then((v) => { versionEl.textContent = 'v' + v; });
    }

    const banner = document.getElementById('update-banner');
    const bannerText = document.getElementById('update-banner-text');
    const bannerBtn = document.getElementById('update-banner-btn');
    let pendingAction = null;

    function showBanner(text, btnLabel, action) {
      bannerText.textContent = text;
      bannerBtn.textContent = btnLabel;
      bannerBtn.classList.toggle('hidden', !btnLabel);
      pendingAction = action;
      banner.classList.remove('hidden');
    }
    function hideBanner() {
      banner.classList.add('hidden');
      pendingAction = null;
    }

    bannerBtn.addEventListener('click', () => {
      if (pendingAction) pendingAction();
    });

    const checkBtn = document.getElementById('check-updates-btn');
    let transientTimer = null;

    function showTransient(text, ms) {
      clearTimeout(transientTimer);
      showBanner(text, null, null);
      transientTimer = setTimeout(hideBanner, ms);
    }

    checkBtn.addEventListener('click', () => {
      if (window.codevibe && window.codevibe.checkForUpdates) {
        window.codevibe.checkForUpdates();
      }
    });

    if (!window.codevibe || !window.codevibe.onUpdateStatus) return;

    window.codevibe.onUpdateStatus((status) => {
      clearTimeout(transientTimer);
      if (status.state === 'checking') {
        checkBtn.classList.add('spinning');
        showTransient('Checking for updates…', 6000);
      } else if (status.state === 'available') {
        checkBtn.classList.remove('spinning');
        showBanner(`Update v${status.version} available`, 'Download', () => {
          showBanner(`Downloading v${status.version}…`, null, null);
          window.codevibe.downloadUpdate();
        });
      } else if (status.state === 'downloading') {
        checkBtn.classList.remove('spinning');
        showBanner(`Downloading update… ${Math.round(status.percent || 0)}%`, null, null);
      } else if (status.state === 'downloaded') {
        checkBtn.classList.remove('spinning');
        showBanner(`Update v${status.version} ready to install`, 'Restart & Install', () => {
          window.codevibe.quitAndInstall();
        });
      } else if (status.state === 'up-to-date') {
        checkBtn.classList.remove('spinning');
        showTransient("You're on the latest version", 3000);
      } else if (status.state === 'error') {
        checkBtn.classList.remove('spinning');
        showTransient(`Update check failed: ${status.message}`, 4000);
      } else {
        checkBtn.classList.remove('spinning');
        hideBanner();
      }
    });
  }

  // ---------- Init ----------
  async function init() {
    applyTheme();
    renderPresetGrid();
    syncColorInputs();
    renderAccentSwatches();
    renderTrackList();
    renderStreamHistory();

    await loadSecureTokens();
    updateJellyfinUi();
    if (state.jellyfinServer && state.jellyfinToken) loadJellyfinTracks();
    updatePlexUi();
    if (state.plexServer && state.plexToken) loadPlexTracks();

    volumeEl.value = state.volume;
    audioEl.volume = state.volume / 100;
    clockToggle.checked = state.clockVisible;
    clockWidget.classList.toggle('hidden', !state.clockVisible);
    secondsToggle.checked = state.clockSeconds;

    document.querySelectorAll('[data-format]').forEach((c) => {
      c.classList.toggle('active', c.dataset.format === state.clockFormat);
    });
    document.querySelectorAll('#viz-style-row .chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.style === state.vizStyle);
    });

    if (state.clockPos && state.clockPos.left) {
      clockWidget.style.left = state.clockPos.left;
      clockWidget.style.top = state.clockPos.top;
      clockWidget.style.right = 'auto';
    }

    document.querySelectorAll('#bg-mode-row .chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.bgmode === state.bgMode);
    });
    document.querySelectorAll('#wallpaper-fit-row .chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.fit === state.wallpaperFit);
    });
    document.getElementById('wallpaper-dim').value = state.wallpaperDim;
    document.getElementById('wallpaper-blur').value = state.wallpaperBlur;
    document.getElementById('wallpaper-viz-toggle').checked = state.wallpaperShowViz;
    applyBackgroundMode();

    document.querySelectorAll('#bg-pattern-row .chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.pattern === state.bgPattern);
    });
    applyBackgroundPattern();

    document.getElementById('panel-blur').value = state.panelBlur;
    document.getElementById('panel-opacity').value = state.panelOpacity;
    applyPanelAppearance();

    document.querySelectorAll('#clock-style-row .chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.clockstyle === state.clockStyle);
    });
    document.querySelectorAll('#clock-font-row .chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.clockfont === state.clockFont);
    });
    document.getElementById('clock-size').value = state.clockSize;
    applyClockAppearance();
  }

  init();
  initUpdater();
})();
