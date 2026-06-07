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

export interface StudyCard {
  front: string;
  back: string;
}

export interface PracticeReport {
  id: string;
  sessionId: string;
  scenarioId: string;
  scenarioName: string;
  durationSeconds: number;
  dialogueTurns: number;
  scores: ScoreResult;
  strengths: string[];
  weaknesses: string[];
  corrections: CorrectionItem[];
  recommendedExpressions: string[];
  nextPracticeSuggestions: string[];
  studyCards: StudyCard[];
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
  storageWarning?: string;
  startedAt: string;
  endedAt?: string;
}

export interface HistoryRecord {
  sessionId: string;
  savedAt: string;
  session: PracticeSession;
  report: PracticeReport;
}

export interface HistorySummary {
  sessionId: string;
  savedAt: string;
  scenarioName: string;
  overallScore: number;
  dialogueTurns: number;
}
