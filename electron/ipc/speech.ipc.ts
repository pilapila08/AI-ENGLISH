import { ipcMain } from "electron";
import { ASRService } from "../services/asrService";
import { IPC_CHANNELS } from "./channels";

const asrService = new ASRService();
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export function registerSpeechIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.speechTranscribe,
    async (
      _event,
      audioData: ArrayBuffer | Uint8Array,
      meta?: { mimeType?: string; scenarioId?: string },
    ) => {
      try {
        const audioBuffer = Buffer.from(audioData);

        if (audioBuffer.length === 0) {
          throw new Error("Audio data is empty.");
        }

        if (audioBuffer.length > MAX_AUDIO_BYTES) {
          throw new Error("Audio data exceeds the 25 MB limit.");
        }

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
