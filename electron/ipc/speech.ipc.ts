import { ipcMain } from "electron";
import { asrService } from "../services/practiceRuntime";
import { IPC_CHANNELS } from "./channels";
import { assertTrustedSender, toAudioBuffer } from "./validation";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export function registerSpeechIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.speechTranscribe,
    async (
      event,
      audioData: ArrayBuffer | Uint8Array,
      meta?: { mimeType?: string; scenarioId?: string },
    ) => {
      try {
        assertTrustedSender(event);
        const audioBuffer = toAudioBuffer(audioData, MAX_AUDIO_BYTES);

        return await asrService.transcribe(audioBuffer, meta);
      } catch (error) {
        console.error("[SpeechIPC] Failed to transcribe audio:", error);
        throw new Error(
          `Audio transcription failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  );
}
