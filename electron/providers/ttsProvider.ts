export interface TTSOptions {
  voice?: string;
  style?: string;
}

export interface TTSAudio {
  audioBuffer: Buffer;
  mimeType: "audio/wav";
}

export interface TTSProvider {
  synthesize(text: string, options?: TTSOptions): Promise<TTSAudio>;
}
