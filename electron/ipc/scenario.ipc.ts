import { ipcMain } from "electron";
import {
  getDefaultScenarios,
  getScenarios,
} from "../services/scenarioService";
import { IPC_CHANNELS } from "./channels";

export function registerScenarioIpc(): void {
  ipcMain.handle(IPC_CHANNELS.getScenarios, async () => {
    try {
      return await getScenarios();
    } catch (error) {
      console.error("[ScenarioIPC] Unexpected scenario loading failure:", error);
      return getDefaultScenarios();
    }
  });
}
