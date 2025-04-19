const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agentAPI', {
  sendCommand: (command, args) => ipcRenderer.invoke('agent-command', command, args),
});