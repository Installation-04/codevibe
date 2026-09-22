// Headless UI regression suite for the renderer.
//
// This can't drive the real Electron shell (no <webview> support, no IPC
// bridge, no real network) — it loads the renderer HTML directly in plain
// Chromium, mocks the `window.codevibe` preload bridge, and mocks the
// Jellyfin/Plex HTTP APIs via request interception. That's enough to catch
// the two classes of bug this project has actually shipped: a JS error that
// silently breaks post-load UI wiring (the Matrix Rain TDZ crash), and a
// broken connect/browse/play flow for a specific feature.
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

const INDEX_URL = 'file://' + path.join(__dirname, '..', 'src', 'renderer', 'index.html');

async function mockBridge(context) {
  await context.addInitScript(() => {
    window.codevibe = {
      pickAudioFiles: async () => [],
      pickAudioFolder: async () => [],
      pickWallpaperImage: async () => null,
      openExternal: async () => {},
      platform: 'linux',
      getAppVersion: async () => '0.0.0-test',
      checkForUpdates: async () => ({ state: 'up-to-date' }),
      downloadUpdate: async () => {},
      quitAndInstall: async () => {},
      onUpdateStatus: () => () => {},
      secureSet: async () => {},
      secureGet: async () => null,
      secureDelete: async () => {}
    };
  });
}

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('console.error: ' + msg.text());
  });
  return errors;
}

async function testStructureAndControls(browser) {
  const context = await browser.newContext();
  await mockBridge(context);
  const page = await context.newPage();
  const errors = trackErrors(page);

  await page.goto(INDEX_URL);
  await page.waitForTimeout(300);
  await page.click('.tab-btn[data-tab="theme"]');
  await page.waitForTimeout(200);

  const counts = await page.evaluate(() => ({
    presets: document.getElementById('preset-grid').children.length,
    swatches: document.getElementById('accent-swatch-row').children.length,
    vizChips: document.querySelectorAll('#viz-style-row .chip').length,
    patternChips: document.querySelectorAll('#bg-pattern-row .chip').length,
    clockStyleChips: document.querySelectorAll('#clock-style-row .chip').length,
    clockFontChips: document.querySelectorAll('#clock-font-row .chip').length
  }));

  assert.equal(counts.presets, 14, 'theme preset grid should render 14 cards');
  assert.equal(counts.swatches, 12, 'accent swatch row should render 12 swatches');
  assert.equal(counts.vizChips, 6, 'visualizer style row should render 6 chips');
  assert.equal(counts.patternChips, 4, 'background pattern row should render 4 chips');
  assert.equal(counts.clockStyleChips, 5, 'clock style row should render 5 chips');
  assert.equal(counts.clockFontChips, 5, 'clock font row should render 5 chips');

  // Exercise every chip/slider once — this is exactly the class of change that
  // previously broke silently (a TDZ error partway through app.js aborted the
  // whole script, leaving these controls unwired with no visible symptom).
  const clicks = [
    '#bg-pattern-row .chip[data-pattern="grid"]',
    '#bg-pattern-row .chip[data-pattern="noise"]',
    '#bg-pattern-row .chip[data-pattern="vignette"]',
    '#bg-pattern-row .chip[data-pattern="gradient"]',
    '#clock-style-row .chip[data-clockstyle="analog"]',
    '#clock-style-row .chip[data-clockstyle="neon"]',
    '#clock-style-row .chip[data-clockstyle="boxed"]',
    '#clock-style-row .chip[data-clockstyle="minimal"]',
    '#clock-style-row .chip[data-clockstyle="digital"]',
    '#clock-font-row .chip[data-clockfont="mono"]',
    '#viz-style-row .chip[data-style="radial"]',
    '#viz-style-row .chip[data-style="kaleidoscope"]',
    '#viz-style-row .chip[data-style="matrix"]',
    '#viz-style-row .chip[data-style="bars"]',
    '#bg-mode-row .chip[data-bgmode="wallpaper"]',
    '#bg-mode-row .chip[data-bgmode="dynamic"]'
  ];
  for (const selector of clicks) {
    await page.click(selector);
  }
  await page.fill('#panel-blur', '5');
  await page.dispatchEvent('#panel-blur', 'input');
  await page.fill('#panel-opacity', '80');
  await page.dispatchEvent('#panel-opacity', 'input');
  await page.fill('#clock-size', '140');
  await page.dispatchEvent('#clock-size', 'input');

  const swatch = await page.$('#accent-swatch-row .swatch');
  assert.ok(swatch, 'expected at least one accent swatch to click');
  await swatch.click();

  await page.click('.tab-btn[data-tab="stream"]');
  await page.fill('#stream-url', 'not a url at all');
  page.once('dialog', (d) => d.dismiss());
  await page.click('#stream-load-btn');
  await page.waitForTimeout(100);

  await page.click('.tab-btn[data-tab="library"]');
  await page.click('.tab-btn[data-tab="jellyfin"]');
  await page.click('.tab-btn[data-tab="plex"]');

  await page.waitForTimeout(200);
  await context.close();

  assert.deepEqual(errors, [], 'expected zero console errors while exercising theme/clock/visualizer controls');
}

async function testJellyfinFlow(browser) {
  const context = await browser.newContext();
  await mockBridge(context);
  const page = await context.newPage();
  const errors = trackErrors(page);

  await page.route('http://fake-jellyfin:8096/Users/AuthenticateByName', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ AccessToken: 'jf-token', User: { Id: 'uid1', Name: 'Alice' } })
    });
  });
  await page.route(/fake-jellyfin:8096\/Users\/uid1\/Items.*/, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ Items: [{ Id: 'trk1', Name: 'Song A', AlbumArtist: 'Band X' }] })
    });
  });
  // The audio element itself fetches the direct-play URL; mock it too so the
  // (nonexistent) fake hostname doesn't produce a real network error.
  await page.route(/fake-jellyfin:8096\/Audio\/.*\/stream.*/, (route) => {
    route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) });
  });

  await page.goto(INDEX_URL);
  await page.click('.tab-btn[data-tab="jellyfin"]');
  await page.fill('#jellyfin-server', 'http://fake-jellyfin:8096');
  await page.fill('#jellyfin-username', 'alice');
  await page.fill('#jellyfin-password', 'secret');
  await page.click('#jellyfin-connect-btn');
  await page.waitForTimeout(400);

  const connected = await page.evaluate(() => ({
    connectedHidden: document.getElementById('jellyfin-connected').classList.contains('hidden'),
    userLabel: document.getElementById('jellyfin-user-label').textContent,
    trackCount: document.querySelectorAll('#jellyfin-track-list .track-item').length
  }));
  assert.equal(connected.connectedHidden, false, 'Jellyfin connected panel should be visible after a successful login');
  assert.equal(connected.userLabel, 'Alice', 'Jellyfin should show the authenticated username');
  assert.equal(connected.trackCount, 1, 'Jellyfin track list should render the mocked library item');

  await page.click('#jellyfin-track-list .track-item');
  await page.waitForTimeout(200);
  const audioSrc = await page.evaluate(() => document.getElementById('audio-el').src);
  assert.equal(
    audioSrc,
    'http://fake-jellyfin:8096/Audio/trk1/stream?static=true&api_key=jf-token',
    'clicking a Jellyfin track should point the audio element at the correct direct-play URL'
  );

  await context.close();
  assert.deepEqual(errors, [], 'expected zero console errors during the Jellyfin connect/browse/play flow');
}

async function testPlexFlow(browser) {
  const context = await browser.newContext();
  await mockBridge(context);
  const page = await context.newPage();
  const errors = trackErrors(page);

  await page.route('https://plex.tv/api/v2/pins?strong=true', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 555, code: 'ABCD' }) });
  });
  await page.route('https://plex.tv/api/v2/pins/555', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authToken: 'plex-token-xyz' }) });
  });
  await page.route('http://fake-plex:32400/library/sections', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ MediaContainer: { Directory: [{ type: 'artist', key: '1' }] } })
    });
  });
  await page.route('http://fake-plex:32400/library/sections/1/all?type=10', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        MediaContainer: {
          Metadata: [{ title: 'Track B', grandparentTitle: 'Artist Y', Media: [{ Part: [{ key: '/library/parts/9/file.mp3' }] }] }]
        }
      })
    });
  });
  await page.route(/fake-plex:32400\/library\/parts\/.*/, (route) => {
    route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) });
  });

  await page.goto(INDEX_URL);
  await page.click('.tab-btn[data-tab="plex"]');
  await page.click('#plex-login-btn');
  await page.waitForTimeout(2500);

  // The server-address form only appears once the PIN poll resolves a token,
  // so this also confirms the mocked sign-in flow completed successfully.
  const afterLogin = await page.evaluate(() => document.getElementById('plex-server-form').classList.contains('hidden'));
  assert.equal(afterLogin, false, 'Plex server-address form should appear once sign-in completes');

  await page.fill('#plex-server', 'http://fake-plex:32400');
  await page.click('#plex-server-btn');
  await page.waitForTimeout(400);

  const connected = await page.evaluate(() => ({
    connectedHidden: document.getElementById('plex-connected').classList.contains('hidden'),
    label: document.getElementById('plex-server-label').textContent,
    trackCount: document.querySelectorAll('#plex-track-list .track-item').length
  }));
  assert.equal(connected.connectedHidden, false, 'Plex connected panel should be visible after connecting to a server');
  assert.equal(connected.label, 'http://fake-plex:32400', 'Plex should display the connected server address');
  assert.equal(connected.trackCount, 1, 'Plex track list should render the mocked library track');

  await page.click('#plex-track-list .track-item');
  await page.waitForTimeout(200);
  const audioSrc = await page.evaluate(() => document.getElementById('audio-el').src);
  assert.equal(
    audioSrc,
    'http://fake-plex:32400/library/parts/9/file.mp3?X-Plex-Token=plex-token-xyz',
    'clicking a Plex track should point the audio element at the correct direct-play URL'
  );

  await context.close();
  assert.deepEqual(errors, [], 'expected zero console errors during the Plex connect/browse/play flow');
}

async function run() {
  const launchOptions = {};
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }
  const browser = await chromium.launch(launchOptions);
  const tests = [
    ['structure & controls', testStructureAndControls],
    ['Jellyfin connect/browse/play', testJellyfinFlow],
    ['Plex connect/browse/play', testPlexFlow]
  ];

  let failed = false;
  for (const [name, fn] of tests) {
    try {
      await fn(browser);
      console.log(`ok - ${name}`);
    } catch (err) {
      failed = true;
      console.error(`FAIL - ${name}`);
      console.error(err.message);
    }
  }

  await browser.close();
  if (failed) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('smoke test runner crashed:', err);
  process.exitCode = 1;
});
