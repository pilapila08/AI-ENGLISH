import type { AudioMeta, ASRProvider } from "../providers/asrProvider";
import { MockASRProvider } from "../providers/mockASRProvider";
import {
  createASRProvider,
  type ASRMode,
} from "../providers/providerFactory";

export const ASR_FALLBACK_PREFIX = "__SPEAKCOACH_ASR_FALLBACK__:";

export class ASRService {
  private readonly primaryProvider: ASRProvider;
  private readonly primaryMode: ASRMode;
  private mode: ASRMode;
  private readonly mockProvider = new MockASRProvider();
  private fallbackUntil = 0;
  private readonly fallbackCooldownMs = 30_000;

  constructor() {
    const selection = createASRProvider();
    this.primaryProvider = selection.provider;
    this.primaryMode = selection.mode;
    this.mode = selection.mode;
  }

  getMode(): ASRMode {
    if (this.primaryMode !== "mock" && Date.now() >= this.fallbackUntil) {
      return this.primaryMode;
    }
    return this.mode;
  }

  async transcribe(audioBuffer: Buffer, meta?: AudioMeta): Promise<string> {
    if (this.primaryMode === "mock") {
      return this.primaryProvider.transcribe(audioBuffer, meta);
    }

    if (Date.now() < this.fallbackUntil) {
      const mockTranscript = await this.mockProvider.transcribe(audioBuffer, meta);
      return `${ASR_FALLBACK_PREFIX}${mockTranscript}`;
    }

    try {
      const transcript = await this.primaryProvider.transcribe(audioBuffer, meta);
      this.mode = this.primaryMode;
      this.fallbackUntil = 0;
      return transcript;
    } catch (error) {
      console.warn(
        `[ASRService] ${this.primaryMode} ASR failed. Using temporary Mock fallback.`,
        error,
      );
      this.mode = "mock";
      this.fallbackUntil = Date.now() + this.fallbackCooldownMs;

      const mockTranscript = await this.mockProvider.transcribe(audioBuffer, meta);
      return `${ASR_FALLBACK_PREFIX}${mockTranscript}`;
    }
  }
}
