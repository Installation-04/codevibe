(() => {
  'use strict';

  // The "vibe economy": listening time earns Vibe Coins + XP, which unlock
  // avatar cosmetics and background scenes, with achievements/milestones along
  // the way. Entirely local and cosmetic — no real money, no network calls.

  const STORE_KEY = 'codevibe.game.v1';
  const COINS_PER_MINUTE = 3;
  const XP_PER_MINUTE = 8;

  const SCENES = {
    cozy_study:        { label: 'Cozy Study',        free: true,  cost: 0 },
    zen_garden:        { label: 'Zen Garden',         free: false, cost: 150 },
    beach_sunset:      { label: 'Beach Sunset',       free: false, cost: 170 },
    enchanted_forest:  { label: 'Enchanted Forest',   free: false, cost: 210 },
    retro_wave:        { label: 'Retro Wave',         free: false, cost: 230 },
    pixel_world:       { label: 'Pixel World',        free: false, cost: 250 },
    cyberpunk_skyline: { label: 'Cyberpunk Skyline',  free: false, cost: 260 },
    deep_space:        { label: 'Deep Space',         free: false, cost: 300 },
    ring_world:        { label: 'Ringworld',          free: false, cost: 320 },
    mystic_portal:     { label: 'Mystic Portal',       free: false, cost: 280 }
  };

  const HAIR_COST = { long: 90, bun: 90, mohawk: 130, afro: 110, undercut: 100, twintails: 110 };
  const OUTFIT_COST = { cyberjacket: 180, streetwear: 120, sundress: 120, robe: 130, armor: 200, kimono: 150 };
  const ACCESSORY_COST = { glasses: 70, headphones: 60, visor: 170, flowercrown: 90, catears: 150 };
  const AURA_COST = { neonglow: 110, sparkle: 130, petals: 140, matrixcode: 260 };
  const HAT_COST = { beanie: 70, crown: 220, headband: 60, cap: 80, wizardhat: 160 };
  const HELD_COST = { coffee: 50, keyboard: 90, controller: 120, sword: 180, book: 140 };
  const PET_COST = { dragon: 220, robot: 180, slime: 90, owl: 130, fox: 150 };
  const SCENE_COST = Object.fromEntries(Object.entries(SCENES).filter(([, s]) => !s.free).map(([k, s]) => [k, s.cost]));

  const CATALOG = { hair: HAIR_COST, outfit: OUTFIT_COST, accessory: ACCESSORY_COST, aura: AURA_COST, hat: HAT_COST, held: HELD_COST, pet: PET_COST, scene: SCENE_COST };
  const CATEGORIES = ['hair', 'outfit', 'accessory', 'aura', 'hat', 'held', 'pet', 'scene'];
  const AVATAR_CATALOGS = { hair: CVAvatar.HAIR_STYLES, outfit: CVAvatar.OUTFIT_STYLES, accessory: CVAvatar.ACCESSORY_STYLES, aura: CVAvatar.AURA_STYLES, hat: CVAvatar.HAT_STYLES, held: CVAvatar.HELD_ITEM_STYLES, pet: CVAvatar.PET_STYLES };

  function itemId(category, key) { return `${category}:${key}`; }

  function buildShopItems() {
    const items = [];
    CATEGORIES.forEach((category) => {
      const costs = CATALOG[category];
      Object.entries(costs).forEach(([key, cost]) => {
        const label = category === 'scene' ? SCENES[key].label : (AVATAR_CATALOGS[category][key] || {}).label || key;
        items.push({ id: itemId(category, key), category, key, label, cost });
      });
    });
    return items;
  }

  const defaultGameState = {
    coins: 0,
    xp: 0,
    level: 1,
    totalMinutesListened: 0,
    streakCount: 0,
    lastActiveDate: null,
    secondsAccum: 0,
    tracksAddedCount: 0,
    streamsLoadedCount: 0,
    shuffleUses: 0,
    avatarChangeCount: 0,
    itemsBoughtCount: 0,
    focusSessionsCompleted: 0,
    focusDurationMin: 25,
    themesTried: [],
    vizStylesTried: [],
    nightOwlHit: false,
    earlyBirdHit: false,
    achievementsUnlocked: [],
    ownedItems: [],
    avatar: {
      bodyType: 'slim', skinTone: CVAvatar.SKIN_TONES[0],
      hair: 'short', hairColor: CVAvatar.HAIR_COLORS[0],
      outfit: 'hoodie', outfitColor: CVAvatar.OUTFIT_COLORS[0],
      accessory: 'none', aura: 'none',
      hat: 'none', hatColor: CVAvatar.OUTFIT_COLORS[7], held: 'none'
    },
    pet: { species: 'cat', color: '#ffa94d' },
    scene: 'cozy_study',
    avatarWidgetVisible: true,
    avatarPos: null,
    dailyMinutes: {},
    dailyQuestDate: null,
    dailyProgress: {},
    dailyQuestsClaimed: [],
    weeklyQuestWeek: null,
    weeklyProgress: {},
    weeklyQuestsClaimed: []
  };

  let state = load();
  const listeners = [];
  const SHOP_ITEMS = buildShopItems();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultGameState));
      const parsed = JSON.parse(raw);
      return { ...JSON.parse(JSON.stringify(defaultGameState)), ...parsed, avatar: { ...defaultGameState.avatar, ...(parsed.avatar || {}) } };
    } catch {
      return JSON.parse(JSON.stringify(defaultGameState));
    }
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function notify() { listeners.forEach((fn) => fn(state)); }

  function xpForLevel(level) { return 100 + (level - 1) * 40; }

  function todayStr(d = new Date()) { return d.toISOString().slice(0, 10); }
  function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d); }

  function isoWeekStr(d = new Date()) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  // Resets daily/weekly quest progress the first time either period rolls
  // over. Called defensively at the top of anything that touches quest
  // progress, so it self-heals regardless of when the app was last open.
  function ensureQuestPeriods() {
    const today = todayStr();
    if (state.dailyQuestDate !== today) {
      state.dailyQuestDate = today;
      state.dailyProgress = {};
      state.dailyQuestsClaimed = [];
    }
    const week = isoWeekStr();
    if (state.weeklyQuestWeek !== week) {
      state.weeklyQuestWeek = week;
      state.weeklyProgress = {};
      state.weeklyQuestsClaimed = [];
    }
  }

  // ---------- Toasts ----------
  function ensureToastContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  function showToast({ icon, title, subtitle }) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text"><span class="toast-title"></span><span class="toast-sub"></span></span>`;
    toast.querySelector('.toast-title').textContent = title;
    toast.querySelector('.toast-sub').textContent = subtitle || '';
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3800);
  }

  // ---------- Achievements ----------
  function computeStats() {
    const categoriesOwned = new Set(state.ownedItems.map((id) => id.split(':')[0]));
    return {
      totalMinutes: state.totalMinutesListened,
      streak: state.streakCount,
      themesTriedCount: state.themesTried.length,
      vizTriedCount: state.vizStylesTried.length,
      shuffleUses: state.shuffleUses,
      tracksAddedCount: state.tracksAddedCount,
      streamsLoadedCount: state.streamsLoadedCount,
      avatarChangeCount: state.avatarChangeCount,
      itemsBoughtCount: state.itemsBoughtCount,
      level: state.level,
      nightOwlHit: state.nightOwlHit,
      earlyBirdHit: state.earlyBirdHit,
      focusSessions: state.focusSessionsCompleted,
      petsOwnedCount: 1 + state.ownedItems.filter((id) => id.startsWith('pet:')).length,
      allCategoriesOwned: CATEGORIES.every((c) => categoriesOwned.has(c))
    };
  }

  const ACHIEVEMENTS = [
    { id: 'first_vibe', icon: '🎵', name: 'First Vibe', desc: 'Play your first track or stream.', reward: 20, check: (s) => s.tracksAddedCount > 0 || s.totalMinutes > 0 },
    { id: 'dedicated_1h', icon: '⏱️', name: 'Getting Into It', desc: 'Log 1 hour of vibe time.', reward: 30, check: (s) => s.totalMinutes >= 60 },
    { id: 'dedicated_10h', icon: '🕐', name: 'Deep Focus', desc: 'Log 10 hours of vibe time.', reward: 100, check: (s) => s.totalMinutes >= 600 },
    { id: 'dedicated_100h', icon: '🏔️', name: 'Marathoner', desc: 'Log 100 hours of vibe time.', reward: 300, check: (s) => s.totalMinutes >= 6000 },
    { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Vibe between midnight and 4am.', reward: 25, check: (s) => s.nightOwlHit },
    { id: 'early_bird', icon: '🐦', name: 'Early Bird', desc: 'Vibe between 5am and 7am.', reward: 25, check: (s) => s.earlyBirdHit },
    { id: 'streak_3', icon: '🔥', name: 'On a Roll', desc: 'Reach a 3-day streak.', reward: 30, check: (s) => s.streak >= 3 },
    { id: 'streak_7', icon: '🔥', name: 'Week Strong', desc: 'Reach a 7-day streak.', reward: 75, check: (s) => s.streak >= 7 },
    { id: 'streak_30', icon: '🔥', name: 'Unstoppable', desc: 'Reach a 30-day streak.', reward: 250, check: (s) => s.streak >= 30 },
    { id: 'theme_explorer', icon: '🎨', name: 'Theme Explorer', desc: 'Try 8 different themes.', reward: 40, check: (s) => s.themesTriedCount >= 8 },
    { id: 'theme_completionist', icon: '🖌️', name: 'Full Palette', desc: 'Try all 16 themes.', reward: 100, check: (s) => s.themesTriedCount >= 16 },
    { id: 'viz_explorer', icon: '📊', name: 'Visualizer Tourist', desc: 'Try all 7 visualizer styles.', reward: 50, check: (s) => s.vizTriedCount >= 7 },
    { id: 'shuffle_fan', icon: '🔀', name: 'Shuffle Fan', desc: 'Use shuffle 25 times.', reward: 30, check: (s) => s.shuffleUses >= 25 },
    { id: 'curator', icon: '📚', name: 'Curator', desc: 'Add 20 tracks to your library.', reward: 40, check: (s) => s.tracksAddedCount >= 20 },
    { id: 'streamer', icon: '🌐', name: 'Streamer', desc: 'Load 10 streaming links.', reward: 30, check: (s) => s.streamsLoadedCount >= 10 },
    { id: 'stylist', icon: '💅', name: 'Stylist', desc: 'Change your avatar 10 times.', reward: 30, check: (s) => s.avatarChangeCount >= 10 },
    { id: 'big_spender', icon: '💰', name: 'Big Spender', desc: 'Buy 5 shop items.', reward: 40, check: (s) => s.itemsBoughtCount >= 5 },
    { id: 'trendsetter', icon: '✨', name: 'Trendsetter', desc: 'Own an item from every shop category.', reward: 100, check: (s) => s.allCategoriesOwned },
    { id: 'leveled_5', icon: '⭐', name: 'Rising Star', desc: 'Reach level 5.', reward: 20, check: (s) => s.level >= 5 },
    { id: 'leveled_10', icon: '🌟', name: 'Vibe Master', desc: 'Reach level 10.', reward: 50, check: (s) => s.level >= 10 },
    { id: 'focused_1', icon: '🎯', name: 'Focused', desc: 'Complete 1 focus session.', reward: 20, check: (s) => s.focusSessions >= 1 },
    { id: 'focused_20', icon: '🧠', name: 'Deep Work', desc: 'Complete 20 focus sessions.', reward: 80, check: (s) => s.focusSessions >= 20 },
    { id: 'focused_100', icon: '🏆', name: 'Pomodoro Pro', desc: 'Complete 100 focus sessions.', reward: 250, check: (s) => s.focusSessions >= 100 },
    { id: 'menagerie', icon: '🐾', name: 'Menagerie', desc: 'Unlock every pet.', reward: 100, check: (s) => s.petsOwnedCount >= 6 }
  ];

  function checkAchievements() {
    const stats = computeStats();
    let changed = false;
    ACHIEVEMENTS.forEach((a) => {
      if (state.achievementsUnlocked.includes(a.id)) return;
      if (a.check(stats)) {
        state.achievementsUnlocked.push(a.id);
        state.coins += a.reward;
        changed = true;
        showToast({ icon: a.icon, title: 'Achievement Unlocked!', subtitle: `${a.name} (+${a.reward} coins)` });
      }
    });
    if (changed) { save(); notify(); }
  }

  // ---------- Daily / weekly quests ----------
  const DAILY_QUESTS = [
    { id: 'd_warmup', icon: '🎧', name: 'Warm Up', desc: 'Vibe for 15 minutes today.', reward: 15, target: 15, progress: (p) => p.vibeMinutes || 0 },
    { id: 'd_focus', icon: '🎯', name: 'Session Complete', desc: 'Finish 1 focus session today.', reward: 25, target: 1, progress: (p) => p.focusSessions || 0 },
    { id: 'd_shuffle', icon: '🔀', name: 'Mix It Up', desc: 'Use shuffle at least once today.', reward: 10, target: 1, progress: (p) => p.shuffleUsed || 0 }
  ];
  const WEEKLY_QUESTS = [
    { id: 'w_marathon', icon: '⏳', name: 'Marathon Week', desc: 'Vibe for 3 hours this week.', reward: 80, target: 180, progress: (p) => p.vibeMinutes || 0 },
    { id: 'w_focus', icon: '🎯', name: 'Focused Week', desc: 'Complete 5 focus sessions this week.', reward: 100, target: 5, progress: (p) => p.focusSessions || 0 },
    { id: 'w_style', icon: '💅', name: 'Style Refresh', desc: 'Change your avatar 3 times this week.', reward: 40, target: 3, progress: (p) => p.avatarChanges || 0 }
  ];

  function checkQuests() {
    ensureQuestPeriods();
    let changed = false;
    DAILY_QUESTS.forEach((q) => {
      if (state.dailyQuestsClaimed.includes(q.id)) return;
      if (q.progress(state.dailyProgress) >= q.target) {
        state.dailyQuestsClaimed.push(q.id);
        state.coins += q.reward;
        changed = true;
        showToast({ icon: q.icon, title: 'Daily Quest Complete!', subtitle: `${q.name} (+${q.reward} coins)` });
      }
    });
    WEEKLY_QUESTS.forEach((q) => {
      if (state.weeklyQuestsClaimed.includes(q.id)) return;
      if (q.progress(state.weeklyProgress) >= q.target) {
        state.weeklyQuestsClaimed.push(q.id);
        state.coins += q.reward;
        changed = true;
        showToast({ icon: q.icon, title: 'Weekly Quest Complete!', subtitle: `${q.name} (+${q.reward} coins)` });
      }
    });
    if (changed) save();
  }

  function bumpAvatarChangeQuest() {
    ensureQuestPeriods();
    state.weeklyProgress.avatarChanges = (state.weeklyProgress.avatarChanges || 0) + 1;
  }

  // ---------- XP / leveling / time tracking ----------
  function grantRewards(coins, xp) {
    state.coins += coins;
    state.xp += xp;
    while (state.xp >= xpForLevel(state.level)) {
      state.xp -= xpForLevel(state.level);
      state.level += 1;
      const bonus = 25 + state.level * 5;
      state.coins += bonus;
      showToast({ icon: '⭐', title: `Level Up! Level ${state.level}`, subtitle: `+${bonus} bonus Vibe Coins` });
    }
  }

  function pruneDailyMinutes() {
    const keys = Object.keys(state.dailyMinutes).sort();
    while (keys.length > 60) delete state.dailyMinutes[keys.shift()];
  }

  function awardMinute() {
    state.totalMinutesListened += 1;
    grantRewards(COINS_PER_MINUTE, XP_PER_MINUTE);
    ensureQuestPeriods();
    state.dailyProgress.vibeMinutes = (state.dailyProgress.vibeMinutes || 0) + 1;
    state.weeklyProgress.vibeMinutes = (state.weeklyProgress.vibeMinutes || 0) + 1;
    const today = todayStr();
    state.dailyMinutes[today] = (state.dailyMinutes[today] || 0) + 1;
    pruneDailyMinutes();
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) state.nightOwlHit = true;
    if (hour >= 5 && hour < 7) state.earlyBirdHit = true;
    save();
    checkAchievements();
    checkQuests();
    notify();
  }

  function addVibeSeconds(seconds) {
    if (!seconds || seconds <= 0) return;
    state.secondsAccum += seconds;
    let awarded = false;
    while (state.secondsAccum >= 60) {
      state.secondsAccum -= 60;
      awardMinute();
      awarded = true;
    }
    if (awarded) save(); else { /* accumulator-only change; persist lazily on next full minute */ }
  }

  // ---------- Focus timer ----------
  function completeFocusSession() {
    state.focusSessionsCompleted += 1;
    grantRewards(50, 30);
    ensureQuestPeriods();
    state.dailyProgress.focusSessions = (state.dailyProgress.focusSessions || 0) + 1;
    state.weeklyProgress.focusSessions = (state.weeklyProgress.focusSessions || 0) + 1;
    showToast({ icon: '🎯', title: 'Focus Session Complete!', subtitle: '+50 Vibe Coins' });
    save();
    checkAchievements();
    checkQuests();
    notify();
  }

  function setFocusDuration(minutes) {
    state.focusDurationMin = minutes;
    save();
    notify();
  }

  function updateStreak() {
    const today = todayStr();
    if (state.lastActiveDate === today) return;
    state.streakCount = state.lastActiveDate === yesterdayStr() ? state.streakCount + 1 : 1;
    state.lastActiveDate = today;
    save();
    checkAchievements();
    notify();
  }

  // ---------- Events from app.js ----------
  function recordEvent(name) {
    ensureQuestPeriods();
    switch (name) {
      case 'trackAdded': state.tracksAddedCount += 1; break;
      case 'streamLoaded': state.streamsLoadedCount += 1; break;
      case 'shuffleUsed':
        state.shuffleUses += 1;
        state.dailyProgress.shuffleUsed = (state.dailyProgress.shuffleUsed || 0) + 1;
        break;
      default: return;
    }
    save();
    checkAchievements();
    checkQuests();
    notify();
  }

  function recordThemeTried(themeKey) {
    if (state.themesTried.includes(themeKey)) return;
    state.themesTried.push(themeKey);
    save();
    checkAchievements();
    notify();
  }

  function recordVizTried(vizKey) {
    if (state.vizStylesTried.includes(vizKey)) return;
    state.vizStylesTried.push(vizKey);
    save();
    checkAchievements();
    notify();
  }

  // ---------- Shop ----------
  function isOwned(category, key) {
    if (category === 'scene') { if (SCENES[key] && SCENES[key].free) return true; }
    else if (AVATAR_CATALOGS[category] && AVATAR_CATALOGS[category][key] && AVATAR_CATALOGS[category][key].free) return true;
    return state.ownedItems.includes(itemId(category, key));
  }

  function buyItem(category, key) {
    if (isOwned(category, key)) return { ok: true, already: true };
    const cost = (CATALOG[category] || {})[key];
    if (cost == null) return { ok: false, reason: 'invalid' };
    if (state.coins < cost) return { ok: false, reason: 'coins', missing: cost - state.coins };
    state.coins -= cost;
    state.ownedItems.push(itemId(category, key));
    state.itemsBoughtCount += 1;
    save();
    const item = SHOP_ITEMS.find((i) => i.id === itemId(category, key));
    showToast({ icon: '🛍️', title: 'Item Unlocked!', subtitle: item ? item.label : key });
    checkAchievements();
    notify();
    return { ok: true };
  }

  function equip(category, key) {
    if (!isOwned(category, key)) return false;
    if (category === 'scene') state.scene = key;
    else if (category === 'pet') {
      state.pet.species = key;
      state.avatarChangeCount += 1;
      bumpAvatarChangeQuest();
    } else {
      state.avatar[category] = key;
      state.avatarChangeCount += 1;
      bumpAvatarChangeQuest();
    }
    save();
    checkAchievements();
    checkQuests();
    notify();
    return true;
  }

  // For avatar/pet fields that are always free (body type, skin tone,
  // hair/outfit/hat color, pet color) — no ownership check, just set directly
  // and still count as styling.
  function setAvatarField(field, value) {
    state.avatar[field] = value;
    state.avatarChangeCount += 1;
    bumpAvatarChangeQuest();
    save();
    checkAchievements();
    checkQuests();
    notify();
  }

  function setPetField(field, value) {
    state.pet[field] = value;
    state.avatarChangeCount += 1;
    bumpAvatarChangeQuest();
    save();
    checkAchievements();
    checkQuests();
    notify();
  }

  function init() {
    updateStreak();
    ensureQuestPeriods();
    checkAchievements();
    checkQuests();
  }

  window.CVGame = {
    get state() { return state; },
    SCENES, SHOP_ITEMS, ACHIEVEMENTS, CATEGORIES, DAILY_QUESTS, WEEKLY_QUESTS,
    xpForLevel,
    init,
    addVibeSeconds,
    recordEvent,
    recordThemeTried,
    recordVizTried,
    isOwned,
    buyItem,
    equip,
    setAvatarField,
    setPetField,
    completeFocusSession,
    setFocusDuration,
    save,
    onChange: (fn) => listeners.push(fn),
    showToast
  };
})();
