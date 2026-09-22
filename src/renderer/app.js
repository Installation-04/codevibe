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
    matrix:    { label: 'Matrix',        bg1: '#001904', bg2: '#000000', accent: '#00ff41', vizStyle: 'matrix' }
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
    wallpaperPath: null,
    wallpaperFit: 'cover',
    wallpaperDim: 35,
    wallpaperBlur: 0,
    wallpaperShowViz: true
  };

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

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  document.getElementById('accent-color').addEventListener('input', (e) => {
    state.customAccent = e.target.value;
    applyTheme();
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

  function switchToLocalMode() {
    mode = 'local';
    document.getElementById('stream-frame-wrap').classList.add('hidden');
    document.getElementById('stream-frame').src = '';
    nowPlayingEl.classList.remove('hidden');
  }

  function playLocalTrack(i) {
    if (i < 0 || i >= state.tracks.length) return;
    switchToLocalMode();
    currentIndex = i;
    const track = state.tracks[i];
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
    if (mode !== 'local') {
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

  function loadStreamUrl(raw) {
    const embed = buildEmbedUrl(raw);
    if (!embed) {
      alert('Unsupported link. Try a YouTube, Spotify, or SoundCloud URL.');
      return;
    }
    mode = 'stream';
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

  // ---------- Audio-reactive visualizer ----------
  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d');
  let audioCtx, analyser, sourceNode, dataArray;
  let particles = [];

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

  const MATRIX_FONT_SIZE = 16;
  const MATRIX_CHARS = 'アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:・."=*+-<>';
  let matrixDrops = [];

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

  function tick(t) {
    if (state.vizStyle === 'matrix') {
      drawMatrixRain();
    } else {
      const hasAudioData = mode === 'local' && analyser && !audioEl.paused;
      if (hasAudioData) {
        if (state.vizStyle === 'wave') drawWave();
        else if (state.vizStyle === 'particles') drawParticlesReactive();
        else drawBars();
      } else {
        drawAmbient(t);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ---------- Init ----------
  function init() {
    applyTheme();
    renderPresetGrid();
    syncColorInputs();
    renderTrackList();
    renderStreamHistory();

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
  }

  init();
})();
