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
      sendMessage: (text: string) => Promise<PracticeSession>;
      endPractice: () => Promise<PracticeSession | null>;
      getCurrentSession: () => Promise<PracticeSession | null>;
    };
  }
}

export {};
