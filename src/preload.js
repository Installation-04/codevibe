const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('codevibe', {
  pickAudioFiles: () => ipcRenderer.invoke('pick-audio-files'),
  pickAudioFolder: () => ipcRenderer.invoke('pick-audio-folder'),
  pickWallpaperImage: () => ipcRenderer.invoke('pick-wallpaper-image'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  toFileUrl: (filePath) => ipcRenderer.invoke('to-file-url', filePath),
  // Resolves the absolute path of a File dropped onto the window (drag & drop).
  // File.path was removed from the renderer in newer Electron versions for
  // context-isolation reasons; webUtils.getPathForFile is the replacement.
  getPathForFile: (file) => webUtils.getPathForFile(file),
  platform: process.platform,

  secureSet: (key, value) => ipcRenderer.invoke('secure-set', key, value),
  secureGet: (key) => ipcRenderer.invoke('secure-get', key),
  secureDelete: (key) => ipcRenderer.invoke('secure-delete', key),

  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },

  setGlobalHotkeys: (enabled) => ipcRenderer.invoke('set-global-hotkeys', enabled),
  onHotkey: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on('hotkey', listener);
    return () => ipcRenderer.removeListener('hotkey', listener);
  },

  toggleMiniWidget: () => ipcRenderer.invoke('toggle-mini-widget'),
  onMiniWidgetState: (callback) => {
    const listener = (_event, open) => callback(open);
    ipcRenderer.on('mini-widget-state', listener);
    return () => ipcRenderer.removeListener('mini-widget-state', listener);
  },
  sendWidgetState: (payload) => ipcRenderer.send('widget-state-update', payload),
  onWidgetStateUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('widget-state-update', listener);
    return () => ipcRenderer.removeListener('widget-state-update', listener);
  },
  sendWidgetAction: (action) => ipcRenderer.send('widget-action', action)
});
