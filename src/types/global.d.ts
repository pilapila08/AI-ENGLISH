import type {
  CorrectionMode,
  PracticeSession,
  Scenario,
} from "./index";

declare global {
  interface Window {
    speakCoachAPI: {
      getScenarios: () => Promise<Scenario[]>;
      startPractice: (
        scenarioId: string,
        correctionMode: CorrectionMode,
      ) => Promise<PracticeSession>;
      sendMessage: (
        text: string,
        meta?: { asrSucceeded?: boolean },
      ) => Promise<PracticeSession>;
      endPractice: () => Promise<PracticeSession | null>;
      getCurrentSession: () => Promise<PracticeSession | null>;
      transcribeAudio: (
        arrayBuffer: ArrayBuffer,
        meta?: { mimeType?: string; scenarioId?: string },
      ) => Promise<string>;
      synthesizeSpeech: (
        text: string,
        options?: { voice?: string; style?: string },
      ) => Promise<{
        audioData: Uint8Array | null;
        mimeType: "audio/wav" | null;
        mode: "mimo" | "unavailable";
        warning?: string;
      }>;
    };
  }
}

export {};
