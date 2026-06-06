import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("speakCoach", {
  platform: process.platform,
  appName: "SpeakCoach AI Desktop",
});
