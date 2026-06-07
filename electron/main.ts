import { app, BrowserWindow } from "electron";
import path from "node:path";
import { registerScenarioIpc } from "./ipc/scenario.ipc";
import { registerSessionIpc } from "./ipc/session.ipc";
import { registerSpeechIpc } from "./ipc/speech.ipc";
import { registerTTSIpc } from "./ipc/tts.ipc";
import { registerStorageIpc } from "./ipc/storage.ipc";
import { storageService } from "./services/storageService";

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);

// TTS audio is generated asynchronously, after the original user gesture has
// finished. Allow the trusted renderer to play that audio automatically.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: "#f4f7fb",
    title: "SpeakCoach AI Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.webContents.setAudioMuted(false);

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission) =>
      permission === "media" && webContents === mainWindow.webContents,
  );
  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(permission === "media" && webContents === mainWindow.webContents);
    },
  );

  if (isDevelopment) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    storageService.setStoragePath(
      path.join(app.getPath("userData"), "data", "sessions.json"),
    );
  }

  registerScenarioIpc();
  registerSessionIpc();
  registerSpeechIpc();
  registerTTSIpc();
  registerStorageIpc();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
