import { app, BrowserWindow } from "electron";
import path from "node:path";
import { registerScenarioIpc } from "./ipc/scenario.ipc";
import { registerSessionIpc } from "./ipc/session.ipc";
import { registerSpeechIpc } from "./ipc/speech.ipc";
import { registerTTSIpc } from "./ipc/tts.ipc";
import { registerStorageIpc } from "./ipc/storage.ipc";
import { registerVoiceIpc } from "./ipc/voice.ipc";
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
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const trusted =
      (isDevelopment &&
        Boolean(
          process.env.VITE_DEV_SERVER_URL &&
            url.startsWith(process.env.VITE_DEV_SERVER_URL),
        )) ||
      (!isDevelopment && url.startsWith("file://"));

    if (!trusted) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) =>
      permission === "media" &&
      webContents === mainWindow.webContents &&
      details.mediaType === "audio" &&
      (requestingOrigin.startsWith("file://") ||
        Boolean(
          process.env.VITE_DEV_SERVER_URL &&
            requestingOrigin.startsWith(process.env.VITE_DEV_SERVER_URL),
        )),
  );
  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      callback(
        permission === "media" &&
          webContents === mainWindow.webContents &&
          "mediaTypes" in details &&
          details.mediaTypes?.every((mediaType: string) => mediaType === "audio") ===
            true,
      );
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
  storageService.setStoragePath(
    path.join(app.getPath("userData"), "data", "sessions.json"),
  );

  registerScenarioIpc();
  registerSessionIpc();
  registerSpeechIpc();
  registerTTSIpc();
  registerStorageIpc();
  registerVoiceIpc();
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
