const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

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

ipcMain.handle('open-external', (event, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) {
    shell.openExternal(url);
  }
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
