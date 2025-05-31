const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const net = require("net");
const { dialog } = require("electron");

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
BASE_PATH = "C:\\\\Users\\\\cs416\\\\Documents\\\\DataVault\\\\";

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

function serializeACL(aclList) {
  console.log(aclList);
  return aclList
    .map((user) => `${user.name};${user.access === "read" ? "\x00" : "\x01"}`)
    .join("|");
}

ipcMain.handle("agent-command", async (event, command, args) => {
  console.log(`Received command from frontend: ${command}`);

  if (command === "upload" && args) {
    const { name, sharedWith } = args;
    // console.log(path)
    console.log("Received args:", args);

    try {
      const client = new net.Socket();
      let registerData = "";
      registerData = serializeACL(sharedWith);
      console.log(registerData);

      if (registerData.endsWith("|")) {
        registerData = registerData.slice(0, -1);
      }
      const commandByte = Buffer.from([0x01]); 
      const filePath = Buffer.from(`${BASE_PATH}${name}`, "utf-8");
      const acl = Buffer.from(registerData, "utf-8");
      const separator = Buffer.from("$", "utf-8");

      const message = Buffer.concat([
        commandByte,
        filePath,
        separator,
        acl,
        separator,
      ]);

      console.log(
        "Register data being sent to agent:",
        message.toString("utf-8")
      );

      // const commandByte = Buffer.from([0x01]);
      // const pathBuffer = Buffer.from(path, "utf-8");
      // const registerBuffer = Buffer.from(registerData, "utf-8");
      // const endMarker = Buffer.from("$", "utf-8");
      // const separator = Buffer.from("$", "utf-8");

      // const fullData = Buffer.concat([
      //   commandByte,
      //   pathBuffer,
      //   separator,
      //   registerBuffer,
      //   endMarker,
      // ]);

      // console.log(
      //   "Register data being sent to agent:",
      //   fullData.toString("utf-8")
      // );

      return new Promise((resolve, reject) => {
        client.connect(2512, "127.0.0.1", () => {
          client.write(message);
        });

        client.on("data", (data) => {
          const printable = Array.from(data)
            .map((byte) =>
              byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."
            )
            .join("");
          console.log("Printable:", printable);
          client.end();
          resolve({ status: "success", response: data.toString() });
        });

        client.on("error", (err) => {
          console.error("Socket error:", err);
          client.end();
          resolve({ status: "error", message: err.message });

        client.on('close', () => {
          console.log('Socket connection closed.');
        });
        });

      });
    } catch (err) {
      console.error("Unexpected error:", err);
      return { status: "error", message: "Unexpected error" };
    }
  }

  if (command === "update-permissions" && args) {
    const { name, sharedWith } = args;
    let registerData = "";
    try {
      registerData = serializeACL(sharedWith);

      const commandByte = Buffer.from([0x02]);
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
        const client = new net.Socket();
        client.connect(2512, "127.0.0.1", () => {
          client.write(fullData);
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
    } catch (err) {
      console.error("Unexpected error:", err);
      return { status: "error", message: "Unexpected error" };
    }
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
  console.log(path)
  return path;
});
