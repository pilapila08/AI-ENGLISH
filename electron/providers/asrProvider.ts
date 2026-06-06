export interface AudioMeta {
  mimeType?: string;
  scenarioId?: string;
  durationMs?: number;
}

export interface ASRProvider {
  transcribe(audioBuffer: Buffer, meta?: AudioMeta): Promise<string>;
}
