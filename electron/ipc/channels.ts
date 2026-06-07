export const IPC_CHANNELS = {
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
