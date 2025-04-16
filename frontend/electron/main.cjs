const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Load your React app (served in dev or from build)
  const reactDevUrl = 'http://localhost:5173';
  win.loadURL(reactDevUrl);

  // IPC listener for agent communication (mock for now)
  ipcMain.handle('agent-command', async (_event, command) => {
    console.log('[Electron Main] Received command from frontend:', command);

    // Mocker for now: just simulate a reply
    if (command === 'notify') {
      return { status: 'success', message: 'Agent mock notified!' };
    }

    return { status: 'error', message: 'Unknown command' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
