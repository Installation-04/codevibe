const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codevibe', {
  pickAudioFiles: () => ipcRenderer.invoke('pick-audio-files'),
  pickAudioFolder: () => ipcRenderer.invoke('pick-audio-folder'),
  pickWallpaperImage: () => ipcRenderer.invoke('pick-wallpaper-image'),
  platform: process.platform
});
