const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("agentAPI", {
  invoke: (channel, ...args) => {
    const allowedChannels = ["choose-file"];
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    console.error(
      `SECURITY WARNING: Blocked an attempt to invoke a non-whitelisted channel: '${channel}'`
    );
  },
});
