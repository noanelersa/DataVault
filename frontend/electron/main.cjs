const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const net = require("net");
const fs = require("fs").promises;
const mime = require("mime-types");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const Config = require("./config.cjs");

const expressApp = express();
const PORT = 4000;

const corsOptions = {
    origin: 'http://localhost', 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", 
    allowedHeaders: "Content-Type,Authorization", 
    credentials: true
};

expressApp.use(cors(corsOptions)); 

expressApp.use(express.json());
expressApp.use(cookieParser());

const AgentActionType = { UPLOAD_FILE: 0x01 };

function serializeACL(aclList) {
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

          if (responseByte === 0x01) {
            console.log(
              `Agent responded with success (0x01) for '${commandName}'.`
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

function messageCreation(
  agentActionType,
  path,
  registerData = null,
  authToken
) {
  const commandByte = Buffer.from([agentActionType]);
  const filePathBuffer = Buffer.from(path, "utf-8");
  const separator = Buffer.from("$", "utf-8");
  const token = authToken
    ? Buffer.from(`token=${authToken}`, "utf-8")
    : null;
  let message;

  if (registerData === null) {
    if (token) {
      message = Buffer.concat([commandByte, filePathBuffer, separator, token]);
    } else {
      message = Buffer.concat([commandByte, filePathBuffer, separator]);
    }
  } else {
    const acl = Buffer.from(registerData, "utf-8");
    if (token) {
      message = Buffer.concat([
        commandByte,
        filePathBuffer,
        separator,
        token,
        acl,
        separator,
      ]);
    } else {
      message = Buffer.concat([
        commandByte,
        filePathBuffer,
        separator,
        acl,
        separator,
      ]);
    }
  }
  console.log("data being sent to agent:", message.toString("utf-8"));
  return message;
}

expressApp.post("/upload", async (req, res) => {
  console.log(`Received command on /upload`);

  try {
    const { path: filePath, sharedWith } = req.body;
    console.log(filePath);
    console.log(sharedWith);

    const authHeader = req.headers["authorization"];
    const authToken = authHeader && authHeader.split(" ")[1];

    console.log(authToken);

    if (!authToken) {
      console.error(`Authentication token missing for /upload`);
      return res
        .status(401)
        .json({
          status: "error",
          message: "Authentication required. Token missing.",
        });
    }

    const transformedFilePath = filePath.replaceAll("\\", "\\\\");
    let registerData = serializeACL(sharedWith);
    if (registerData.endsWith("|")) {
      registerData = registerData.slice(0, -1);
    }

    const message = messageCreation(
      AgentActionType.UPLOAD_FILE,
      transformedFilePath,
      registerData,
      authToken
    );

    const agentResponse = await sendToAgent(message, "upload");

    if (agentResponse.status === "success") {
      res.json({ status: "success", message: "File registered successfully." });
    } else {
      res
        .status(500)
        .json({
          status: "error",
          message: agentResponse.message || "Agent reported an error.",
        });
    }
  } catch (err) {
    console.error("Unexpected error in /upload route:", err);
    res
      .status(500)
      .json({
        status: "error",
        message: "An unexpected server error occurred.",
      });
  }
});

expressApp.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Express server listening for uploads on http://127.0.0.1:${PORT}`
  );
});

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
    if (stats.size < 1024 * 1024) {
        fileSize = `${(stats.size / 1024).toFixed(1)} KB`;
    } else {
        fileSize = `${(stats.size / (1024 * 1024)).toFixed(1)} MB`;
    }

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

ipcMain.handle("choose-file", async () => {
  const fileInfo = await chooseFile();
  console.log("File info chosen from dialog:", fileInfo);
  return fileInfo;
});

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
