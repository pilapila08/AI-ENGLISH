import { ipcMain } from "electron";
import type { TTSOptions } from "../providers/ttsProvider";
import { TTSService } from "../services/ttsService";
import { IPC_CHANNELS } from "./channels";
import { assertTrustedSender } from "./validation";

const ttsService = new TTSService();
const MAX_TEXT_LENGTH = 4_000;
const ALLOWED_VOICES = new Set(["Mia", "Chloe", "Milo", "Dean"]);
const ALLOWED_ACCENTS = new Set([
  "neutral",
  "american",
  "british",
  "australian",
  "irish",
  "africanAmerican",
  "indian",
  "eastAsian",
]);

export function registerTTSIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.speechSynthesize,
    async (event, text: string, options?: TTSOptions) => {
      try {
        assertTrustedSender(event);
        if (typeof text !== "string" || !text.trim()) {
          throw new Error("Speech synthesis text is empty.");
        }

        if (text.length > MAX_TEXT_LENGTH) {
          throw new Error(`Speech synthesis text exceeds ${MAX_TEXT_LENGTH} characters.`);
        }
        if (options?.voice && !ALLOWED_VOICES.has(options.voice)) {
          throw new Error("Unsupported TTS voice.");
        }
        if (options?.accent && !ALLOWED_ACCENTS.has(options.accent)) {
          throw new Error("Unsupported TTS accent.");
        }
        if (options?.style && options.style.length > 500) {
          throw new Error("TTS style instruction is too long.");
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
