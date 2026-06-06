import type { ASRProvider, AudioMeta } from "./asrProvider";

export interface XiaomiMimoASRConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface XiaomiMimoASRResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

function getChatCompletionsUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return normalizedBaseUrl.endsWith("/chat/completions")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/chat/completions`;
}

function getSupportedMimeType(mimeType?: string): "audio/wav" | "audio/mpeg" {
  if (mimeType?.includes("wav")) {
    return "audio/wav";
  }

  if (mimeType?.includes("mpeg") || mimeType?.includes("mp3")) {
    return "audio/mpeg";
  }

  throw new Error(
    `MiMo V2.5 ASR only supports WAV or MP3 audio, received ${mimeType || "unknown"}.`,
  );
}

export class XiaomiMimoASRProvider implements ASRProvider {
  constructor(private readonly config: XiaomiMimoASRConfig) {}

  async transcribe(audioBuffer: Buffer, meta?: AudioMeta): Promise<string> {
    if (audioBuffer.length === 0) {
      throw new Error("MiMo ASR received an empty audio buffer.");
    }

    const mimeType = getSupportedMimeType(meta?.mimeType);
    const audioDataUrl = `data:${mimeType};base64,${audioBuffer.toString("base64")}`;
    let response: Response;

    try {
      response = await fetch(getChatCompletionsUrl(this.config.baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "input_audio",
                  input_audio: { data: audioDataUrl },
                },
              ],
            },
          ],
          asr_options: { language: "en" },
        }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      throw new Error(
        `MiMo ASR request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let result: XiaomiMimoASRResponse;

    try {
      result = (await response.json()) as XiaomiMimoASRResponse;
    } catch {
      throw new Error(`MiMo ASR returned invalid JSON (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(
        `MiMo ASR error (HTTP ${response.status}): ${
          result.error?.message ?? response.statusText
        }`,
      );
    }

    const transcript = result.choices?.[0]?.message?.content?.trim();

    if (!transcript) {
      throw new Error("MiMo ASR returned an empty transcript.");
    }

    return transcript;
  }
}
