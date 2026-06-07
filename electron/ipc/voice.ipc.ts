import { ipcMain } from "electron";
import { ASRService } from "../services/asrService";
import {
  correctionService,
  dialogueService,
  scoringService,
  sessionService,
} from "../services/practiceRuntime";
import { VoiceDialogueService } from "../services/voiceDialogueService";
import type { VoiceReplyResult } from "../types";
import { IPC_CHANNELS } from "./channels";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const voiceDialogueService = new VoiceDialogueService({
  asrService: new ASRService(),
  sessionService,
  dialogueService,
  correctionService,
  scoringService,
});

export function registerVoiceIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.voiceTranscribeAndReply,
    async (
      _event,
      audioData: ArrayBuffer | Uint8Array,
      meta?: { mimeType?: string },
    ): Promise<VoiceReplyResult> => {
      try {
        const audioBuffer = Buffer.from(audioData);

        if (audioBuffer.length === 0) {
          throw new Error("录音内容为空，请重新录音。");
        }

        if (audioBuffer.length > MAX_AUDIO_BYTES) {
          throw new Error("录音文件超过 25 MB 限制。");
        }

        return await voiceDialogueService.handleVoiceInput(audioBuffer, meta);
      } catch (error) {
        console.error("[VoiceIPC] Voice conversation failed:", error);
        return {
          userText: "",
          assistantReply: "",
          corrections: [],
          errorMessage:
            error instanceof Error
              ? error.message
              : "语音处理失败，请重试或使用手动输入。",
        };
      }
    },
  );
}
