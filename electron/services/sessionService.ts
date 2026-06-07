import { randomUUID } from "node:crypto";
import type {
  ChatMessage,
  CorrectionItem,
  CorrectionMode,
  PracticeReport,
  PracticeSession,
  ScoreResult,
} from "../types";
import type { Scenario } from "./scenarioService";

export class SessionService {
  private currentSession: PracticeSession | null = null;
  private operationTail: Promise<void> = Promise.resolve();

  runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationTail.then(operation, operation);
    this.operationTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  createSession(
    scenario: Scenario,
    correctionMode: CorrectionMode,
  ): PracticeSession {
    const session: PracticeSession = {
      id: randomUUID(),
      scenarioId: scenario.id,
      correctionMode,
      status: "active",
      messages: [
        this.createMessage("assistant", scenario.openingMessage),
      ],
      corrections: [],
      offlineFallback: false,
      startedAt: new Date().toISOString(),
    };

    this.currentSession = session;
    return this.cloneSession(session);
  }

  addUserMessage(content: string, transcript?: string): PracticeSession {
    return this.addMessage("user", content, transcript);
  }

  addAssistantMessage(content: string): PracticeSession {
    return this.addMessage("assistant", content);
  }

  addCorrections(corrections: CorrectionItem[]): PracticeSession {
    if (!this.currentSession || this.currentSession.status !== "active") {
      throw new Error("There is no active practice session.");
    }

    this.currentSession.corrections.push(...corrections);
    return this.cloneSession(this.currentSession);
  }

  updateScore(score: ScoreResult): PracticeSession {
    if (!this.currentSession) {
      throw new Error("There is no current practice session.");
    }

    this.currentSession.score = { ...score };
    return this.cloneSession(this.currentSession);
  }

  updateReport(report: PracticeReport): PracticeSession {
    if (!this.currentSession) {
      throw new Error("There is no current practice session.");
    }

    this.currentSession.report = {
      ...report,
      scores: { ...report.scores },
      corrections: report.corrections.map((item) => ({ ...item })),
      strengths: [...report.strengths],
      weaknesses: [...report.weaknesses],
      recommendedExpressions: [...report.recommendedExpressions],
      nextPracticeSuggestions: [...report.nextPracticeSuggestions],
      studyCards: report.studyCards.map((card) => ({ ...card })),
    };
    return this.cloneSession(this.currentSession);
  }

  updateStorageWarning(warning?: string): PracticeSession {
    if (!this.currentSession) {
      throw new Error("There is no current practice session.");
    }

    this.currentSession.storageWarning = warning;
    return this.cloneSession(this.currentSession);
  }

  markOfflineFallback(): PracticeSession {
    if (!this.currentSession) {
      throw new Error("There is no current practice session.");
    }

    this.currentSession.offlineFallback = true;
    return this.cloneSession(this.currentSession);
  }

  clearOfflineFallback(): PracticeSession {
    if (!this.currentSession) {
      throw new Error("There is no current practice session.");
    }

    this.currentSession.offlineFallback = false;
    return this.cloneSession(this.currentSession);
  }

  getCurrentSession(): PracticeSession | null {
    return this.currentSession ? this.cloneSession(this.currentSession) : null;
  }

  endSession(): PracticeSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.status = "completed";
    this.currentSession.endedAt = new Date().toISOString();
    return this.cloneSession(this.currentSession);
  }

  private addMessage(
    role: ChatMessage["role"],
    content: string,
    transcript?: string,
  ): PracticeSession {
    if (!this.currentSession || this.currentSession.status !== "active") {
      throw new Error("There is no active practice session.");
    }

    this.currentSession.messages.push(this.createMessage(role, content, transcript));
    return this.cloneSession(this.currentSession);
  }

  private createMessage(
    role: ChatMessage["role"],
    content: string,
    transcript?: string,
  ): ChatMessage {
    return {
      id: randomUUID(),
      role,
      content,
      createdAt: new Date().toISOString(),
      transcript,
    };
  }

  private cloneSession(session: PracticeSession): PracticeSession {
    return {
      ...session,
      messages: session.messages.map((message) => ({ ...message })),
      corrections: session.corrections.map((correction) => ({ ...correction })),
      score: session.score ? { ...session.score } : undefined,
      report: session.report
        ? {
            ...session.report,
            scores: { ...session.report.scores },
            corrections: session.report.corrections.map((item) => ({ ...item })),
            strengths: [...session.report.strengths],
            weaknesses: [...session.report.weaknesses],
            recommendedExpressions: [...session.report.recommendedExpressions],
            nextPracticeSuggestions: [...session.report.nextPracticeSuggestions],
            studyCards: session.report.studyCards.map((card) => ({ ...card })),
          }
        : undefined,
    };
  }
}
