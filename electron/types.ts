export type CorrectionMode = "immersive" | "gentle" | "strict";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
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

export interface PracticeSession {
  id: string;
  scenarioId: string;
  correctionMode: CorrectionMode;
  status: "active" | "completed";
  messages: ChatMessage[];
  corrections: CorrectionItem[];
  startedAt: string;
  endedAt?: string;
}
