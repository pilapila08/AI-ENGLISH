import { ASR_FALLBACK_PREFIX } from "./asrService";
import type { PracticeSession, VoiceReplyResult } from "../types";
import { getScenarios, type Scenario } from "./scenarioService";
import type {
  PracticeTurnResult,
  PracticeTurnService,
} from "./practiceTurnService";

interface VoiceASR {
  transcribe(
    audioBuffer: Buffer,
    meta?: { scenarioId?: string; mimeType?: string },
  ): Promise<string>;
  getMode(): "mock" | "whisper" | "mimo";
}

interface VoiceSession {
  getCurrentSession(): PracticeSession | null;
  runExclusive<T>(operation: () => Promise<T>): Promise<T>;
}

interface VoiceTurnService {
  completeTurn(
    text: string,
    scenario: Scenario,
    options?: { asrSucceeded?: boolean; providerFallback?: boolean },
  ): Promise<PracticeTurnResult>;
}

interface VoiceDialogueDependencies {
  asrService: VoiceASR;
  sessionService: VoiceSession;
  turnService: VoiceTurnService | PracticeTurnService;
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

    return this.dependencies.sessionService.runExclusive(async () => {
      const currentSession = this.dependencies.sessionService.getCurrentSession();
      if (!currentSession || currentSession.status !== "active") {
        throw new Error("请先开始练习，再使用一键语音输入。");
      }

      const scenarios = await (
        this.dependencies.scenarioLoader ?? getScenarios
      )();
      const scenario = scenarios.find(
        (item) => item.id === currentSession.scenarioId,
      );
      if (!scenario) {
        throw new Error("当前练习场景不存在，请重新开始练习。");
      }

      const rawTranscript = await this.dependencies.asrService.transcribe(
        audioBuffer,
        {
          scenarioId: scenario.id,
          mimeType: meta?.mimeType,
        },
      );
      const asrCompletedAt = Date.now();
      const asrFallback = rawTranscript.startsWith(ASR_FALLBACK_PREFIX);
      const userText = rawTranscript.replace(ASR_FALLBACK_PREFIX, "").trim();

      if (!userText) {
        throw new Error("没有识别到有效英文内容，请重新录音或手动输入。");
      }

      const result = await this.dependencies.turnService.completeTurn(
        userText,
        scenario,
        {
          asrSucceeded: !asrFallback,
          providerFallback:
            asrFallback || this.dependencies.asrService.getMode() === "mock",
        },
      );

      console.info(
        `[VoiceDialogueService] Completed in ${Date.now() - startedAt}ms ` +
          `(ASR ${asrCompletedAt - startedAt}ms, turn ${Date.now() - asrCompletedAt}ms).`,
      );

      return {
        userText: result.userText,
        assistantReply: result.assistantReply,
        corrections: result.corrections,
        score: result.score,
        fallbackUsed: result.fallbackUsed,
      };
    });
  }
}
