const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const net = require('net');

// === Electron Window Setup ===
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "DataVault",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
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
const BASE_PATH = "C:\\Users\\alice\\Documents\\DT\\";
const AGENT_HOST = 'localhost';
const AGENT_PORT = 2512;
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
function sendToAgent(dataBuffer) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let received = Buffer.alloc(0);

    client.connect(AGENT_PORT, AGENT_HOST, () => {
      client.write(dataBuffer);
    });

    client.on('data', (chunk) => {
      received = Buffer.concat([received, chunk]);
    });

    client.on('end', () => resolve(received));
    client.on('error', reject);
  });
}

function serializeACL(aclList) {
  return aclList.map(user =>
    `${user.name};${user.access === 'read' ? '0' : '1'}`
  ).join('|');
}

function requireAuth(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ status: 'fail', error: 'Missing or invalid auth token' });
  }
  next();
}

// === Routes ===
server.post('/register', requireAuth, async (req, res) => {
  const newFile = req.body;
  const token = req.cookies.auth_token;
  const aclData = serializeACL(newFile.acl);
  const buffer = Buffer.concat([
    Buffer.from([AgentActionType.REGISTER_FILE]),
    Buffer.from(`${BASE_PATH}${newFile.name}$token=${token}$${aclData}$`)
  ]);

  try {
    await sendToAgent(buffer);
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ status: 'fail', error: 'Error during registration process.' });
  }
});

server.post('/login', async (req, res) => {

  res.cookie('auth_token', "123", {
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  });
  res.json({ status: 'success', message: 'Login successful' });

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'fail', error: 'Missing credentials' });
  }

  const loginBuffer = Buffer.concat([
    Buffer.from([AgentActionType.LOGIN]),
    Buffer.from(`${username}|${password}`)
  ]);

  try {
    const response = await sendToAgent(loginBuffer);
    if (response[0] === 1) {
      const token = response.slice(1).toString();
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      });
      res.json({ status: 'success', message: 'Login successful' });
    } else {
      res.status(401).json({ status: 'fail', error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ status: 'fail', error: 'Error during login process.' });
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