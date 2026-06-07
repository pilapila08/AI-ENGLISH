import { ipcMain } from "electron";
import type { CorrectionMode } from "../types";
import { getScenarios } from "../services/scenarioService";
import { ReportService } from "../services/reportService";
import { storageService } from "../services/storageService";
import {
  practiceTurnService,
  scoringService,
  sessionService,
} from "../services/practiceRuntime";
import { IPC_CHANNELS } from "./channels";
import { assertString, assertTrustedSender } from "./validation";

const reportService = new ReportService();
const MAX_MESSAGE_LENGTH = 4_000;

export function registerSessionIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.practiceStart,
    async (event, scenarioId: string, correctionMode: CorrectionMode) =>
      sessionService.runExclusive(async () => {
        assertTrustedSender(event);
        assertString(scenarioId, "Scenario ID", 128);
        const scenarios = await getScenarios();
        const scenario = scenarios.find((item) => item.id === scenarioId);

        if (!scenario) {
          throw new Error(`Scenario not found: ${scenarioId}`);
        }

        if (!["immersive", "gentle", "strict"].includes(correctionMode)) {
          throw new Error(`Unsupported correction mode: ${correctionMode}`);
        }

        return sessionService.createSession(scenario, correctionMode);
      }),
  );

  ipcMain.handle(
    IPC_CHANNELS.practiceSendMessage,
    async (
      event,
      text: string,
      meta?: { asrSucceeded?: boolean },
    ) =>
      sessionService.runExclusive(async () => {
        assertTrustedSender(event);
        assertString(text, "Message", MAX_MESSAGE_LENGTH);

        const trimmedText = text.trim();

        const currentSession = sessionService.getCurrentSession();
        if (!currentSession || currentSession.status !== "active") {
          throw new Error("There is no active practice session.");
        }

        const scenarios = await getScenarios();
        const scenario = scenarios.find(
          (item) => item.id === currentSession.scenarioId,
        );
        if (!scenario) {
          throw new Error(`Scenario not found: ${currentSession.scenarioId}`);
        }

        const result = await practiceTurnService.completeTurn(
          trimmedText,
          scenario,
          meta,
        );
        return result.session;
      }),
  );

  ipcMain.handle(IPC_CHANNELS.practiceEnd, async (event) =>
    sessionService.runExclusive(async () => {
      assertTrustedSender(event);
      const currentSession = sessionService.getCurrentSession();
      if (!currentSession) {
        return null;
      }
      if (currentSession.status === "completed") {
        return currentSession;
      }

      const scenarios = await getScenarios();
      const scenario = scenarios.find(
        (item) => item.id === currentSession.scenarioId,
      );
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
    }),
  );

  ipcMain.handle(IPC_CHANNELS.practiceGetCurrent, (event) => {
    assertTrustedSender(event);
    return sessionService.getCurrentSession();
  });
}
