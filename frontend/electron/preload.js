const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFileMeta: (filePath) => ipcRenderer.invoke('file:getMeta', filePath),
});