const { app, BrowserWindow, ipcMain, dialog, Menu, shell, safeStorage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Streaming embeds (YouTube/Spotify/SoundCloud) run inside a <webview> guest page;
// autoplay there needs this switch set before the app is ready.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0e14',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  Menu.setApplicationMenu(null);

  // Deny any attempt (from the main page or an embedded <webview> guest) to spawn
  // a new native window — e.g. an ad popup inside a YouTube/Spotify embed.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // The app never legitimately navigates its main window away from its own local
  // page; refuse anything else as defense in depth.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });

  // Deny every permission request (camera, mic, geolocation, notifications, etc.)
  // by default — the app doesn't need any of them, and the streaming <webview>
  // embeds untrusted third-party pages. Fullscreen is the one exception: YouTube's
  // embed uses it for its own fullscreen button.
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'fullscreen');
  });

  // Hardening for the streaming <webview> (Electron security checklist #12): even
  // though the tag in index.html never sets nodeintegration/preload attributes,
  // strip/force them server-side too so a future bug (or injected content) can't
  // attach a webview with elevated privileges.
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences) => {
    delete webPreferences.preload;
    delete webPreferences.preloadURL;
    webPreferences.nodeIntegration = false;
    webPreferences.nodeIntegrationInSubFrames = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
  });

  // Belt-and-suspenders: the <webview> guest (YouTube/Spotify/SoundCloud embeds)
  // has its own separate WebContents, so deny popups there too even though the
  // `allowpopups` attribute is already off in the HTML.
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

    // The host sets the guest's initial src itself, which doesn't fire
    // will-navigate — so this only fires for a *guest-initiated* top-level
    // navigation (e.g. a malicious ad redirecting the whole embed away from
    // the player), and blocks it unless it's plain http(s).
    webContents.on('will-navigate', (navEvent, url) => {
      if (!/^https?:\/\//i.test(url)) navEvent.preventDefault();
    });
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function sendUpdateStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', payload);
  }
}

function setupAutoUpdates() {
  if (!app.isPackaged) return; // dev runs have no packaged update feed to check

  autoUpdater.autoDownload = false;

  autoUpdater.on('checking-for-update', () => sendUpdateStatus({ state: 'checking' }));
  autoUpdater.on('update-available', (info) => sendUpdateStatus({ state: 'available', version: info.version }));
  autoUpdater.on('update-not-available', () => sendUpdateStatus({ state: 'up-to-date' }));
  autoUpdater.on('error', (err) => sendUpdateStatus({ state: 'error', message: err.message }));
  autoUpdater.on('download-progress', (p) => sendUpdateStatus({ state: 'downloading', percent: p.percent }));
  autoUpdater.on('update-downloaded', (info) => sendUpdateStatus({ state: 'downloaded', version: info.version }));

  autoUpdater.checkForUpdates().catch((err) => sendUpdateStatus({ state: 'error', message: err.message }));
}

ipcMain.handle('get-app-version', () => app.getVersion());

// Converts an absolute filesystem path to a properly percent-encoded file://
// URL (handles filenames with #, %, spaces, etc. that would otherwise break
// or truncate when a raw path is concatenated onto "file://" in the renderer).
ipcMain.handle('to-file-url', (event, filePath) => {
  if (typeof filePath !== 'string' || !filePath) return null;
  try {
    return pathToFileURL(filePath).href;
  } catch {
    return null;
  }
});

ipcMain.handle('open-external', (event, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) {
    shell.openExternal(url);
  }
});

// Encrypted-at-rest storage for credentials (Jellyfin/Plex tokens) via
// Electron's safeStorage (OS keychain/DPAPI/libsecret), instead of the plain
// localStorage blob the rest of the app's settings live in.
const SECURE_STORE_PATH = path.join(app.getPath('userData'), 'secure-store.json');

function readSecureStoreFile() {
  try {
    return JSON.parse(fs.readFileSync(SECURE_STORE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeSecureStoreFile(store) {
  fs.writeFileSync(SECURE_STORE_PATH, JSON.stringify(store), { mode: 0o600 });
}

ipcMain.handle('secure-set', (event, key, value) => {
  if (typeof key !== 'string' || typeof value !== 'string') return;
  const store = readSecureStoreFile();
  store[key] = safeStorage.isEncryptionAvailable()
    ? { enc: true, data: safeStorage.encryptString(value).toString('base64') }
    : { enc: false, data: value };
  writeSecureStoreFile(store);
});

ipcMain.handle('secure-get', (event, key) => {
  if (typeof key !== 'string') return null;
  const entry = readSecureStoreFile()[key];
  if (!entry) return null;
  if (!entry.enc) return entry.data;
  try {
    return safeStorage.decryptString(Buffer.from(entry.data, 'base64'));
  } catch {
    return null;
  }
});

ipcMain.handle('secure-delete', (event, key) => {
  if (typeof key !== 'string') return;
  const store = readSecureStoreFile();
  delete store[key];
  writeSecureStoreFile(store);
});

ipcMain.handle('check-for-updates', () => {
  if (!app.isPackaged) {
    const status = { state: 'up-to-date' };
    sendUpdateStatus(status);
    return status;
  }
  // autoUpdater fires its own 'checking-for-update' event, so no need to send one here.
  return autoUpdater.checkForUpdates().catch((err) => sendUpdateStatus({ state: 'error', message: err.message }));
});

ipcMain.handle('download-update', () => {
  return autoUpdater.downloadUpdate().catch((err) => sendUpdateStatus({ state: 'error', message: err.message }));
});

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.opus'];

ipcMain.handle('pick-audio-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose local music',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: AUDIO_EXTENSIONS.map((e) => e.slice(1)) }]
  });
  if (result.canceled) return [];
  return result.filePaths.map((p) => ({ path: p, name: path.basename(p) }));
});

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

ipcMain.handle('pick-wallpaper-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose a wallpaper image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: IMAGE_EXTENSIONS }]
  });
  if (result.canceled || !result.filePaths.length) return null;
  return { path: result.filePaths[0], name: path.basename(result.filePaths[0]) };
});

ipcMain.handle('pick-audio-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose a music folder',
    properties: ['openDirectory']
  });
  if (result.canceled) return [];
  const dir = result.filePaths[0];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && AUDIO_EXTENSIONS.includes(path.extname(e.name).toLowerCase()))
    .map((e) => ({ path: path.join(dir, e.name), name: e.name }));
});
