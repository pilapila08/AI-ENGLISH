import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("speakCoachAPI", {
  getScenarios: () => ipcRenderer.invoke("get-scenarios"),
  startPractice: (scenarioId: string, correctionMode: string) =>
    ipcRenderer.invoke("practice:start", scenarioId, correctionMode),
  sendMessage: (text: string, meta?: { asrSucceeded?: boolean }) =>
    ipcRenderer.invoke("practice:send-message", text, meta),
  endPractice: () => ipcRenderer.invoke("practice:end"),
  getCurrentSession: () => ipcRenderer.invoke("practice:get-current"),
  transcribeAudio: (
    arrayBuffer: ArrayBuffer,
    meta?: { mimeType?: string; scenarioId?: string },
  ) => ipcRenderer.invoke("speech:transcribe", arrayBuffer, meta),
  synthesizeSpeech: (
    text: string,
    options?: {
      voice?: string;
      style?: string;
      accent?:
        | "neutral"
        | "american"
        | "british"
        | "australian"
        | "irish"
        | "africanAmerican"
        | "indian"
        | "eastAsian";
    },
  ) => ipcRenderer.invoke("speech:synthesize", text, options),
  listHistory: () => ipcRenderer.invoke("history:list"),
  getHistoryDetail: (sessionId: string) =>
    ipcRenderer.invoke("history:get-detail", sessionId),
  transcribeAndReply: (
    audioBuffer: ArrayBuffer,
    meta?: { mimeType?: string },
  ) => ipcRenderer.invoke("voice:transcribe-and-reply", audioBuffer, meta),
});
