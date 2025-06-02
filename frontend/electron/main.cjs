const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const net = require("net");
const { dialog } = require("electron");
const fs = require("fs").promises;
const mime = require("mime-types");
const Config = require('./config.cjs');
const commandWhitelist = require('./commands_whitelist.cjs');


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

function sendToAgent(message, commandName = "unknown_command") {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let responseReceivedAndProcessed = false;
    let receivedDataBuffer = Buffer.alloc(0);

    const responseTimeout = setTimeout(() => {
      if (!responseReceivedAndProcessed) {
        console.error(
          `Agent response timeout for command '${commandName}'. Destroying socket.`
        );
        client.destroy();
        reject({
          status: "error",
          message: `Agent response timed out for '${commandName}'.`,
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

          if (responseByte === 0x00) {
            console.log(
              `Agent responded with success (0x00) for '${commandName}'.`
            );
            client.end();
            resolve({ status: "success", message: "OK" });
          } else {
            console.warn(
              `Agent responded with failure (0x${responseByte.toString(
                16
              )}) for '${commandName}'.`
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
        console.error(`Socket error for command '${commandName}':`, err);
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
          message: `Agent closed connection unexpectedly early for '${commandName}'.`,
        });
      }
    });

    client.on("close", (hadError) => {
      console.log(
        `Socket connection for '${commandName}' closed. hadError:`,
        hadError
      );
    });
  });
}


function messageCreation(agentActionType, path, registerData = null) {
  const commandByte = Buffer.from([agentActionType]);
  const filePathBuffer = Buffer.from(path, "utf-8");
  const separator = Buffer.from("$", "utf-8");
  let message;

  if (registerData === null) {
    message = Buffer.concat([commandByte, filePathBuffer, separator]);
  } else {
    const acl = Buffer.from(registerData, "utf-8");
    message = Buffer.concat([
      commandByte,
      filePathBuffer,
      separator,
      acl,
      separator,
    ]);
  }
  console.log("data being sent to agent:", message.toString("utf-8"));
  return message;
}


ipcMain.handle("choose-file", async () => {
  const fileInfo = await chooseFile();
  console.log("File info chosen from dialog:", fileInfo);
  return fileInfo;
});


ipcMain.handle("agent-command", async (event, command, args) => {
  if (!args) {
    console.error("Invalid arguments for agent-command:", args);
    return { status: "error", message: "Invalid arguments provided." };
  }
    if (!commandWhitelist.includes(command)) {
    console.error(`SECURITY VIOLATION: Unauthorized command received: '${command}'.`);
    return { status: "error", message: `Unauthorized command: '${command}'.` };
  }
  console.log(`Received command from frontend: ${command}`);

  if (command === "upload" && args) {
    const { path, sharedWith } = args;
    console.log(path);
    const transformedFilePath = path.replaceAll("\\", "\\\\\\\\");
    console.log(transformedFilePath);
    console.log("Received args:", args);

    try {
      let registerData = "";
      registerData = serializeACL(sharedWith);

      if (registerData.endsWith("|")) {
        registerData = registerData.slice(0, -1);
      }
      message = messageCreation(
        AgentActionType.UPLOAD_FILE,
        transformedFilePath,
        registerData
      );
      // return {status: "success"};
      return sendToAgent(message, "upload");
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
      let registerData = "";
      registerData = serializeACL(sharedWith);

      if (registerData.endsWith("|")) {
        registerData = registerData.slice(0, -1);
      }

      message = messageCreation(
        AgentActionType.UPDATE_PERMISSIONS,
        transformedFilePath,
        registerData
      );
      // return {status: "success"};
      return sendToAgent(message, "update-permissions");
    } catch (err) {
      console.error("Unexpected error:", err);
      return { status: "error", message: "Unexpected error" };
    }
  } else if (command === "delete" && args) {
    const { path } = args;
    console.log("Received Delete Args:", args);
    const transformedFilePath = path.replaceAll("\\", "\\\\\\\\");

    try {
      message = messageCreation(
        AgentActionType.DELETE_FILE,
        transformedFilePath
      );
      return sendToAgent(message, "delete");
    } catch (err) {
      console.error("Unexpected error during delete:", err);
      return { status: "error", message: "Unexpected delete error" };
    }
  } else {
    console.error(`Unknown or incomplete command received: ${command}`, args);
    return { status: "error", message: "Unknown or incomplete command." };
  }
});
