import type {
  CorrectionItem,
  PracticeSession,
  ScoreResult,
} from "../types";
import type { Scenario } from "./scenarioService";

interface TurnSessionService {
  getCurrentSession(): PracticeSession | null;
  addUserMessage(content: string, transcript?: string): PracticeSession;
  addCorrections(corrections: CorrectionItem[]): PracticeSession;
  addAssistantMessage(content: string): PracticeSession;
  updateScore(score: ScoreResult): PracticeSession;
  markOfflineFallback(): PracticeSession;
  clearOfflineFallback(): PracticeSession;
}

interface TurnDialogueService {
  reply(
    scenario: Scenario,
    history: PracticeSession["messages"],
    userInput: string,
  ): Promise<{ content: string; fallbackUsed: boolean }>;
  getMode(): "mock" | "remote" | "fallback";
}

interface TurnCorrectionService {
  analyze(
    original: string,
    scenario: Scenario,
    mode: PracticeSession["correctionMode"],
    history: PracticeSession["messages"],
  ): Promise<CorrectionItem[]>;
}

interface TurnScoringService {
  calculateHeuristic(
    session: PracticeSession,
    corrections: CorrectionItem[],
  ): ScoreResult;
}

export interface PracticeTurnResult {
  session: PracticeSession;
  userText: string;
  assistantReply: string;
  corrections: CorrectionItem[];
  score: ScoreResult;
  fallbackUsed: boolean;
}

interface PracticeTurnDependencies {
  sessionService: TurnSessionService;
  dialogueService: TurnDialogueService;
  correctionService: TurnCorrectionService;
  scoringService: TurnScoringService;
}

export class PracticeTurnService {
  constructor(private readonly dependencies: PracticeTurnDependencies) {}

  async completeTurn(
    text: string,
    scenario: Scenario,
    options: { asrSucceeded?: boolean; providerFallback?: boolean } = {},
  ): Promise<PracticeTurnResult> {
    const userText = text.trim();
    const currentSession = this.dependencies.sessionService.getCurrentSession();

    if (!currentSession || currentSession.status !== "active") {
      throw new Error("There is no active practice session.");
    }

    if (!userText) {
      throw new Error("Message cannot be empty.");
    }

    const sessionWithUserMessage = this.dependencies.sessionService.addUserMessage(
      userText,
      options.asrSucceeded ? userText : undefined,
    );
    const correctionPromise = this.dependencies.correctionService
      .analyze(
        userText,
        scenario,
        currentSession.correctionMode,
        sessionWithUserMessage.messages,
      )
      .catch((error) => {
        console.warn("[PracticeTurnService] Correction failed; continuing.", error);
        return [];
      });
    const [dialogueReply, corrections] = await Promise.all([
      this.dependencies.dialogueService.reply(
        scenario,
        sessionWithUserMessage.messages,
        userText,
      ),
      correctionPromise,
    ]);

    if (corrections.length > 0) {
      this.dependencies.sessionService.addCorrections(corrections);
    }

    this.dependencies.sessionService.addAssistantMessage(dialogueReply.content);
    const completedTurnSession = this.dependencies.sessionService.getCurrentSession();

    if (!completedTurnSession || completedTurnSession.status !== "active") {
      throw new Error("Practice session changed while processing the turn.");
    }

    const score = this.dependencies.scoringService.calculateHeuristic(
      completedTurnSession,
      completedTurnSession.corrections,
    );
    this.dependencies.sessionService.updateScore(score);

    const fallbackUsed =
      Boolean(options.providerFallback) ||
      dialogueReply.fallbackUsed ||
      this.dependencies.dialogueService.getMode() !== "remote";

    if (fallbackUsed) {
      this.dependencies.sessionService.markOfflineFallback();
    } else {
      this.dependencies.sessionService.clearOfflineFallback();
    }

    const session = this.dependencies.sessionService.getCurrentSession();
    if (!session) {
      throw new Error("Practice session disappeared while processing the turn.");
    }

    return {
      session,
      userText,
      assistantReply: dialogueReply.content,
      corrections,
      score,
      fallbackUsed,
    };
  }
}
