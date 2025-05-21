const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

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

ipcMain.handle('agent-command', async (event, command, args) => {
    console.log(`Received command from frontend: ${command}`);

    if (command === 'upload' && args) {
      const { name, description, acl, content } = args; 
  
      try {
        const newFile = { name, description, acl, content };
  
        const client = new net.Socket();
        let registerData = "";
  
        for (const user of acl) {
          const permissionByte = user.permission === "read" ? "\x00" : user.permission === "write" ? "\x01" : "\x02";
          registerData += `${user.user};${permissionByte}|`;
        }
  
        registerData = registerData.slice(0, -1);
        registerData = `\x01C:\\Users\\Rick\\Documents\\DT\\${name}$${registerData}$`;
  
        return new Promise((resolve, reject) => {
          client.connect(2512, "192.168.71.128", () => {
            client.write(Buffer.from(registerData, "binary"));
          });
  
          client.on("data", (data) => {
            console.log("Agent succeeded:", data);
            resolve({ status: "success", response: data.toString() });
            client.destroy();
          });
  
          client.on("error", (err) => {
            console.error("Socket error:", err);
            reject({ status: "error", message: err.message });
          });
        });
  
      } catch (err) {
        console.error("Unexpected error:", err);
        return { status: "error", message: "Unexpected error" };
      }
    }
  
    return { status: 'error', message: 'Unknown command' };
  });
