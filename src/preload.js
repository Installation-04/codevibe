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
  }
});
