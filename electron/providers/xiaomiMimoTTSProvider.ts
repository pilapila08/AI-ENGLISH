import type { TTSAudio, TTSOptions, TTSProvider } from "./ttsProvider";

export interface XiaomiMimoTTSConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  voice: string;
}

interface XiaomiMimoTTSResponse {
  choices?: Array<{
    message?: {
      audio?: {
        data?: string;
      };
    };
  }>;
  error?: { message?: string };
}

function getChatCompletionsUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return normalizedBaseUrl.endsWith("/chat/completions")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/chat/completions`;
}

export class XiaomiMimoTTSProvider implements TTSProvider {
  constructor(private readonly config: XiaomiMimoTTSConfig) {}

  async synthesize(text: string, options?: TTSOptions): Promise<TTSAudio> {
    const content = text.trim();

    if (!content) {
      throw new Error("MiMo TTS received empty text.");
    }

    const styledContent = options?.style
      ? `<style>${options.style}</style>${content}`
      : content;
    let response: Response;

    try {
      response = await fetch(getChatCompletionsUrl(this.config.baseUrl), {
        method: "POST",
        headers: {
          "api-key": this.config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: "assistant", content: styledContent }],
          audio: {
            format: "wav",
            voice: options?.voice || this.config.voice,
          },
        }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      throw new Error(
        `MiMo TTS request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let result: XiaomiMimoTTSResponse;

    try {
      result = (await response.json()) as XiaomiMimoTTSResponse;
    } catch {
      throw new Error(`MiMo TTS returned invalid JSON (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(
        `MiMo TTS error (HTTP ${response.status}): ${
          result.error?.message ?? response.statusText
        }`,
      );
    }

    const base64Audio = result.choices?.[0]?.message?.audio?.data;

    if (!base64Audio) {
      throw new Error("MiMo TTS returned empty audio.");
    }

    return {
      audioBuffer: Buffer.from(base64Audio, "base64"),
      mimeType: "audio/wav",
    };
  }

}
