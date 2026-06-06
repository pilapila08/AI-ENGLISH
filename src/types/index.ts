export interface Scenario {
  id: string;
  name: string;
  description: string;
  userRole: string;
  aiRole: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  goals: string[];
  openingMessage: string;
  sampleQuestions: string[];
}

export type CorrectionMode = "immersive" | "gentle" | "strict";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  transcript?: string;
}

export interface CorrectionItem {
  id: string;
  original: string;
  corrected: string;
  errorType: string;
  explanation: string;
  betterExpression: string;
  severity: "low" | "medium" | "high";
}

export interface ScoreResult {
  pronunciationScore: number;
  grammarScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  naturalnessScore: number;
  contextAppropriatenessScore: number;
  overallScore: number;
}

export interface PracticeReport {
  id: string;
  sessionId: string;
  scenarioId: string;
  scenarioName: string;
  durationSeconds: number;
  dialogueTurns: number;
  score: ScoreResult;
  strengths: string[];
  mainIssues: string[];
  corrections: CorrectionItem[];
  recommendedExpressions: string[];
  nextSteps: string[];
  learningCards: Array<{
    front: string;
    back: string;
  }>;
  createdAt: string;
}

export interface PracticeSession {
  id: string;
  scenarioId: string;
  correctionMode: CorrectionMode;
  status: "active" | "completed";
  messages: ChatMessage[];
  corrections: CorrectionItem[];
  offlineFallback: boolean;
  score?: ScoreResult;
  report?: PracticeReport;
  startedAt: string;
  endedAt?: string;
}
