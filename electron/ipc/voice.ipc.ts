import { ipcMain } from "electron";
import {
  asrService,
  practiceTurnService,
  sessionService,
} from "../services/practiceRuntime";
import { VoiceDialogueService } from "../services/voiceDialogueService";
import type { VoiceReplyResult } from "../types";
import { IPC_CHANNELS } from "./channels";
import { assertTrustedSender, toAudioBuffer } from "./validation";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const voiceDialogueService = new VoiceDialogueService({
  asrService,
  sessionService,
  turnService: practiceTurnService,
});

export function registerVoiceIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.voiceTranscribeAndReply,
    async (
      event,
      audioData: ArrayBuffer | Uint8Array,
      meta?: { mimeType?: string },
    ): Promise<VoiceReplyResult> => {
      try {
        assertTrustedSender(event);
        const audioBuffer = toAudioBuffer(audioData, MAX_AUDIO_BYTES);
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
