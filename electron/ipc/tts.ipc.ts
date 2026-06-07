import { ipcMain } from "electron";
import type { TTSOptions } from "../providers/ttsProvider";
import { TTSService } from "../services/ttsService";
import { IPC_CHANNELS } from "./channels";

const ttsService = new TTSService();
const MAX_TEXT_LENGTH = 4_000;

export function registerTTSIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.speechSynthesize,
    async (_event, text: string, options?: TTSOptions) => {
      try {
        if (typeof text !== "string" || !text.trim()) {
          throw new Error("Speech synthesis text is empty.");
        }

        if (text.length > MAX_TEXT_LENGTH) {
          throw new Error(`Speech synthesis text exceeds ${MAX_TEXT_LENGTH} characters.`);
        }

        return await ttsService.synthesize(text, options);
      } catch (error) {
        console.error("[TTSIPC] Failed to synthesize speech:", error);
        throw new Error(
          `Speech synthesis failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  );

}
