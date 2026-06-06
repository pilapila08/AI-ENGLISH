import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("speakCoachAPI", {
  getScenarios: () => ipcRenderer.invoke("get-scenarios"),
  startPractice: (scenarioId: string, correctionMode: string) =>
    ipcRenderer.invoke("practice:start", scenarioId, correctionMode),
  sendMessage: (text: string) =>
    ipcRenderer.invoke("practice:send-message", text),
  endPractice: () => ipcRenderer.invoke("practice:end"),
  getCurrentSession: () => ipcRenderer.invoke("practice:get-current"),
  transcribeAudio: (
    arrayBuffer: ArrayBuffer,
    meta?: { mimeType?: string; scenarioId?: string },
  ) => ipcRenderer.invoke("speech:transcribe", arrayBuffer, meta),
});
