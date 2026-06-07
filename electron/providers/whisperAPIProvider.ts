import type { ASRProvider, AudioMeta } from "./asrProvider";

export interface WhisperAPIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface WhisperResponse {
  text?: string;
  error?: {
    message?: string;
  };
}

function getTranscriptionsUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (normalizedBaseUrl.endsWith("/audio/transcriptions")) {
    return normalizedBaseUrl;
  }

  return `${normalizedBaseUrl}/audio/transcriptions`;
}

function getAudioExtension(mimeType?: string): string {
  if (mimeType?.includes("ogg")) {
    return "ogg";
  }

  if (mimeType?.includes("mpeg") || mimeType?.includes("mp3")) {
    return "mp3";
  }

  if (mimeType?.includes("wav")) {
    return "wav";
  }

  return "webm";
}

export class WhisperAPIProvider implements ASRProvider {
  constructor(private readonly config: WhisperAPIConfig) {}

  async transcribe(audioBuffer: Buffer, meta?: AudioMeta): Promise<string> {
    if (audioBuffer.length === 0) {
      throw new Error("Whisper API received an empty audio buffer.");
    }

    const mimeType = meta?.mimeType || "audio/webm";
    const formData = new FormData();
    const audioBytes = new Uint8Array(audioBuffer);
    const audioBlob = new Blob([audioBytes], { type: mimeType });

    formData.append(
      "file",
      audioBlob,
      `recording.${getAudioExtension(mimeType)}`,
    );
    formData.append("model", this.config.model);
    formData.append("language", "en");

    let response: Response;

    try {
      response = await fetch(getTranscriptionsUrl(this.config.baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: formData,
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      throw new Error(
        `Whisper API request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let result: WhisperResponse;

    try {
      result = (await response.json()) as WhisperResponse;
    } catch {
      throw new Error(`Whisper API returned invalid JSON (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(
        `Whisper API error (HTTP ${response.status}): ${
          result.error?.message ?? response.statusText
        }`,
      );
    }

    const transcript = result.text?.trim();

    if (!transcript) {
      throw new Error("Whisper API returned an empty transcript.");
    }

    return transcript;
  }
}
