import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("speakCoachAPI", {
  getScenarios: () => ipcRenderer.invoke("get-scenarios"),
});
