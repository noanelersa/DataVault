const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agentAPI', {
  sendCommand: async (command) => {
    const response = await ipcRenderer.invoke('agent-command', command);
    return response;
  },
});
