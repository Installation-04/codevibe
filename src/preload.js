const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codevibe', {
  pickAudioFiles: () => ipcRenderer.invoke('pick-audio-files'),
  pickAudioFolder: () => ipcRenderer.invoke('pick-audio-folder'),
  pickWallpaperImage: () => ipcRenderer.invoke('pick-wallpaper-image'),
  platform: process.platform,

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
