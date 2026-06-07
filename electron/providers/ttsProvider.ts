export type EnglishAccent =
  | "neutral"
  | "american"
  | "british"
  | "australian"
  | "irish"
  | "africanAmerican"
  | "indian"
  | "eastAsian";

export interface TTSOptions {
  voice?: string;
  style?: string;
  accent?: EnglishAccent;
}

export interface TTSAudio {
  audioBuffer: Buffer;
  mimeType: "audio/wav";
}

export interface TTSProvider {
  synthesize(text: string, options?: TTSOptions): Promise<TTSAudio>;
}
