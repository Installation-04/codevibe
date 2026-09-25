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
    hacker:    { label: 'Retro Hacker',  bg1: '#1a1400', bg2: '#000000', accent: '#ffb000', vizStyle: 'matrix' },
    solarized: { label: 'Solarized Dusk',bg1: '#0b3d3a', bg2: '#04211f', accent: '#e8a33d' },
    pastel:    { label: 'Pastel Dreams', bg1: '#2d1b3d', bg2: '#150a20', accent: '#ffb3d9' },
    frostthrone:    { label: 'Frost Throne',     bg1: '#1a2e3d', bg2: '#050d14', accent: '#8ec9e8' },
    voidmarine:     { label: 'Void Marine',      bg1: '#1c2430', bg2: '#05070a', accent: '#ff8c3d' },
    emeraldkingdom: { label: 'Emerald Kingdom',  bg1: '#1a3320', bg2: '#050f08', accent: '#e8c34d' },
    wastelandradio: { label: 'Wasteland Radio',  bg1: '#3d2a12', bg2: '#140d04', accent: '#7fff6e' },
    pixelquest:     { label: 'Pixel Quest',      bg1: '#241b4d', bg2: '#0a0618', accent: '#ff5fa8' }
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
    muted: false,
    shuffle: false,
    repeat: 'off',
    activeTab: 'library',
    tracks: [],
    streamHistory: [],
    bgMode: 'dynamic',
    bgPattern: 'gradient',
    wallpaperPath: null,
    wallpaperUrl: null,
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
    plexServer: null,
    playlists: [],
    globalHotkeys: true,
    gamepadNav: false,
    breakReminderMin: 0,
    ambientVolumes: { rain: 0, fire: 0, cafe: 0 },
    ambientCustomTrack: null,
    ambientCustomVolume: 60,
    customThemes: {},
    achievementView: 'list'
  };

  const ACCENT_SWATCHES = [
    '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9',
    '#22b8cf', '#4dabf7', '#748ffc', '#9775fa', '#f783ac',
    '#ffffff', '#00ff41', '#ff4d6d', '#00d9ff', '#c77dff', '#ffbe0b'
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
  function getThemeDef(key) {
    return THEMES[key] || state.customThemes[key] || THEMES.lofi;
  }

  function applyTheme() {
    const preset = getThemeDef(state.theme);
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
        if (window.CVGame) CVGame.recordThemeTried(key);
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

  function renderCustomThemeGrid() {
    const grid = document.getElementById('custom-theme-grid');
    grid.innerHTML = '';
    Object.entries(state.customThemes).forEach(([key, t]) => {
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
        applyTheme();
        renderPresetGrid();
        renderCustomThemeGrid();
        syncColorInputs();
        renderAccentSwatches();
        saveState();
      });
      const del = document.createElement('button');
      del.className = 'preset-card-delete';
      del.textContent = '✕';
      del.title = 'Delete this theme';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        delete state.customThemes[key];
        if (state.theme === key) state.theme = 'lofi';
        applyTheme();
        renderPresetGrid();
        renderCustomThemeGrid();
        syncColorInputs();
        renderAccentSwatches();
        saveState();
      });
      card.appendChild(del);
      grid.appendChild(card);
    });
  }

  document.getElementById('save-custom-theme-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('custom-theme-name');
    const name = nameInput.value.trim();
    if (!name) return;
    const preset = getThemeDef(state.theme);
    const key = `custom_${Date.now()}`;
    state.customThemes[key] = {
      label: name,
      bg1: state.customBg1 || preset.bg1,
      bg2: state.customBg2 || preset.bg2,
      accent: state.customAccent || preset.accent
    };
    state.theme = key;
    nameInput.value = '';
    applyTheme();
    renderPresetGrid();
    renderCustomThemeGrid();
    saveState();
    if (window.CVGame) CVGame.showToast({ icon: '🎨', title: 'Theme Saved', subtitle: name });
  });

  function syncColorInputs() {
    const preset = getThemeDef(state.theme);
    document.getElementById('accent-color').value = state.customAccent || preset.accent;
    document.getElementById('bg-color-1').value = state.customBg1 || preset.bg1;
    document.getElementById('bg-color-2').value = state.customBg2 || preset.bg2;
  }

  function renderAccentSwatches() {
    const row = document.getElementById('accent-swatch-row');
    row.innerHTML = '';
    const preset = getThemeDef(state.theme);
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
  function setActiveTab(tab) {
    const panel = document.getElementById('panel-' + tab);
    if (!panel) return;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p === panel));
  }
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      setActiveTab(btn.dataset.tab);
      saveState();
    });
  });

  // ---------- Visualizer style chips ----------
  document.querySelectorAll('#viz-style-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#viz-style-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.vizStyle = chip.dataset.style;
      if (window.CVGame) CVGame.recordVizTried(chip.dataset.style);
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

  // ---------- Local file URLs ----------
  // Raw filesystem paths can contain characters (#, %, ?, spaces) that break or
  // truncate when naively concatenated onto "file://". The main process builds
  // a correctly percent-encoded URL via Node's url.pathToFileURL; this is the
  // fallback for environments without that bridge (or state saved before it
  // existed) — it targets the same handful of characters that actually cause
  // trouble rather than re-implementing full URL encoding.
  function fallbackFileUrl(rawPath) {
    const clean = String(rawPath).replace(/\\/g, '/');
    return 'file://' + encodeURI(clean).replace(/#/g, '%23').replace(/\?/g, '%3F');
  }

  async function toFileUrl(rawPath) {
    if (window.codevibe && window.codevibe.toFileUrl) {
      const url = await window.codevibe.toFileUrl(rawPath);
      if (url) return url;
    }
    return fallbackFileUrl(rawPath);
  }

  // ---------- Wallpaper / background mode ----------
  const wallpaperBg = document.getElementById('wallpaper-bg');
  const wallpaperOverlay = document.getElementById('wallpaper-overlay');
  const wallpaperControls = document.getElementById('wallpaper-controls');
  const sceneBg = document.getElementById('scene-bg');
  const sceneControls = document.getElementById('scene-controls');
  const visualizerCanvas = document.getElementById('visualizer');
  const SCENE_IDS = ['cozy_study', 'zen_garden', 'beach_sunset', 'enchanted_forest', 'cyberpunk_skyline', 'deep_space'];

  function applyBackgroundMode() {
    const isWallpaper = state.bgMode === 'wallpaper';
    const isScene = state.bgMode === 'scene';
    wallpaperControls.classList.toggle('hidden', !isWallpaper);
    wallpaperBg.classList.toggle('hidden', !isWallpaper || !state.wallpaperPath);
    sceneControls.classList.toggle('hidden', !isScene);
    sceneBg.classList.toggle('hidden', !isScene);
    document.getElementById('bg-glow').classList.toggle('hidden', isWallpaper || isScene);

    if (isWallpaper && state.wallpaperPath) {
      const url = state.wallpaperUrl || fallbackFileUrl(state.wallpaperPath);
      wallpaperBg.style.backgroundImage = `url("${url}")`;
      wallpaperBg.style.filter = state.wallpaperBlur > 0 ? `blur(${state.wallpaperBlur}px)` : 'none';
      wallpaperBg.classList.remove('fit-cover', 'fit-contain', 'fit-tile');
      wallpaperBg.classList.add('fit-' + state.wallpaperFit);
      wallpaperOverlay.style.opacity = state.wallpaperDim / 100;
    }

    if (isScene && window.CVGame) {
      SCENE_IDS.forEach((id) => sceneBg.classList.remove('scene-' + id));
      sceneBg.classList.add('scene-' + (CVGame.state.scene || 'cozy_study'));
    }

    const hideViz = (isWallpaper && !state.wallpaperShowViz) || isScene;
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
      state.wallpaperUrl = await toFileUrl(img.path);
      applyBackgroundMode();
      saveState();
    }
  });

  document.getElementById('clear-wallpaper-btn').addEventListener('click', () => {
    state.wallpaperPath = null;
    state.wallpaperUrl = null;
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

      // Drag-to-reorder
      li.draggable = true;
      li.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', String(i));
        ev.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        li.classList.add('drag-over');
      });
      li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
      li.addEventListener('drop', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        li.classList.remove('drag-over');
        const fromIndex = Number(ev.dataTransfer.getData('text/plain'));
        if (Number.isNaN(fromIndex) || fromIndex === i) return;
        const [moved] = state.tracks.splice(fromIndex, 1);
        state.tracks.splice(i, 0, moved);
        if (currentIndex === fromIndex) currentIndex = i;
        else if (fromIndex < currentIndex && i >= currentIndex) currentIndex--;
        else if (fromIndex > currentIndex && i <= currentIndex) currentIndex++;
        saveState();
        renderTrackList();
      });

      trackListEl.appendChild(li);
    });
    document.getElementById('library-hint').classList.toggle('hidden', state.tracks.length > 0);
  }

  // ---------- Playlists ----------
  function renderPlaylistList() {
    const list = document.getElementById('playlist-list');
    list.innerHTML = '';
    state.playlists.forEach((pl, i) => {
      const li = document.createElement('li');
      li.className = 'track-item';
      const name = document.createElement('span');
      name.textContent = `${pl.name} (${pl.tracks.length})`;
      const rm = document.createElement('span');
      rm.className = 'rm';
      rm.textContent = '✕';
      rm.title = 'Delete playlist';
      rm.addEventListener('click', (ev) => {
        ev.stopPropagation();
        state.playlists.splice(i, 1);
        saveState();
        renderPlaylistList();
      });
      li.appendChild(name);
      li.appendChild(rm);
      li.addEventListener('click', () => {
        state.tracks = pl.tracks.map((t) => ({ ...t }));
        stopPlayback();
        saveState();
        renderTrackList();
      });
      list.appendChild(li);
    });
  }

  document.getElementById('save-playlist-btn').addEventListener('click', () => {
    if (!state.tracks.length) return;
    const name = prompt('Playlist name:');
    if (!name || !name.trim()) return;
    state.playlists.push({ id: Date.now().toString(36), name: name.trim(), tracks: state.tracks.map((t) => ({ ...t })) });
    saveState();
    renderPlaylistList();
  });

  // ---------- Sleep timer ----------
  let sleepTimerEndsAt = null;
  let sleepTimerInterval = null;

  function updateSleepTimerStatus() {
    const statusEl = document.getElementById('sleep-timer-status');
    if (!sleepTimerEndsAt) { statusEl.textContent = ''; return; }
    const remaining = sleepTimerEndsAt - Date.now();
    if (remaining <= 0) {
      clearInterval(sleepTimerInterval);
      sleepTimerEndsAt = null;
      if (mode === 'stream') {
        hideStreamFrame();
        mode = 'idle';
        npTitle.textContent = 'Nothing playing';
        npSub.textContent = 'Add a track or streaming link to begin';
      } else {
        audioEl.pause();
      }
      statusEl.textContent = '';
      document.querySelectorAll('#sleep-timer-row .chip').forEach((c) => c.classList.toggle('active', c.dataset.sleepmin === '0'));
      if (window.CVGame) CVGame.showToast({ icon: '😴', title: 'Sleep timer ended', subtitle: 'Playback paused' });
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    statusEl.textContent = `Stopping in ${mins}:${String(secs).padStart(2, '0')}`;
  }

  document.querySelectorAll('#sleep-timer-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#sleep-timer-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      clearInterval(sleepTimerInterval);
      const min = Number(chip.dataset.sleepmin);
      if (min === 0) {
        sleepTimerEndsAt = null;
        document.getElementById('sleep-timer-status').textContent = '';
        return;
      }
      sleepTimerEndsAt = Date.now() + min * 60000;
      updateSleepTimerStatus();
      sleepTimerInterval = setInterval(updateSleepTimerStatus, 1000);
    });
  });

  document.getElementById('add-files-btn').addEventListener('click', async () => {
    const files = await window.codevibe.pickAudioFiles();
    if (files.length) {
      state.tracks.push(...files);
      saveState();
      renderTrackList();
      if (window.CVGame) files.forEach(() => CVGame.recordEvent('trackAdded'));
    }
  });
  document.getElementById('add-folder-btn').addEventListener('click', async () => {
    const files = await window.codevibe.pickAudioFolder();
    if (files.length) {
      state.tracks.push(...files);
      saveState();
      renderTrackList();
      if (window.CVGame) files.forEach(() => CVGame.recordEvent('trackAdded'));
    }
  });

  // ---------- Drag & drop ----------
  const AUDIO_EXT_RE = /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i;
  // Chromium's default action for an unhandled drop is to navigate the page to
  // the dropped file, wiping out the whole app — always prevent that, even on
  // drags we don't otherwise handle (e.g. a wallpaper image dropped here).
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!window.codevibe || !window.codevibe.getPathForFile) return;
    const dropped = Array.from(e.dataTransfer.files || []).filter((f) => AUDIO_EXT_RE.test(f.name));
    if (!dropped.length) return;
    const added = dropped
      .map((f) => ({ path: window.codevibe.getPathForFile(f), name: f.name }))
      .filter((t) => t.path);
    if (!added.length) return;
    state.tracks.push(...added);
    saveState();
    renderTrackList();
    if (window.CVGame) added.forEach(() => CVGame.recordEvent('trackAdded'));
    state.activeTab = 'library';
    setActiveTab('library');
    saveState();
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

  async function playLocalTrack(i) {
    if (i < 0 || i >= state.tracks.length) return;
    switchToLocalMode();
    currentIndex = i;
    const track = state.tracks[i];
    const url = await toFileUrl(track.path);
    if (currentIndex !== i) return; // superseded by a newer play request while we awaited
    audioEl.crossOrigin = 'anonymous';
    audioEl.src = url;
    audioEl.play().catch(() => {});
    npTitle.textContent = track.name;
    npSub.textContent = 'Local file';
    renderTrackList();
    ensureAudioGraph();
  }

  // Picks the next track index honoring shuffle/repeat, or -1 if playback should stop.
  function getNextTrackIndex() {
    const count = state.tracks.length;
    if (!count) return -1;
    if (state.shuffle) {
      if (count === 1) return state.repeat === 'off' ? -1 : 0;
      let idx;
      do { idx = Math.floor(Math.random() * count); } while (idx === currentIndex);
      return idx;
    }
    if (currentIndex < count - 1) return currentIndex + 1;
    return state.repeat === 'all' ? 0 : -1;
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
    if (state.repeat === 'one') { playLocalTrack(currentIndex); return; }
    const next = getNextTrackIndex();
    if (next !== -1) playLocalTrack(next);
    else stopPlayback();
  });

  document.getElementById('prev-btn').addEventListener('click', () => {
    if (mode === 'local' && currentIndex > 0) playLocalTrack(currentIndex - 1);
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    if (mode !== 'local') return;
    const next = getNextTrackIndex();
    if (next !== -1) playLocalTrack(next);
  });

  const shuffleBtn = document.getElementById('shuffle-btn');
  const repeatBtn = document.getElementById('repeat-btn');
  const REPEAT_ICONS = { off: '🔁', all: '🔁', one: '🔂' };

  function updateShuffleRepeatUi() {
    shuffleBtn.classList.toggle('toggle-active', state.shuffle);
    repeatBtn.classList.toggle('toggle-active', state.repeat !== 'off');
    repeatBtn.textContent = REPEAT_ICONS[state.repeat];
    repeatBtn.title = state.repeat === 'one' ? 'Repeat: one track' : state.repeat === 'all' ? 'Repeat: all' : 'Repeat: off';
  }

  shuffleBtn.addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    if (state.shuffle && window.CVGame) CVGame.recordEvent('shuffleUsed');
    updateShuffleRepeatUi();
    saveState();
  });
  repeatBtn.addEventListener('click', () => {
    state.repeat = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    updateShuffleRepeatUi();
    saveState();
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

  const muteBtn = document.getElementById('mute-btn');

  function updateMuteUi() {
    muteBtn.textContent = state.muted ? '🔇' : state.volume === 0 ? '🔈' : '🔊';
    muteBtn.classList.toggle('toggle-active', state.muted);
  }

  volumeEl.addEventListener('input', () => {
    state.volume = Number(volumeEl.value);
    audioEl.volume = state.volume / 100;
    if (state.muted) {
      state.muted = false;
      audioEl.muted = false;
    }
    updateMuteUi();
    saveState();
  });

  muteBtn.addEventListener('click', () => {
    state.muted = !state.muted;
    audioEl.muted = state.muted;
    updateMuteUi();
    saveState();
  });

  // ---------- Keyboard shortcuts ----------
  // Ignored while typing in a text field so Space/M/N/P still work as normal
  // characters in the stream-url / Jellyfin / Plex inputs.
  document.addEventListener('keydown', (e) => {
    const el = document.activeElement;
    const tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      playBtn.click();
    } else if (e.key === 'm' || e.key === 'M') {
      muteBtn.click();
    } else if (e.key === 'n' || e.key === 'N') {
      document.getElementById('next-btn').click();
    } else if (e.key === 'p' || e.key === 'P') {
      document.getElementById('prev-btn').click();
    }
  });

  // ---------- Streaming links ----------
  const streamFrameWrap = document.getElementById('stream-frame-wrap');
  const streamFrame = document.getElementById('stream-frame');
  const streamHistoryEl = document.getElementById('stream-history');

  // YouTube's embed player frequently fails with "Error 153 / Video player
  // configuration error" when it can't validate the embedding page's origin —
  // common in Electron webview/iframe contexts that don't present a normal
  // browser Referer. Passing a valid https:// origin (YouTube trusts itself)
  // avoids that check failing outright.
  function withYoutubeOrigin(embedUrl, startSeconds) {
    const u = new URL(embedUrl);
    u.searchParams.set('origin', 'https://www.youtube.com');
    if (startSeconds) u.searchParams.set('start', String(startSeconds));
    return u.toString();
  }

  // YouTube's shareable "t" param is either a plain integer or a compact
  // "1h2m3s"-style duration; the embed player only understands whole seconds.
  function parseYoutubeStart(raw) {
    if (!raw) return null;
    if (/^\d+$/.test(raw)) return Number(raw);
    const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (!m || (!m[1] && !m[2] && !m[3])) return null;
    return (Number(m[1]) || 0) * 3600 + (Number(m[2]) || 0) * 60 + (Number(m[3]) || 0);
  }

  function buildEmbedUrl(raw) {
    let url;
    try { url = new URL(raw.trim()); } catch { return null; }
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const id = url.searchParams.get('v');
      const list = url.searchParams.get('list');
      const start = parseYoutubeStart(url.searchParams.get('t'));
      if (id) return withYoutubeOrigin(`https://www.youtube.com/embed/${id}${list ? '?list=' + list : ''}`, start);
      if (url.pathname.startsWith('/shorts/')) {
        const shortId = url.pathname.split('/')[2];
        if (shortId) return withYoutubeOrigin(`https://www.youtube.com/embed/${shortId}`);
      }
      if (url.pathname.startsWith('/playlist') && list) return withYoutubeOrigin(`https://www.youtube.com/embed/videoseries?list=${list}`);
      return null;
    }
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1);
      const start = parseYoutubeStart(url.searchParams.get('t'));
      return id ? withYoutubeOrigin(`https://www.youtube.com/embed/${id}`, start) : null;
    }
    if (host === 'open.spotify.com') {
      // Share links are sometimes locale-prefixed, e.g. /intl-de/track/<id>,
      // so find the actual content-type segment instead of assuming parts[0].
      const parts = url.pathname.split('/').filter(Boolean);
      const types = ['track', 'album', 'playlist', 'episode', 'show', 'artist'];
      const typeIndex = parts.findIndex((p) => types.includes(p));
      if (typeIndex !== -1 && parts[typeIndex + 1]) {
        return `https://open.spotify.com/embed/${parts[typeIndex]}/${parts[typeIndex + 1]}`;
      }
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
    if (window.CVGame) CVGame.recordEvent('streamLoaded');
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

  // Opens a YouTube search in the user's browser for popular gaming lofi
  // remixes — nothing is embedded or bundled in-app, this just helps find a
  // link to paste above, so no copyrighted content ever ships with CodeVibe.
  document.querySelectorAll('#gaming-lofi-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (!window.codevibe || !window.codevibe.openExternal) return;
      const query = `${chip.dataset.lofiQuery} lofi`;
      window.codevibe.openExternal('https://www.youtube.com/results?search_query=' + encodeURIComponent(query));
    });
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

  // A self-hosted server address with no scheme (e.g. "192.168.1.10:8096") is
  // assumed to be plain http, matching how these servers are usually reached
  // on a LAN. Anything with a non-http(s) scheme (file:, javascript:, etc.) is
  // rejected outright rather than being handed to fetch().
  function normalizeServerUrl(raw) {
    let s = (raw || '').trim().replace(/\/$/, '');
    if (!s) return null;
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(s)) s = 'http://' + s;
    return /^https?:\/\//i.test(s) ? s : null;
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
    const server = normalizeServerUrl(document.getElementById('jellyfin-server').value);
    const username = document.getElementById('jellyfin-username').value.trim();
    const password = document.getElementById('jellyfin-password').value;
    jellyfinErrorEl.classList.add('hidden');
    if (!server || !username) {
      jellyfinErrorEl.textContent = server === null && document.getElementById('jellyfin-server').value.trim()
        ? 'Server address must be a valid http(s) URL.'
        : 'Server address and username are required.';
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
    const server = normalizeServerUrl(document.getElementById('plex-server').value);
    plexServerErrorEl.classList.add('hidden');
    if (!server) {
      plexServerErrorEl.textContent = 'Server address is required and must be a valid http(s) URL.';
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

  function drawOrbitRings() {
    analyser.getByteFrequencyData(dataArray);
    const [r, g, b] = accentRGB();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const ringCount = 5;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.42;
    const rotation = Date.now() / 6000;
    for (let ring = 0; ring < ringCount; ring++) {
      const bandStart = Math.floor((ring / ringCount) * dataArray.length);
      const bandEnd = Math.floor(((ring + 1) / ringCount) * dataArray.length);
      let sum = 0;
      for (let i = bandStart; i < bandEnd; i++) sum += dataArray[i];
      const energy = sum / Math.max(1, bandEnd - bandStart) / 255;
      const radius = ((maxRadius * (ring + 1)) / ringCount) * (0.85 + energy * 0.3);
      const direction = ring % 2 === 0 ? 1 : -1;
      const start = rotation * direction;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + Math.PI * (1.2 + energy * 0.6));
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.25 + energy * 0.6})`;
      ctx.lineWidth = 2 + energy * 4;
      ctx.stroke();
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
        else if (state.vizStyle === 'orbit') drawOrbitRings();
        else drawBars();
      } else {
        drawAmbient(t);
      }
    }

    // Beat-reactive avatar: a light pulse driven by live audio energy, layered
    // on top of the widget's own idle bob (which lives on the outer wrapper).
    if (typeof avatarWidgetCanvas !== 'undefined' && avatarWidgetCanvas) {
      if (mode === 'local' && analyser && !audioEl.paused) {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, v) => a + v, 0) / dataArray.length / 255;
        avatarWidgetCanvas.style.transform = `scale(${1 + avg * 0.25})`;
      } else {
        avatarWidgetCanvas.style.transform = 'scale(1)';
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
      } else if (status.state === 'whats-new') {
        showWhatsNewModal(status.version, status.notes);
      } else {
        checkBtn.classList.remove('spinning');
        hideBanner();
      }
    });
  }

  // ---------- "What's New" modal ----------
  const whatsNewModal = document.getElementById('whats-new-modal');
  const whatsNewTitle = document.getElementById('whats-new-title');
  const whatsNewBody = document.getElementById('whats-new-body');

  function showWhatsNewModal(version, notes) {
    whatsNewTitle.textContent = `What's New in v${version}`;
    whatsNewBody.textContent = notes && notes.trim() ? notes.trim() : 'This update includes fixes and improvements.';
    whatsNewModal.dataset.version = version || '';
    whatsNewModal.classList.remove('hidden');
  }
  function hideWhatsNewModal() {
    whatsNewModal.classList.add('hidden');
  }
  document.getElementById('whats-new-close').addEventListener('click', hideWhatsNewModal);
  document.getElementById('whats-new-ok-btn').addEventListener('click', hideWhatsNewModal);
  document.getElementById('whats-new-github-btn').addEventListener('click', () => {
    const version = whatsNewModal.dataset.version;
    if (version && window.codevibe && window.codevibe.openExternal) {
      window.codevibe.openExternal(`https://github.com/Installation-04/codevibe/releases/tag/v${version}`);
    }
  });
  whatsNewModal.addEventListener('click', (e) => {
    if (e.target === whatsNewModal) hideWhatsNewModal();
  });

  // ---------- Global hotkeys ----------
  // Fires for both a real OS-level hotkey and a button press relayed from
  // the floating mini-widget (main.js forwards widget-action onto the same
  // 'hotkey' channel), so one handler covers both sources.
  if (window.codevibe && window.codevibe.onHotkey) {
    window.codevibe.onHotkey((action) => {
      if (action === 'play-pause') playBtn.click();
      else if (action === 'next') document.getElementById('next-btn').click();
      else if (action === 'prev') document.getElementById('prev-btn').click();
      else if (action === 'focus-toggle') { if (focusTimer.running) pauseFocusTimer(); else startFocusTimer(); }
    });
  }

  const globalHotkeysToggle = document.getElementById('global-hotkeys-toggle');
  function applyGlobalHotkeysSetting() {
    if (window.codevibe && window.codevibe.setGlobalHotkeys) {
      window.codevibe.setGlobalHotkeys(state.globalHotkeys);
    }
  }
  globalHotkeysToggle.addEventListener('change', () => {
    state.globalHotkeys = globalHotkeysToggle.checked;
    applyGlobalHotkeysSetting();
    saveState();
  });

  // ---------- Floating mini-widget ----------
  const miniWidgetBtn = document.getElementById('mini-widget-btn');
  if (miniWidgetBtn && window.codevibe && window.codevibe.toggleMiniWidget) {
    miniWidgetBtn.addEventListener('click', () => window.codevibe.toggleMiniWidget());
  }
  if (window.codevibe && window.codevibe.onMiniWidgetState) {
    window.codevibe.onMiniWidgetState((open) => {
      miniWidgetBtn.textContent = open ? 'Close Floating Widget' : 'Open Floating Widget';
      // The next tick's avatar SVG is only (re-)sent when it differs from the
      // last one pushed — reset that cache so a freshly opened widget (which
      // has nothing yet) gets it immediately instead of waiting for the
      // avatar to actually change.
      if (open) { lastWidgetAvatarKey = null; pushWidgetState(); }
    });
  }

  let lastWidgetAvatarKey = null;
  function pushWidgetState() {
    if (!window.codevibe || !window.codevibe.sendWidgetState) return;
    const avatarKey = window.CVGame ? JSON.stringify(CVGame.state.avatar) : null;
    const payload = {
      trackName: npTitle.textContent,
      playing: !audioEl.paused && mode !== 'idle',
      focusTime: document.getElementById('focus-time').textContent,
      focusMode: document.getElementById('focus-mode-label').textContent
    };
    if (window.CVAvatar && window.CVGame && avatarKey !== lastWidgetAvatarKey) {
      payload.avatarSvg = CVAvatar.buildAvatarSVG(CVGame.state.avatar);
      lastWidgetAvatarKey = avatarKey;
    }
    window.codevibe.sendWidgetState(payload);
  }
  setInterval(pushWidgetState, 1000);

  // ---------- Profile export / import ----------
  function exportProfile() {
    const settings = { ...state };
    SECURE_FIELDS.forEach((f) => delete settings[f]);
    let game = null;
    try { game = JSON.parse(localStorage.getItem('codevibe.game.v1') || 'null'); } catch { /* leave null */ }
    const payload = { codevibeProfile: 1, exportedAt: new Date().toISOString(), settings, game };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codevibe-profile-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importProfile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(reader.result); } catch {
        if (window.CVGame) CVGame.showToast({ icon: '⚠️', title: 'Import failed', subtitle: 'That file is not a valid CodeVibe profile.' });
        return;
      }
      if (!data || data.codevibeProfile !== 1 || !data.settings) {
        if (window.CVGame) CVGame.showToast({ icon: '⚠️', title: 'Import failed', subtitle: 'Unrecognized profile format.' });
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.settings));
      if (data.game) localStorage.setItem('codevibe.game.v1', JSON.stringify(data.game));
      location.reload();
    };
    reader.readAsText(file);
  }

  // ---------- Ambient soundscape (procedural, no external audio files) ----------
  let ambientCtx = null;
  const ambientLayers = {};

  function ensureAmbientCtx() {
    if (!ambientCtx) ambientCtx = new (window.AudioContext || window.webkitAudioContext)();
    return ambientCtx;
  }

  function makeNoiseBuffer(ctx, seconds, brown) {
    const size = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5; }
      else data[i] = white;
    }
    return buffer;
  }

  function buildAmbientLayer(kind) {
    const ctx = ensureAmbientCtx();
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const shaped = ctx.createGain();
    const gain = ctx.createGain();
    gain.gain.value = 0;

    if (kind === 'rain') {
      src.buffer = makeNoiseBuffer(ctx, 3, false);
      filter.type = 'bandpass'; filter.frequency.value = 5000; filter.Q.value = 0.6;
      shaped.gain.value = 1;
    } else if (kind === 'fire') {
      src.buffer = makeNoiseBuffer(ctx, 3, true);
      filter.type = 'lowpass'; filter.frequency.value = 700;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.15;
      shaped.gain.value = 0.85;
      lfo.connect(lfoGain).connect(shaped.gain);
      lfo.start();
    } else { // cafe
      src.buffer = makeNoiseBuffer(ctx, 3, false);
      filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 0.4;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.1;
      shaped.gain.value = 0.9;
      lfo.connect(lfoGain).connect(shaped.gain);
      lfo.start();
    }

    src.loop = true;
    src.connect(filter).connect(shaped).connect(gain).connect(ctx.destination);
    src.start();
    return { gain };
  }

  function setAmbientVolume(kind, volume) {
    if (!ambientLayers[kind]) ambientLayers[kind] = buildAmbientLayer(kind);
    const ctx = ensureAmbientCtx();
    const target = (volume / 100) * 0.35; // capped so it stays ambient, never overpowers the music
    ambientLayers[kind].gain.gain.setTargetAtTime(target, ctx.currentTime, 0.3);
  }

  ['rain', 'fire', 'cafe'].forEach((kind) => {
    const el = document.getElementById(`ambient-${kind}`);
    el.addEventListener('input', () => {
      state.ambientVolumes[kind] = Number(el.value);
      setAmbientVolume(kind, Number(el.value));
      saveState();
    });
  });

  // User-supplied ambient track (extra mixer layer beyond the procedural ones)
  let ambientCustomAudio = null;

  function applyAmbientCustomTrack(track, volume) {
    document.getElementById('ambient-custom-row').classList.toggle('hidden', !track);
    document.getElementById('ambient-custom-clear-btn').classList.toggle('hidden', !track);
    document.getElementById('ambient-custom-label').textContent = track ? track.name : '';
    document.getElementById('ambient-custom').value = volume;
  }

  document.getElementById('ambient-custom-btn').addEventListener('click', async () => {
    if (!window.codevibe || !window.codevibe.pickAudioFiles) return;
    const files = await window.codevibe.pickAudioFiles();
    if (!files.length) return;
    const file = files[0];
    const url = await toFileUrl(file.path);
    if (ambientCustomAudio) ambientCustomAudio.pause();
    ambientCustomAudio = new Audio(url);
    ambientCustomAudio.loop = true;
    ambientCustomAudio.volume = state.ambientCustomVolume / 100;
    ambientCustomAudio.play().catch(() => {});
    state.ambientCustomTrack = { path: file.path, name: file.name };
    applyAmbientCustomTrack(state.ambientCustomTrack, state.ambientCustomVolume);
    saveState();
  });
  document.getElementById('ambient-custom').addEventListener('input', (e) => {
    state.ambientCustomVolume = Number(e.target.value);
    if (ambientCustomAudio) ambientCustomAudio.volume = state.ambientCustomVolume / 100;
    saveState();
  });
  document.getElementById('ambient-custom-clear-btn').addEventListener('click', () => {
    if (ambientCustomAudio) { ambientCustomAudio.pause(); ambientCustomAudio = null; }
    state.ambientCustomTrack = null;
    applyAmbientCustomTrack(null, state.ambientCustomVolume);
    saveState();
  });

  // ---------- Gentle break reminders ----------
  let breakReminderElapsedMin = 0;
  setInterval(() => {
    if (!state.breakReminderMin) { breakReminderElapsedMin = 0; return; }
    breakReminderElapsedMin += 1;
    if (breakReminderElapsedMin >= state.breakReminderMin) {
      breakReminderElapsedMin = 0;
      if (window.CVGame) CVGame.showToast({ icon: '🧘', title: 'Time for a break', subtitle: 'Stretch, hydrate, rest your eyes for a moment.' });
    }
  }, 60000);

  document.querySelectorAll('#break-reminder-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#break-reminder-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.breakReminderMin = Number(chip.dataset.breakmin);
      breakReminderElapsedMin = 0;
      saveState();
    });
  });

  // ---------- Gamepad navigation ----------
  let gamepadIndex = -1;
  let gamepadPrevButtons = [];

  function getGamepadNavElements() {
    const panel = document.querySelector('.tab-panel.active');
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('button, input[type="text"], input[type="color"], input[type="range"], .preset-card, .item-card, .swatch'))
      .filter((el) => el.offsetParent !== null && !el.disabled);
  }

  function highlightGamepadSelection() {
    document.querySelectorAll('.gamepad-selected').forEach((el) => el.classList.remove('gamepad-selected'));
    const els = getGamepadNavElements();
    if (!els.length) { gamepadIndex = -1; return; }
    gamepadIndex = Math.max(0, Math.min(gamepadIndex, els.length - 1));
    els[gamepadIndex].classList.add('gamepad-selected');
    els[gamepadIndex].scrollIntoView({ block: 'nearest' });
  }

  function moveGamepadSelection(delta) {
    const els = getGamepadNavElements();
    if (!els.length) return;
    gamepadIndex = ((gamepadIndex + delta) % els.length + els.length) % els.length;
    highlightGamepadSelection();
  }

  function activateGamepadSelection() {
    const els = getGamepadNavElements();
    if (els[gamepadIndex]) els[gamepadIndex].click();
  }

  function switchGamepadTab(delta) {
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    const activeIdx = tabs.findIndex((t) => t.classList.contains('active'));
    const next = ((activeIdx + delta) % tabs.length + tabs.length) % tabs.length;
    tabs[next].click();
    gamepadIndex = 0;
    highlightGamepadSelection();
  }

  function pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && pads[0];
    if (!pad) { gamepadPrevButtons = []; return; }
    const buttons = pad.buttons.map((b) => b.pressed);
    const rising = (i) => buttons[i] && !gamepadPrevButtons[i];
    if (rising(12)) moveGamepadSelection(-1); // D-pad up
    if (rising(13)) moveGamepadSelection(1);  // D-pad down
    if (rising(14)) switchGamepadTab(-1);     // D-pad left
    if (rising(15)) switchGamepadTab(1);      // D-pad right
    if (rising(4)) switchGamepadTab(-1);      // L1
    if (rising(5)) switchGamepadTab(1);       // R1
    if (rising(0)) activateGamepadSelection(); // A
    gamepadPrevButtons = buttons;
  }

  setInterval(() => { if (state.gamepadNav) pollGamepad(); }, 100);

  document.getElementById('gamepad-nav-toggle').addEventListener('change', (e) => {
    state.gamepadNav = e.target.checked;
    if (state.gamepadNav) { gamepadIndex = 0; highlightGamepadSelection(); }
    else document.querySelectorAll('.gamepad-selected').forEach((el) => el.classList.remove('gamepad-selected'));
    saveState();
  });

  window.addEventListener('gamepadconnected', () => {
    if (window.CVGame && state.gamepadNav) {
      CVGame.showToast({ icon: '🎮', title: 'Controller connected', subtitle: 'D-pad to navigate, A to select.' });
    }
  });

  document.getElementById('export-profile-btn').addEventListener('click', exportProfile);
  document.getElementById('import-profile-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => {
      if (input.files && input.files[0]) importProfile(input.files[0]);
    });
    input.click();
  });

  // ---------- Gamification: Avatar / Shop / Progress ----------
  const coinBadge = document.getElementById('coin-badge');
  const avatarPreviewEl = document.getElementById('avatar-preview');
  const avatarWidgetEl = document.getElementById('avatar-widget');
  const avatarWidgetCanvas = document.getElementById('avatar-widget-canvas');
  const petPreviewEl = document.getElementById('pet-preview');
  const petWidgetCanvas = document.getElementById('pet-widget-canvas');
  const SHOP_CATEGORY_LABELS = { hair: 'Hair Styles', outfit: 'Outfits', accessory: 'Accessories', aura: 'Auras', hat: 'Hats', held: 'Held Items', pet: 'Pets', scene: 'Scenes' };

  function updateCoinBadge() {
    if (!window.CVGame) return;
    coinBadge.textContent = `🪙 ${CVGame.state.coins}`;
  }

  function applyAvatarAura() {
    if (!window.CVGame) return;
    const aura = CVGame.state.avatar.aura || 'none';
    avatarWidgetEl.className = 'avatar-widget aura-' + aura;
    avatarWidgetEl.classList.toggle('hidden', !CVGame.state.avatarWidgetVisible);
  }

  function refreshAvatarVisuals() {
    if (!window.CVGame) return;
    const svg = CVAvatar.buildAvatarSVG(CVGame.state.avatar);
    avatarPreviewEl.innerHTML = svg;
    avatarWidgetCanvas.innerHTML = svg;
    applyAvatarAura();
    updateCoinBadge();
    const petSvg = CVAvatar.buildPetSVG(CVGame.state.pet.species, CVGame.state.pet.color);
    petPreviewEl.innerHTML = petSvg;
    petWidgetCanvas.innerHTML = petSvg;
  }

  function createItemCard({ label, owned, equipped, cost, onClick }) {
    const card = document.createElement('div');
    card.className = 'item-card' + (equipped ? ' active' : '') + (!owned ? ' locked' : '');
    const name = document.createElement('span');
    name.className = 'item-card-label';
    name.textContent = label;
    const badge = document.createElement('span');
    badge.className = 'item-card-badge';
    badge.textContent = owned ? (equipped ? 'Equipped' : 'Owned') : `🔒 ${cost}`;
    card.appendChild(name);
    card.appendChild(badge);
    card.addEventListener('click', onClick);
    return card;
  }

  function tryEquip(category, key) {
    if (!CVGame.isOwned(category, key)) {
      const result = CVGame.buyItem(category, key);
      if (!result.ok) {
        CVGame.showToast({ icon: '🪙', title: 'Not enough Vibe Coins', subtitle: `Need ${result.missing} more — keep vibing to earn more!` });
        return;
      }
    }
    CVGame.equip(category, key);
    if (category === 'scene') { renderSceneRow(); applyBackgroundMode(); }
  }

  function renderAvatarCatalogs() {
    if (!window.CVGame) return;
    const avatar = CVGame.state.avatar;

    const bodyRow = document.getElementById('avatar-body-row');
    bodyRow.innerHTML = '';
    Object.entries(CVAvatar.BODY_TYPES).forEach(([key, def]) => {
      const chip = document.createElement('button');
      chip.className = 'chip' + (avatar.bodyType === key ? ' active' : '');
      chip.textContent = def.label;
      chip.addEventListener('click', () => CVGame.setAvatarField('bodyType', key));
      bodyRow.appendChild(chip);
    });

    const skinRow = document.getElementById('avatar-skin-row');
    skinRow.innerHTML = '';
    CVAvatar.SKIN_TONES.forEach((hex) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (avatar.skinTone.toLowerCase() === hex.toLowerCase() ? ' active' : '');
      sw.style.background = hex;
      sw.title = hex;
      sw.addEventListener('click', () => CVGame.setAvatarField('skinTone', hex));
      skinRow.appendChild(sw);
    });

    function renderStyleGrid(rowId, catalog, category, currentKey) {
      const row = document.getElementById(rowId);
      row.innerHTML = '';
      Object.entries(catalog).forEach(([key, def]) => {
        const owned = CVGame.isOwned(category, key);
        const cost = (CVGame.SHOP_ITEMS.find((i) => i.id === `${category}:${key}`) || {}).cost;
        row.appendChild(createItemCard({
          label: def.label, owned, equipped: currentKey === key, cost,
          onClick: () => tryEquip(category, key)
        }));
      });
    }
    renderStyleGrid('avatar-hair-row', CVAvatar.HAIR_STYLES, 'hair', avatar.hair);
    renderStyleGrid('avatar-outfit-row', CVAvatar.OUTFIT_STYLES, 'outfit', avatar.outfit);
    renderStyleGrid('avatar-accessory-row', CVAvatar.ACCESSORY_STYLES, 'accessory', avatar.accessory);
    renderStyleGrid('avatar-hat-row', CVAvatar.HAT_STYLES, 'hat', avatar.hat);
    renderStyleGrid('avatar-held-row', CVAvatar.HELD_ITEM_STYLES, 'held', avatar.held);
    renderStyleGrid('avatar-aura-row', CVAvatar.AURA_STYLES, 'aura', avatar.aura);

    const hairColorRow = document.getElementById('avatar-haircolor-row');
    hairColorRow.innerHTML = '';
    CVAvatar.HAIR_COLORS.forEach((hex) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (avatar.hairColor.toLowerCase() === hex.toLowerCase() ? ' active' : '');
      sw.style.background = hex;
      sw.addEventListener('click', () => CVGame.setAvatarField('hairColor', hex));
      hairColorRow.appendChild(sw);
    });

    const outfitColorRow = document.getElementById('avatar-outfitcolor-row');
    outfitColorRow.innerHTML = '';
    CVAvatar.OUTFIT_COLORS.forEach((hex) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (avatar.outfitColor.toLowerCase() === hex.toLowerCase() ? ' active' : '');
      sw.style.background = hex;
      sw.addEventListener('click', () => CVGame.setAvatarField('outfitColor', hex));
      outfitColorRow.appendChild(sw);
    });

    const hatColorRow = document.getElementById('avatar-hatcolor-row');
    hatColorRow.innerHTML = '';
    CVAvatar.OUTFIT_COLORS.forEach((hex) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (avatar.hatColor.toLowerCase() === hex.toLowerCase() ? ' active' : '');
      sw.style.background = hex;
      sw.addEventListener('click', () => CVGame.setAvatarField('hatColor', hex));
      hatColorRow.appendChild(sw);
    });
  }

  function renderPetCatalog() {
    if (!window.CVGame) return;
    const pet = CVGame.state.pet;

    const speciesRow = document.getElementById('pet-species-row');
    speciesRow.innerHTML = '';
    Object.entries(CVAvatar.PET_STYLES).forEach(([key, def]) => {
      const owned = CVGame.isOwned('pet', key);
      const cost = (CVGame.SHOP_ITEMS.find((i) => i.id === `pet:${key}`) || {}).cost;
      speciesRow.appendChild(createItemCard({
        label: def.label, owned, equipped: pet.species === key, cost,
        onClick: () => tryEquip('pet', key)
      }));
    });

    const colorRow = document.getElementById('pet-color-row');
    colorRow.innerHTML = '';
    CVAvatar.OUTFIT_COLORS.forEach((hex) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (pet.color.toLowerCase() === hex.toLowerCase() ? ' active' : '');
      sw.style.background = hex;
      sw.addEventListener('click', () => CVGame.setPetField('color', hex));
      colorRow.appendChild(sw);
    });
  }

  function renderShop() {
    if (!window.CVGame) return;
    const container = document.getElementById('shop-sections');
    container.innerHTML = '';
    CVGame.CATEGORIES.forEach((category) => {
      const items = CVGame.SHOP_ITEMS.filter((i) => i.category === category);
      if (!items.length) return;
      const heading = document.createElement('h3');
      heading.textContent = SHOP_CATEGORY_LABELS[category] || category;
      container.appendChild(heading);
      const grid = document.createElement('div');
      grid.className = 'item-grid';
      items.forEach((item) => {
        const owned = CVGame.isOwned(category, item.key);
        const equipped = category === 'scene' ? CVGame.state.scene === item.key
          : category === 'pet' ? CVGame.state.pet.species === item.key
          : CVGame.state.avatar[category] === item.key;
        grid.appendChild(createItemCard({ label: item.label, owned, equipped, cost: item.cost, onClick: () => tryEquip(category, item.key) }));
      });
      container.appendChild(grid);
    });
  }

  function renderSceneRow() {
    if (!window.CVGame) return;
    const row = document.getElementById('scene-row');
    row.innerHTML = '';
    Object.entries(CVGame.SCENES).forEach(([key, def]) => {
      const owned = CVGame.isOwned('scene', key);
      row.appendChild(createItemCard({ label: def.label, owned, equipped: CVGame.state.scene === key, cost: def.cost, onClick: () => tryEquip('scene', key) }));
    });
  }

  function renderProgress() {
    if (!window.CVGame) return;
    const s = CVGame.state;
    document.getElementById('stat-level').textContent = s.level;
    document.getElementById('stat-coins').textContent = s.coins;
    document.getElementById('stat-streak').textContent = s.streakCount;
    const h = Math.floor(s.totalMinutesListened / 60), m = s.totalMinutesListened % 60;
    document.getElementById('stat-time').textContent = `${h}h ${m}m`;

    const need = CVGame.xpForLevel(s.level);
    document.getElementById('xp-bar-fill').style.width = `${Math.min(100, (s.xp / need) * 100)}%`;
    document.getElementById('xp-bar-label').textContent = `${s.xp} / ${need} XP`;

    const list = document.getElementById('achievement-list');
    list.innerHTML = '';
    CVGame.ACHIEVEMENTS.forEach((a) => {
      const unlocked = s.achievementsUnlocked.includes(a.id);
      const li = document.createElement('li');
      li.className = 'achievement-item' + (unlocked ? ' unlocked' : '');
      li.innerHTML = '<span class="achievement-icon"></span><span class="achievement-text"><span class="achievement-name"></span><span class="achievement-desc"></span></span><span class="achievement-reward"></span>';
      li.querySelector('.achievement-icon').textContent = a.icon;
      li.querySelector('.achievement-name').textContent = a.name;
      li.querySelector('.achievement-desc').textContent = a.desc;
      li.querySelector('.achievement-reward').textContent = unlocked ? '✓' : '+' + a.reward;
      list.appendChild(li);
    });

    renderQuestList('daily-quest-list', CVGame.DAILY_QUESTS, s.dailyProgress, s.dailyQuestsClaimed);
    renderQuestList('weekly-quest-list', CVGame.WEEKLY_QUESTS, s.weeklyProgress, s.weeklyQuestsClaimed);
    renderHistoryChart();
    renderStreakHeatmap();
    renderTrophyCase();
  }

  // ---------- Trophy case ----------
  function renderTrophyCase() {
    if (!window.CVGame) return;
    const s = CVGame.state;
    const container = document.getElementById('trophy-case');
    container.innerHTML = '';
    CVGame.ACHIEVEMENTS.forEach((a) => {
      const unlocked = s.achievementsUnlocked.includes(a.id);
      const badge = document.createElement('div');
      badge.className = 'trophy-badge' + (unlocked ? ' unlocked' : '');
      badge.title = unlocked ? `${a.name} — ${a.desc}` : `Locked — ${a.desc}`;
      badge.innerHTML = '<span class="trophy-icon"></span><span class="trophy-name"></span>';
      badge.querySelector('.trophy-icon').textContent = unlocked ? a.icon : '🔒';
      badge.querySelector('.trophy-name').textContent = unlocked ? a.name : '???';
      container.appendChild(badge);
    });
  }

  document.querySelectorAll('[data-achview]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-achview]').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.achievementView = chip.dataset.achview;
      document.getElementById('achievement-list').classList.toggle('hidden', state.achievementView !== 'list');
      document.getElementById('trophy-case').classList.toggle('hidden', state.achievementView !== 'trophy');
      saveState();
    });
  });

  // ---------- Streak heatmap ----------
  function renderStreakHeatmap() {
    if (!window.CVGame) return;
    const container = document.getElementById('streak-heatmap');
    container.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeDays = 56;
    const start = new Date(today);
    start.setDate(start.getDate() - (rangeDays - 1));
    start.setDate(start.getDate() - start.getDay()); // align to the preceding Sunday

    const minutesByDate = CVGame.state.dailyMinutes;
    const max = Math.max(1, ...Object.values(minutesByDate));

    const cursor = new Date(start);
    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      const mins = minutesByDate[key] || 0;
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.dataset.level = mins > 0 ? String(Math.min(4, Math.ceil((mins / max) * 4))) : '0';
      cell.title = `${cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${mins} min`;
      container.appendChild(cell);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  function renderQuestList(listId, quests, progressObj, claimed) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    quests.forEach((q) => {
      const done = claimed.includes(q.id);
      const current = Math.min(q.target, q.progress(progressObj));
      const li = document.createElement('li');
      li.className = 'achievement-item' + (done ? ' unlocked' : '');
      li.innerHTML = '<span class="achievement-icon"></span><span class="achievement-text"><span class="achievement-name"></span><span class="achievement-desc"></span></span><span class="achievement-reward"></span>';
      li.querySelector('.achievement-icon').textContent = q.icon;
      li.querySelector('.achievement-name').textContent = q.name;
      li.querySelector('.achievement-desc').textContent = done ? q.desc : `${q.desc} (${current}/${q.target})`;
      li.querySelector('.achievement-reward').textContent = done ? '✓' : '+' + q.reward;
      list.appendChild(li);
    });
  }

  function renderHistoryChart() {
    const container = document.getElementById('history-chart');
    container.innerHTML = '';
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const minutesByDay = days.map((d) => CVGame.state.dailyMinutes[d.toISOString().slice(0, 10)] || 0);
    const max = Math.max(1, ...minutesByDay);
    days.forEach((d, i) => {
      const bar = document.createElement('div');
      bar.className = 'history-bar';
      const fill = document.createElement('div');
      fill.className = 'history-bar-fill';
      fill.style.height = `${Math.max(4, (minutesByDay[i] / max) * 100)}%`;
      fill.title = `${minutesByDay[i]} min`;
      const label = document.createElement('div');
      label.className = 'history-bar-label';
      label.textContent = d.toLocaleDateString(undefined, { weekday: 'narrow' });
      bar.appendChild(fill);
      bar.appendChild(label);
      container.appendChild(bar);
    });
  }

  // ---------- Vibe Card export ----------
  function loadSvgImage(svgString) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    });
  }

  async function exportVibeCard() {
    const s = CVGame.state;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const bg1 = getComputedStyle(document.body).getPropertyValue('--bg-1').trim() || '#241726';
    const bg2 = getComputedStyle(document.body).getPropertyValue('--bg-2').trim() || '#0d0714';
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#ff9f6e';

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, bg1);
    grad.addColorStop(1, bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('CodeVibe', canvas.width / 2, 64);

    const avatarImg = await loadSvgImage(CVAvatar.buildAvatarSVG(s.avatar));
    const imgW = 240, imgH = 264;
    ctx.drawImage(avatarImg, (canvas.width - imgW) / 2, 90, imgW, imgH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`Level ${s.level}`, canvas.width / 2, 400);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const hours = Math.floor(s.totalMinutesListened / 60), mins = s.totalMinutesListened % 60;
    const lines = [
      `🪙 ${s.coins} Vibe Coins`,
      `🔥 ${s.streakCount} Day Streak`,
      `⏱️ ${hours}h ${mins}m Vibe Time`,
      `🏆 ${s.achievementsUnlocked.length} Achievements`
    ];
    lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, 450 + i * 38));

    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, 770);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'codevibe-vibe-card.png';
    a.click();
  }

  document.getElementById('export-vibe-card-btn').addEventListener('click', () => {
    if (window.CVGame) exportVibeCard();
  });

  document.getElementById('avatar-widget-toggle').addEventListener('change', (e) => {
    if (!window.CVGame) return;
    CVGame.state.avatarWidgetVisible = e.target.checked;
    CVGame.save();
    applyAvatarAura();
  });

  // Draggable avatar widget (same pattern as the clock widget)
  (function makeAvatarDraggable() {
    let dragging = false, offX = 0, offY = 0;
    avatarWidgetEl.addEventListener('mousedown', (e) => {
      dragging = true;
      const rect = avatarWidgetEl.getBoundingClientRect();
      offX = e.clientX - rect.left;
      offY = e.clientY - rect.top;
      avatarWidgetEl.style.right = 'auto';
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      avatarWidgetEl.style.left = `${e.clientX - offX}px`;
      avatarWidgetEl.style.top = `${e.clientY - offY}px`;
    });
    window.addEventListener('mouseup', () => {
      if (!dragging || !window.CVGame) return;
      dragging = false;
      CVGame.state.avatarPos = { left: avatarWidgetEl.style.left, top: avatarWidgetEl.style.top };
      CVGame.save();
    });
  })();

  // Ticks once a second while music/streaming is actually playing, converting
  // real listening time into Vibe Coins + XP (see gamification.js).
  setInterval(() => {
    if (!window.CVGame) return;
    const isVibing =
      ((mode === 'local' || mode === 'remote') && !audioEl.paused) ||
      (mode === 'stream' && !!streamFrame.src && streamErrorEl.classList.contains('hidden'));
    if (isVibing) CVGame.addVibeSeconds(1);
  }, 1000);

  if (window.CVGame) {
    CVGame.onChange(() => {
      refreshAvatarVisuals();
      renderProgress();
      renderAvatarCatalogs();
      renderPetCatalog();
      renderShop();
    });
  }

  // ---------- Focus timer ----------
  const focusTimeEl = document.getElementById('focus-time');
  const focusModeLabelEl = document.getElementById('focus-mode-label');
  const focusWidgetEl = document.getElementById('focus-widget');
  const focusWidgetTimeEl = document.getElementById('focus-widget-time');
  const focusWidgetModeEl = document.getElementById('focus-widget-mode');
  const focusStartBtn = document.getElementById('focus-start-btn');
  const focusPauseBtn = document.getElementById('focus-pause-btn');

  const focusTimer = {
    running: false,
    mode: 'focus', // 'focus' | 'break'
    remainingSeconds: 25 * 60,
    intervalId: null,
    sessionsSinceLongBreak: 0
  };

  function formatMMSS(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function updateFocusDisplay() {
    const text = formatMMSS(focusTimer.remainingSeconds);
    const modeLabel = focusTimer.mode === 'focus' ? 'Focus' : 'Break';
    focusTimeEl.textContent = text;
    focusModeLabelEl.textContent = modeLabel;
    focusWidgetTimeEl.textContent = text;
    focusWidgetModeEl.textContent = modeLabel;
    focusWidgetEl.classList.toggle('hidden', !focusTimer.running);
    focusStartBtn.classList.toggle('hidden', focusTimer.running);
    focusPauseBtn.classList.toggle('hidden', !focusTimer.running);
  }

  function focusTick() {
    focusTimer.remainingSeconds -= 1;
    if (focusTimer.remainingSeconds <= 0) {
      if (focusTimer.mode === 'focus') {
        if (window.CVGame) CVGame.completeFocusSession();
        focusTimer.sessionsSinceLongBreak += 1;
        const longBreak = focusTimer.sessionsSinceLongBreak % 4 === 0;
        focusTimer.mode = 'break';
        focusTimer.remainingSeconds = (longBreak ? 15 : 5) * 60;
      } else {
        focusTimer.mode = 'focus';
        focusTimer.remainingSeconds = (window.CVGame ? CVGame.state.focusDurationMin : 25) * 60;
        if (window.CVGame) CVGame.showToast({ icon: '⏰', title: "Break's over!", subtitle: 'Back to focusing.' });
      }
    }
    updateFocusDisplay();
  }

  function startFocusTimer() {
    if (focusTimer.running) return;
    focusTimer.running = true;
    focusTimer.intervalId = setInterval(focusTick, 1000);
    updateFocusDisplay();
  }

  function pauseFocusTimer() {
    focusTimer.running = false;
    clearInterval(focusTimer.intervalId);
    updateFocusDisplay();
  }

  function resetFocusTimer() {
    pauseFocusTimer();
    focusTimer.mode = 'focus';
    focusTimer.remainingSeconds = (window.CVGame ? CVGame.state.focusDurationMin : 25) * 60;
    updateFocusDisplay();
  }

  focusStartBtn.addEventListener('click', startFocusTimer);
  focusPauseBtn.addEventListener('click', pauseFocusTimer);
  document.getElementById('focus-reset-btn').addEventListener('click', resetFocusTimer);

  document.querySelectorAll('#focus-duration-row .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (focusTimer.running) return;
      document.querySelectorAll('#focus-duration-row .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const min = Number(chip.dataset.focusmin);
      if (window.CVGame) CVGame.setFocusDuration(min);
      resetFocusTimer();
    });
  });

  // ---------- Init ----------
  async function init() {
    if (window.CVGame) {
      CVGame.init();
      renderAvatarCatalogs();
      renderPetCatalog();
      renderShop();
      renderSceneRow();
      renderProgress();
      refreshAvatarVisuals();
      document.getElementById('avatar-widget-toggle').checked = CVGame.state.avatarWidgetVisible;
      if (CVGame.state.avatarPos && CVGame.state.avatarPos.left) {
        avatarWidgetEl.style.left = CVGame.state.avatarPos.left;
        avatarWidgetEl.style.top = CVGame.state.avatarPos.top;
        avatarWidgetEl.style.right = 'auto';
      }
      document.querySelectorAll('#focus-duration-row .chip').forEach((c) => {
        c.classList.toggle('active', Number(c.dataset.focusmin) === CVGame.state.focusDurationMin);
      });
      resetFocusTimer();
    }

    applyTheme();
    renderPresetGrid();
    renderCustomThemeGrid();
    syncColorInputs();
    renderAccentSwatches();
    renderTrackList();
    renderPlaylistList();
    renderStreamHistory();

    await loadSecureTokens();
    updateJellyfinUi();
    if (state.jellyfinServer && state.jellyfinToken) loadJellyfinTracks();
    updatePlexUi();
    if (state.plexServer && state.plexToken) loadPlexTracks();

    setActiveTab(state.activeTab || 'library');

    volumeEl.value = state.volume;
    audioEl.volume = state.volume / 100;
    audioEl.muted = state.muted;
    updateMuteUi();
    updateShuffleRepeatUi();
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

    globalHotkeysToggle.checked = state.globalHotkeys;
    applyGlobalHotkeysSetting();
    document.getElementById('gamepad-nav-toggle').checked = state.gamepadNav;

    document.querySelectorAll('#break-reminder-row .chip').forEach((c) => {
      c.classList.toggle('active', Number(c.dataset.breakmin) === state.breakReminderMin);
    });

    document.getElementById('ambient-rain').value = state.ambientVolumes.rain;
    document.getElementById('ambient-fire').value = state.ambientVolumes.fire;
    document.getElementById('ambient-cafe').value = state.ambientVolumes.cafe;
    ['rain', 'fire', 'cafe'].forEach((kind) => {
      if (state.ambientVolumes[kind] > 0) setAmbientVolume(kind, state.ambientVolumes[kind]);
    });
    applyAmbientCustomTrack(state.ambientCustomTrack, state.ambientCustomVolume);
    if (state.ambientCustomTrack) {
      toFileUrl(state.ambientCustomTrack.path).then((url) => {
        if (!url) return;
        ambientCustomAudio = new Audio(url);
        ambientCustomAudio.loop = true;
        ambientCustomAudio.volume = state.ambientCustomVolume / 100;
        ambientCustomAudio.play().catch(() => {});
      });
    }

    document.querySelectorAll('[data-achview]').forEach((c) => {
      c.classList.toggle('active', c.dataset.achview === state.achievementView);
    });
    document.getElementById('achievement-list').classList.toggle('hidden', state.achievementView !== 'list');
    document.getElementById('trophy-case').classList.toggle('hidden', state.achievementView !== 'trophy');
  }

  init();
  initUpdater();
})();
