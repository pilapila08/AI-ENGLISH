import type { ASRProvider, AudioMeta } from "./asrProvider";

const scenarioTranscripts: Record<string, string> = {
  interview: "I have three year experience in backend development.",
  restaurant: "I would like to order the grilled chicken, please.",
  meeting: "The project is on schedule, but we still have one technical risk.",
  airport: "Could you tell me where the departure gate is?",
  self_introduction: "Hello, my name is Alex and I am learning software development.",
};

export class MockASRProvider implements ASRProvider {
  async transcribe(audioBuffer: Buffer, meta?: AudioMeta): Promise<string> {
    if (audioBuffer.length === 0) {
      throw new Error("Audio buffer is empty.");
    }

    await new Promise((resolve) => setTimeout(resolve, 650));

    return (
      (meta?.scenarioId && scenarioTranscripts[meta.scenarioId]) ||
      "I have three year experience in backend development."
    );
  }
}
