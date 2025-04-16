const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);

// MOCK HANDLER
ipcMain.handle('agent-command', async (event, command, args) => {
  console.log(`[Electron Main] Received command from frontend: ${command}`);
  console.log(`[Electron Main] Args:`, args);

  if (command === 'notify') {
    return { status: 'mock-success', message: 'Agent mock notified.' };
  } else if (command === 'upload') {
    return { status: 'mock-success', message: 'File upload mock sent.' };
  }

  return { status: 'error', message: 'Unknown command (mock)' };
});
