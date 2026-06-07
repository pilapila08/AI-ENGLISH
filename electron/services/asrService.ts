import type { AudioMeta, ASRProvider } from "../providers/asrProvider";
import { MockASRProvider } from "../providers/mockASRProvider";
import {
  createASRProvider,
  type ASRMode,
} from "../providers/providerFactory";

export const ASR_FALLBACK_PREFIX = "__SPEAKCOACH_ASR_FALLBACK__:";

export class ASRService {
  private provider: ASRProvider;
  private mode: ASRMode;
  private readonly mockProvider = new MockASRProvider();

  constructor() {
    const selection = createASRProvider();
    this.provider = selection.provider;
    this.mode = selection.mode;
  }

  getMode(): ASRMode {
    return this.mode;
  }

  async transcribe(audioBuffer: Buffer, meta?: AudioMeta): Promise<string> {
    try {
      return await this.provider.transcribe(audioBuffer, meta);
    } catch (error) {
      if (this.mode === "mock") {
        throw error;
      }

      console.warn(
        `[ASRService] ${this.mode} ASR failed. Falling back to MockASRProvider.`,
        error,
      );
      this.provider = this.mockProvider;
      this.mode = "mock";

      const mockTranscript = await this.mockProvider.transcribe(audioBuffer, meta);
      return `${ASR_FALLBACK_PREFIX}${mockTranscript}`;
    }
  }
}
