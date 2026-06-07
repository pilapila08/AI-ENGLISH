import type { Scenario } from "./index";

declare global {
  interface Window {
    speakCoachAPI: {
      getScenarios: () => Promise<Scenario[]>;
    };
  }
}

export {};
