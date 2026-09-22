const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codevibe', {
  pickAudioFiles: () => ipcRenderer.invoke('pick-audio-files'),
  pickAudioFolder: () => ipcRenderer.invoke('pick-audio-folder'),
  platform: process.platform
});
