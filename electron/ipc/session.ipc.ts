import { ipcMain } from "electron";
import type { CorrectionMode } from "../types";
import { getScenarios } from "../services/scenarioService";
import { ReportService } from "../services/reportService";
import { storageService } from "../services/storageService";
import {
  correctionService,
  dialogueService,
  scoringService,
  sessionService,
} from "../services/practiceRuntime";
import { IPC_CHANNELS } from "./channels";

const reportService = new ReportService();

export function registerSessionIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.practiceStart,
    async (_event, scenarioId: string, correctionMode: CorrectionMode) => {
      const scenarios = await getScenarios();
      const scenario = scenarios.find((item) => item.id === scenarioId);

      if (!scenario) {
        throw new Error(`Scenario not found: ${scenarioId}`);
      }

      return sessionService.createSession(scenario, correctionMode);
    },
  );

  ipcMain.handle(IPC_CHANNELS.practiceSendMessage, async (
    _event,
    text: string,
    meta?: { asrSucceeded?: boolean },
  ) => {
    const trimmedText = text.trim();
    const currentSession = sessionService.getCurrentSession();

    if (!currentSession || currentSession.status !== "active") {
      throw new Error("There is no active practice session.");
    }

    if (!trimmedText) {
      throw new Error("Message cannot be empty.");
    }

    const scenarios = await getScenarios();
    const scenario = scenarios.find(
      (item) => item.id === currentSession.scenarioId,
    );

    if (!scenario) {
      throw new Error(`Scenario not found: ${currentSession.scenarioId}`);
    }

    const sessionWithUserMessage = sessionService.addUserMessage(
      trimmedText,
      meta?.asrSucceeded ? trimmedText : undefined,
    );
    const correctionPromise = Promise.resolve().then(() =>
      correctionService.analyze(
        trimmedText,
        scenario,
        currentSession.correctionMode,
        sessionWithUserMessage.messages,
      ),
    ).catch((error) => {
      console.warn(
        "[SessionIPC] Correction analysis failed; continuing the dialogue.",
        error,
      );
      return [];
    });
    const [assistantReply, corrections, liveScore] = await Promise.all([
      dialogueService.reply(
        scenario,
        sessionWithUserMessage.messages,
        trimmedText,
      ),
      correctionPromise,
      scoringService.score(
        sessionWithUserMessage,
        scenario,
        sessionWithUserMessage.corrections,
      ),
    ]);

    if (assistantReply.fallbackUsed) {
      sessionService.markOfflineFallback();
    } else if (dialogueService.getMode() === "remote") {
      sessionService.clearOfflineFallback();
    }

    if (corrections.length > 0) {
      sessionService.addCorrections(corrections);
    }

    const sessionWithReply = sessionService.addAssistantMessage(assistantReply.content);
    sessionService.updateScore(liveScore);
    return sessionService.getCurrentSession();
  });

  ipcMain.handle(IPC_CHANNELS.practiceEnd, async () => {
    const currentSession = sessionService.getCurrentSession();

    if (!currentSession) {
      return null;
    }

    const scenarios = await getScenarios();
    const scenario = scenarios.find((item) => item.id === currentSession.scenarioId);

    if (!scenario) {
      return sessionService.endSession();
    }

    const finalScore = await scoringService.score(
      currentSession,
      scenario,
      currentSession.corrections,
    );
    sessionService.updateScore(finalScore);
    const completedSession = sessionService.endSession();

    if (!completedSession) {
      return null;
    }

    const report = reportService.generate(
        completedSession,
        completedSession.corrections,
        finalScore,
        scenario.name,
      );
    sessionService.updateReport(report);

    const sessionWithReport = sessionService.getCurrentSession();

    if (sessionWithReport) {
      try {
        await storageService.saveSession(sessionWithReport, report);
        sessionService.updateStorageWarning(undefined);
      } catch (error) {
        console.warn("[SessionIPC] Failed to save practice history.", error);
        sessionService.updateStorageWarning(
          "课后报告已生成，但历史记录保存失败。请检查本地存储权限。",
        );
      }
    }

    return sessionService.getCurrentSession();
  });
  ipcMain.handle(IPC_CHANNELS.practiceGetCurrent, () =>
    sessionService.getCurrentSession(),
  );
}
