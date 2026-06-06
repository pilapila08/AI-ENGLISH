import { randomUUID } from "node:crypto";
import type {
  ChatMessage,
  CorrectionMode,
  PracticeSession,
} from "../types";
import type { Scenario } from "./scenarioService";

export class SessionService {
  private currentSession: PracticeSession | null = null;

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

  addUserMessage(content: string): PracticeSession {
    return this.addMessage("user", content);
  }

  addAssistantMessage(content: string): PracticeSession {
    return this.addMessage("assistant", content);
  }

  markOfflineFallback(): PracticeSession {
    if (!this.currentSession) {
      throw new Error("There is no current practice session.");
    }

    this.currentSession.offlineFallback = true;
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

  private addMessage(role: ChatMessage["role"], content: string): PracticeSession {
    if (!this.currentSession || this.currentSession.status !== "active") {
      throw new Error("There is no active practice session.");
    }

    this.currentSession.messages.push(this.createMessage(role, content));
    return this.cloneSession(this.currentSession);
  }

  private createMessage(
    role: ChatMessage["role"],
    content: string,
  ): ChatMessage {
    return {
      id: randomUUID(),
      role,
      content,
      createdAt: new Date().toISOString(),
    };
  }

  private cloneSession(session: PracticeSession): PracticeSession {
    return {
      ...session,
      messages: session.messages.map((message) => ({ ...message })),
      corrections: session.corrections.map((correction) => ({ ...correction })),
    };
  }
}
