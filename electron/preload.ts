import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
  closeApp: () => ipcRenderer.invoke('close-app'),
});
