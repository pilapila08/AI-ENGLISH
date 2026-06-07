import { contextBridge, ipcRenderer } from "electron";

// Sandboxed preload scripts cannot require arbitrary local modules unless they
// are bundled. Keep this allowlist local so the secure bridge always loads.
const IPC_CHANNELS = {
  getScenarios: "get-scenarios",
  practiceStart: "practice:start",
  practiceSendMessage: "practice:send-message",
  practiceEnd: "practice:end",
  practiceGetCurrent: "practice:get-current",
  speechTranscribe: "speech:transcribe",
  speechSynthesize: "speech:synthesize",
  historyList: "history:list",
  historyGetDetail: "history:get-detail",
  voiceTranscribeAndReply: "voice:transcribe-and-reply",
} as const;

contextBridge.exposeInMainWorld("speakCoachAPI", {
  getScenarios: () => ipcRenderer.invoke(IPC_CHANNELS.getScenarios),
  startPractice: (scenarioId: string, correctionMode: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.practiceStart, scenarioId, correctionMode),
  sendMessage: (text: string, meta?: { asrSucceeded?: boolean }) =>
    ipcRenderer.invoke(IPC_CHANNELS.practiceSendMessage, text, meta),
  endPractice: () => ipcRenderer.invoke(IPC_CHANNELS.practiceEnd),
  getCurrentSession: () => ipcRenderer.invoke(IPC_CHANNELS.practiceGetCurrent),
  transcribeAudio: (
    arrayBuffer: ArrayBuffer,
    meta?: { mimeType?: string; scenarioId?: string },
  ) => ipcRenderer.invoke(IPC_CHANNELS.speechTranscribe, arrayBuffer, meta),
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
  ) => ipcRenderer.invoke(IPC_CHANNELS.speechSynthesize, text, options),
  listHistory: () => ipcRenderer.invoke(IPC_CHANNELS.historyList),
  getHistoryDetail: (sessionId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.historyGetDetail, sessionId),
  transcribeAndReply: (
    audioBuffer: ArrayBuffer,
    meta?: { mimeType?: string },
  ) => ipcRenderer.invoke(IPC_CHANNELS.voiceTranscribeAndReply, audioBuffer, meta),
});
