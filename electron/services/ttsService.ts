import type { TTSOptions, TTSProvider } from "../providers/ttsProvider";
import {
  createTTSProvider,
  type TTSMode,
} from "../providers/providerFactory";

export interface TTSSynthesisResult {
  audioData: Uint8Array | null;
  mimeType: "audio/wav" | null;
  mode: TTSMode;
  warning?: string;
}

export class TTSService {
  private provider: TTSProvider | null;
  private mode: TTSMode;
  private readonly cache = new Map<string, TTSSynthesisResult>();
  private readonly maxCacheEntries = 50;
  private readonly maxConcurrentRequests = 3;
  private activeRequests = 0;
  private readonly requestWaiters: Array<() => void> = [];

  constructor() {
    const selection = createTTSProvider();
    this.provider = selection.provider;
    this.mode = selection.mode;
  }

  async synthesize(
    text: string,
    options?: TTSOptions,
  ): Promise<TTSSynthesisResult> {
    if (!this.provider || this.mode === "unavailable") {
      return {
        audioData: null,
        mimeType: null,
        mode: "unavailable",
        warning: "MiMo TTS 未配置，无法朗读。",
      };
    }

    const cacheKey = JSON.stringify([
      text.trim(),
      options?.voice,
      options?.style,
      options?.accent,
    ]);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      return cached;
    }

    try {
      await this.acquireRequestSlot();
      const audio = await this.provider.synthesize(text, options);
      const result: TTSSynthesisResult = {
        audioData: new Uint8Array(audio.audioBuffer),
        mimeType: audio.mimeType,
        mode: this.mode,
      };
      this.cache.set(cacheKey, result);

      if (this.cache.size > this.maxCacheEntries) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }

      return result;
    } catch (error) {
      console.warn("[TTSService] MiMo TTS failed.", error);

      return {
        audioData: null,
        mimeType: null,
        mode: "unavailable",
        warning: `MiMo TTS 朗读失败：${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    } finally {
      this.releaseRequestSlot();
    }
  }

  private async acquireRequestSlot(): Promise<void> {
    if (this.activeRequests < this.maxConcurrentRequests) {
      this.activeRequests += 1;
      return;
    }

    await new Promise<void>((resolve) => this.requestWaiters.push(resolve));
    this.activeRequests += 1;
  }

  private releaseRequestSlot(): void {
    if (this.activeRequests === 0) {
      return;
    }

    this.activeRequests -= 1;
    this.requestWaiters.shift()?.();
  }
}
