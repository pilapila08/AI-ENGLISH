import { ipcMain } from "electron";
import type { CorrectionMode } from "../types";
import { DialogueService } from "../services/dialogueService";
import { CorrectionService } from "../services/correctionService";
import { getScenarios } from "../services/scenarioService";
import { SessionService } from "../services/sessionService";
import { IPC_CHANNELS } from "./channels";

const sessionService = new SessionService();
const dialogueService = new DialogueService();
const correctionService = new CorrectionService();

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

  ipcMain.handle(IPC_CHANNELS.practiceSendMessage, async (_event, text: string) => {
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

    const sessionWithUserMessage = sessionService.addUserMessage(trimmedText);
    const correctionPromise = Promise.resolve().then(() =>
      correctionService.analyze(
        trimmedText,
        scenario,
        currentSession.correctionMode,
      ),
    ).catch((error) => {
      console.warn(
        "[SessionIPC] Correction analysis failed; continuing the dialogue.",
        error,
      );
      return [];
    });
    const [assistantReply, corrections] = await Promise.all([
      dialogueService.reply(
        scenario,
        sessionWithUserMessage.messages,
        trimmedText,
      ),
      correctionPromise,
    ]);

    if (assistantReply.fallbackUsed) {
      sessionService.markOfflineFallback();
    }

    if (corrections.length > 0) {
      sessionService.addCorrections(corrections);
    }

    return sessionService.addAssistantMessage(assistantReply.content);
  });

  ipcMain.handle(IPC_CHANNELS.practiceEnd, () => sessionService.endSession());
  ipcMain.handle(IPC_CHANNELS.practiceGetCurrent, () =>
    sessionService.getCurrentSession(),
  );
}
