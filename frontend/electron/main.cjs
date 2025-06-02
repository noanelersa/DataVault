const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const net = require("net");
const { dialog } = require("electron");
const fs = require("fs").promises;
const mime = require("mime-types");

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

const AgentActionType = {
  UPLOAD_FILE: 0x01,
  UPDATE_PERMISSIONS: 0x02,
  DELETE_FILE: 0x03,
};

async function chooseFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Choose a file to upload",
    properties: ["openFile"],
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }
  const filePath = filePaths[0];

  try {
    const stats = await fs.stat(filePath);
    const fileSize = (stats.size / (1024 * 1024)).toFixed(1);

    const fileType = mime.lookup(filePath) || "application/octet-stream";

    return {
      path: filePath,
      size: fileSize,
      type: fileType,
    };
  } catch (err) {
    console.error("Error getting file stats or MIME type:", err);
    return null;
  }
}

function serializeACL(aclList) {
  console.log(aclList);
  return aclList
    .map((user) => `${user.name};${user.access === "read" ? "\x00" : "\x01"}`)
    .join("|");
}

// async function sendToAgentCommand(commandType, filePathFromArgs, sharedWithList) {
//   const transformedFilePath = filePathFromArgs.replaceAll("\\", "\\\\\\\\");
//   console.log(transformedFilePath);

//   const client = new net.Socket();
//   let registerData = "";
//   registerData = serializeACL(sharedWith);

//   if (registerData.endsWith("|")) {
//     registerData = registerData.slice(0, -1);
//   }
//   const commandByte = Buffer.from([0x01]);
//   const filePath = Buffer.from(transformedFilePath, "utf-8");
//   const acl = Buffer.from(registerData, "utf-8");
//   const separator = Buffer.from("$", "utf-8");

//   const message = Buffer.concat([
//     commandByte,
//     filePath,
//     separator,
//     acl,
//     separator,
//   ]);

//   console.log(
//     "Register data being sent to agent:",
//     message.toString("utf-8")
//   );

//   return new Promise((resolve) => {
//         client.connect(2512, "127.0.0.1", () => {
//           client.write(message);
//         });

//         client.on("data", (data) => {
//           receivedDataBuffer = Buffer.concat([receivedDataBuffer, data]);
//           const responseByte = receivedDataBuffer.readUInt8(0);
//           if (responseByte === 0x00) { // Assuming 0x00 from agent means success
//             console.log("Agent responded with success (0x00).");
//             client.end();
//             resolve({ status: "success", response: data.toString() });
//           }
//         });

//         client.on("error", (err) => {
//           console.warn(`Agent responded with failure (0x${responseByte.toString(16)}).`);
//           client.end();
//           resolve({ status: "error", message: err.message });

//           client.on("close", () => {
//             console.log("Socket connection closed.");
//           });
//         });
//       });
// }

ipcMain.handle("choose-file", async () => {
  const fileInfo = await chooseFile();
  console.log("File info chosen from dialog:", fileInfo);
  return fileInfo;
});

ipcMain.handle("agent-command", async (event, command, args) => {
  if (!args || typeof args !== "object") {
    console.error("Invalid arguments for agent-command:", args);
    return { status: "error", message: "Invalid arguments provided." };
  }
  console.log(`Received command from frontend: ${command}`);

  if (command === "upload" && args) {
    const { path, sharedWith } = args;
    console.log(path);
    const transformedFilePath = path.replaceAll("\\", "\\\\\\\\");
    console.log(transformedFilePath);
    console.log("Received args:", args);

    try {
      const client = new net.Socket();
      let registerData = "";
      registerData = serializeACL(sharedWith);

      if (registerData.endsWith("|")) {
        registerData = registerData.slice(0, -1);
      }
      const commandByte = Buffer.from([AgentActionType.UPLOAD_FILE]);
      const filePath = Buffer.from(transformedFilePath, "utf-8");
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

      // return {status: "success"};

      return new Promise((resolve, reject) => {
        client.connect(2512, "127.0.0.1", () => {
          client.write(message);
        });

        client.on("data", (data) => {
          client.end();
          resolve({ status: "success", response: data.toString() });
        });

        client.on("error", (err) => {
          console.error("Socket error:", err);
          client.end();
          resolve({ status: "error", message: err.message });

          client.on("close", () => {
            console.log("Socket connection closed.");
          });
        });
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      return { status: "error", message: "Unexpected error" };
    }
  } else if (command === "update-permissions" && args) {
    const { path, sharedWith } = args;
    console.log(path);
    const transformedFilePath = path.replaceAll("\\", "\\\\\\\\");
    console.log(transformedFilePath);
    console.log("Received args:", args);

    try {
      const client = new net.Socket();
      let registerData = "";
      registerData = serializeACL(sharedWith);

      if (registerData.endsWith("|")) {
        registerData = registerData.slice(0, -1);
      }
      const commandByte = Buffer.from([AgentActionType.UPDATE_PERMISSIONS]);
      const filePath = Buffer.from(transformedFilePath, "utf-8");
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

      // return {status: "success"};

      return new Promise((resolve, reject) => {
        client.connect(2512, "127.0.0.1", () => {
          client.write(message);
        });

        client.on("data", (data) => {
          client.end();
          resolve({ status: "success", response: data.toString() });
        });

        client.on("error", (err) => {
          console.error("Socket error:", err);
          client.end();
          resolve({ status: "error", message: err.message });

          client.on("close", () => {
            console.log("Socket connection closed.");
          });
        });
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      return { status: "error", message: "Unexpected error" };
    }
  } else if (command === "delete" && args) {
    const { path } = args;
    console.log("Delete Path:", path);
    //transformedFilePath
    const transformedFilePath = path.replaceAll("\\", "\\\\\\\\");
    console.log("Transformed Delete Path:", transformedFilePath);
    console.log("Received Delete Args:", args);

    try {
      //messageCreation(agentactiontype, path, registerData:none)
      const client = new net.Socket();

      const commandByte = Buffer.from([AgentActionType.DELETE_FILE]);
      const filePathBuffer = Buffer.from(transformedFilePath, "utf-8");
      const separator = Buffer.from("$", "utf-8");

      const message = Buffer.concat([commandByte, filePathBuffer, separator]);
      
      console.log(
        "Delete data being sent to agent:",
        message.toString("utf-8")
      );
      //return sendToAgent
      return new Promise((resolve, reject) => {
        client.connect(2512, "127.0.0.1", () => {
          client.write(message);
        });

        client.on("data", (data) => {
          client.end();
          resolve({ status: "success", response: data.toString() });
        });

        client.on("error", (err) => {
          console.error("Socket error:", err);
          client.end();
          reject({ status: "error", message: err.message });

          client.on("close", () => {
            console.log("Socket connection closed.");
          });
        });
      });
    } catch (err) {
      console.error("Unexpected error during delete:", err);
      return { status: "error", message: "Unexpected delete error" };
    }
  } else {
    console.error(`Unknown or incomplete command received: ${command}`, args);
    return { status: "error", message: "Unknown or incomplete command." };
  }
});
