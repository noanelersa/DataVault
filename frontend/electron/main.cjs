const { app, BrowserWindow } = require('electron');
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const net = require('net');
const Config = require("./config.cjs");

// === Electron Window Setup ===
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "DataVault",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.setMenu(null);
  win.webContents.on('did-finish-load', () => {
    win.setTitle('DataVault'); // or whatever title you want
  });
  win.loadURL('http://localhost'); // adjust if needed
}

// === Backend Setup ===
const server = express();
const HTTP_PORT = 2513;

server.use(bodyParser.json());
server.use(cookieParser());
server.use(cors({ origin: true, credentials: true }));

const AgentActionType = {
  REGISTER_FILE: 1,
  UPDATE_PERMISSIONS: 2,
  DELETE_FILE: 3,
  LOGIN: 4,
};

// === Helper functions ===
function sendToAgent(message) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let responseReceivedAndProcessed = false;
    let receivedDataBuffer = Buffer.alloc(0);

    const responseTimeout = setTimeout(() => {
      if (!responseReceivedAndProcessed) {
        console.error(
          `Agent response timeout. Destroying socket.`
        );
        client.destroy();
        reject({
          status: "error",
          message: `Agent response timed out.`,
        });
      }
    }, 5000);

    client.connect(Config.agentPort, Config.agentHost, () => {
      client.write(message);
    });

    client.on("data", (data) => {
      receivedDataBuffer = Buffer.concat([receivedDataBuffer, data]);

      if (receivedDataBuffer.length >= 1) {
        clearTimeout(responseTimeout);
        if (!responseReceivedAndProcessed) {
          responseReceivedAndProcessed = true;

          const responseByte = receivedDataBuffer.readUInt8(0);

          if (responseByte === 0x01) {
            console.log(
              `Agent responded with success (0x01)'.`
            );
            client.end();
            resolve({ status: "success", message: "OK" });
          } else {
            console.warn(
              `Agent responded with failure (0x${responseByte.toString(
                16
              )}).`
            );
            client.end();
            resolve({
              status: "error",
              message: `Agent indicated failure: 0x${responseByte.toString(
                16
              )}`,
            });
          }
        }
      }
    });

    client.on("error", (err) => {
      clearTimeout(responseTimeout);
      if (!responseReceivedAndProcessed) {
        responseReceivedAndProcessed = true;
        console.error(`Socket error:`, err);
        client.destroy();
        reject({ status: "error", message: err.message });
      }
    });

    client.on("end", () => {
      if (!responseReceivedAndProcessed) {
        responseReceivedAndProcessed = true;
        client.destroy();
        reject({
          status: "error",
          message: `Agent closed connection unexpectedly early'.`,
        });
      }
    });

    client.on("close", (hadError) => {
      console.log(
        `Socket connection closed. hadError:`,
        hadError
      );
    });
  });
}

function serializeACL(aclList) {
  return aclList.map(user =>
    `${user.name};${user.access === 'read' ? '0' : '1'}`
  ).join('|');
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ status: 'fail', error: 'Missing or invalid auth token' });
  }
  next();
}

// === Routes ===
server.post('/register', requireAuth, async (req, res) => {
  const newFile = req.body;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const aclData = serializeACL(newFile.acl);
  const buffer = Buffer.concat([
    Buffer.from([AgentActionType.REGISTER_FILE]),
    Buffer.from(`${newFile.fullPath.replace(/\\/g, '\\\\')}$token=${token}$${aclData}$`)
  ]);

  try {
    await sendToAgent(buffer);
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ status: 'fail', error: 'Error during registration process.' });
  }
});

// === IPC Handlers ===
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]; // return full file path
  }
  return null;
});

ipcMain.handle('file:getMeta', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      size: stats.size,
      lastModified: stats.mtimeMs,
      path: filePath,
    };
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    return null;
  }
});

// === Start Servers ===
app.whenReady().then(() => {
  createWindow();
  server.listen(HTTP_PORT, () => {
    console.log(`Backend running on http://localhost:${HTTP_PORT}`);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});