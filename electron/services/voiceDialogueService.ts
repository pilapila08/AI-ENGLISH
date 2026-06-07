import { ASR_FALLBACK_PREFIX } from "./asrService";
import type {
  ChatMessage,
  CorrectionItem,
  CorrectionMode,
  PracticeSession,
  ScoreResult,
  VoiceReplyResult,
} from "../types";
import { getScenarios, type Scenario } from "./scenarioService";

interface VoiceASR {
  transcribe(
    audioBuffer: Buffer,
    meta?: { scenarioId?: string; mimeType?: string },
  ): Promise<string>;
  getMode(): "mock" | "whisper" | "mimo";
}

interface VoiceSession {
  getCurrentSession(): PracticeSession | null;
  addUserMessage(content: string, transcript?: string): PracticeSession;
  addCorrections(corrections: CorrectionItem[]): PracticeSession;
  addAssistantMessage(content: string): PracticeSession;
  updateScore(score: ScoreResult): PracticeSession;
  markOfflineFallback(): PracticeSession;
  clearOfflineFallback(): PracticeSession;
}

interface VoiceDialogue {
  reply(
    scenario: Scenario,
    history: ChatMessage[],
    userInput: string,
  ): Promise<{ content: string; fallbackUsed: boolean }>;
  getMode(): "mock" | "remote" | "fallback";
}

interface VoiceCorrection {
  analyze(
    original: string,
    scenario: Scenario,
    mode: CorrectionMode,
    history: ChatMessage[],
  ): Promise<CorrectionItem[]>;
}

interface VoiceScoring {
  score(
    session: PracticeSession,
    scenario: Scenario,
    corrections: CorrectionItem[],
  ): Promise<ScoreResult>;
  calculateHeuristic?(
    session: PracticeSession,
    corrections: CorrectionItem[],
  ): ScoreResult;
}

interface VoiceDialogueDependencies {
  asrService: VoiceASR;
  sessionService: VoiceSession;
  dialogueService: VoiceDialogue;
  correctionService: VoiceCorrection;
  scoringService: VoiceScoring;
  scenarioLoader?: () => Promise<Scenario[]>;
}

export class VoiceDialogueService {
  constructor(private readonly dependencies: VoiceDialogueDependencies) {}

  async handleVoiceInput(
    audioBuffer: Buffer,
    meta?: { mimeType?: string },
  ): Promise<VoiceReplyResult> {
    const startedAt = Date.now();
    if (audioBuffer.length === 0) {
      throw new Error("录音内容为空，请重新录音。");
    }

    const currentSession = this.dependencies.sessionService.getCurrentSession();

    if (!currentSession || currentSession.status !== "active") {
      throw new Error("请先开始练习，再使用一键语音输入。");
    }

    const scenarios = await (
      this.dependencies.scenarioLoader ?? getScenarios
    )();
    const scenario = scenarios.find((item) => item.id === currentSession.scenarioId);

    if (!scenario) {
      throw new Error("当前练习场景不存在，请重新开始练习。");
    }

    const rawTranscript = await this.dependencies.asrService.transcribe(audioBuffer, {
      scenarioId: scenario.id,
      mimeType: meta?.mimeType,
    });
    const asrCompletedAt = Date.now();
    const asrFallback = rawTranscript.startsWith(ASR_FALLBACK_PREFIX);
    const userText = rawTranscript.replace(ASR_FALLBACK_PREFIX, "").trim();

    if (!userText) {
      throw new Error("没有识别到有效英文内容，请重新录音或手动输入。");
    }

    const sessionWithUserMessage = this.dependencies.sessionService.addUserMessage(
      userText,
      userText,
    );
    const correctionPromise = this.dependencies.correctionService
      .analyze(
        userText,
        scenario,
        currentSession.correctionMode,
        sessionWithUserMessage.messages,
      )
      .catch((error) => {
        console.warn("[VoiceDialogueService] Correction failed; continuing.", error);
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
    const analysisCompletedAt = Date.now();

    if (corrections.length > 0) {
      this.dependencies.sessionService.addCorrections(corrections);
    }

    this.dependencies.sessionService.addAssistantMessage(dialogueReply.content);
    const updatedSession = this.dependencies.sessionService.getCurrentSession();
    const score = updatedSession
      ? this.dependencies.scoringService.calculateHeuristic?.(
          updatedSession,
          updatedSession.corrections,
        ) ?? updatedSession.score
      : undefined;

    if (score) {
      this.dependencies.sessionService.updateScore(score);
    }

    const fallbackUsed =
      asrFallback ||
      this.dependencies.asrService.getMode() === "mock" ||
      dialogueReply.fallbackUsed ||
      this.dependencies.dialogueService.getMode() !== "remote";

    if (fallbackUsed) {
      this.dependencies.sessionService.markOfflineFallback();
    } else {
      this.dependencies.sessionService.clearOfflineFallback();
    }

    console.info(
      `[VoiceDialogueService] Completed in ${Date.now() - startedAt}ms ` +
        `(ASR ${asrCompletedAt - startedAt}ms, dialogue+correction ${analysisCompletedAt - asrCompletedAt}ms).`,
    );

    return {
      userText,
      assistantReply: dialogueReply.content,
      corrections,
      score,
      fallbackUsed,
    };
  }
}
