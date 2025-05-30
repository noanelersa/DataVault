const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("agentAPI", {
  sendCommand: (command, args) =>
    ipcRenderer.invoke("agent-command", command, args),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

});
