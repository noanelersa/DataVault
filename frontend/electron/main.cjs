const { app, BrowserWindow, ipcMain, dialog} = require("electron");
const path = require("path");
const net = require("net");


function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:80");
}

app.whenReady().then(createWindow);

async function chooseFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Choose a file to upload",
    properties: ["openFile"],
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  return filePaths[0];
}

ipcMain.handle("agent-command", async (command, args) => {
  console.log(`Received command from frontend: ${command}`);

  if (command === "upload" && args) {
    const { path, sharedWith } = args;
    console.log("Received args:", args);

    try {
      const client = new net.Socket();
      let registerData = "";

      for (const user of sharedWith) {
        const permissionByte = user.permission === "read" ? "\x00" : "\x01";
        registerData += `${user.name};${permissionByte}|`;
      }

      if (registerData.endsWith("|")) {
        registerData = registerData.slice(0, -1);
      }

      const commandByte = Buffer.from([0x01]);
      const pathBuffer = Buffer.from(path, "utf-8");
      const registerBuffer = Buffer.from(registerData, "utf-8");
      const endMarker = Buffer.from("$", "utf-8");
      const separator = Buffer.from("$", "utf-8");

      const fullData = Buffer.concat([
        commandByte,
        pathBuffer,
        separator,
        registerBuffer,
        endMarker,
      ]);

      console.log(
        "Register data being sent to agent:",
        fullData.toString("utf-8")
      );

      return new Promise((resolve, reject) => {
        client.connect(2512, "127.0.0.1", () => {
          client.write(fullData);
        });

        client.on("data", (data) => {
          console.log("Agent succeeded:", data);
          resolve({ status: "success", response: data.toString() });
          client.destroy();
        });

        client.on("error", (err) => {
          console.error("Socket error:", err);
          resolve({ status: "error", message: err.message });
        });
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      return { status: "error", message: "Unexpected error" };
    }
  }

  if (command === "update-permissions" && args) {
    const { name, acl } = args;

    let registerData = "";
    for (const user of acl) {
      const permissionByte =
        user.permission === "read"
          ? "\x00"
          : user.permission === "write"
          ? "\x01"
          : "\x02";
      registerData += `${user.user};${permissionByte}|`;
    }
    registerData = registerData.slice(0, -1);
    registerData = `\x02C:\\Users\\Rick\\Documents\\DT\\${name}$${registerData}$`;

    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.connect(2512, "127.0.0.1", () => {
        client.write(Buffer.from(registerData, "binary"));
      });

      client.on("data", (data) => {
        console.log("Permissions updated:", data);
        resolve({ status: "success", response: data.toString() });
        client.destroy();
      });

      client.on("error", (err) => {
        console.error("Socket error:", err);
        resolve({ status: "error", message: err.message });
      });
    });
  }

  if (command === "delete" && args?.name) {
    console.info("delete button through electron");

    const deleteData = `\x03C:\\Users\\Rick\\Documents\\DT\\${args.name}$`;

    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.connect(2512, "127.0.0.1", () => {
        client.write(Buffer.from(deleteData, "binary"));
      });

      client.on("data", (data) => {
        console.log("File deleted:", data);
        resolve({ status: "success", response: data.toString() });
        client.destroy();
      });

      client.on("error", (err) => {
        console.error("Socket error:", err);
        resolve({ status: "error", message: err.message });
      });
    });
  }

  return { status: "error", message: "Unknown command" };
});

ipcMain.handle("choose-file", async () => {
  const path = await chooseFile();
  return path;
});
