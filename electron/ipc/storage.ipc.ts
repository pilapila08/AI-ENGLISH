import { ipcMain } from "electron";
import { storageService } from "../services/storageService";
import { IPC_CHANNELS } from "./channels";

export function registerStorageIpc(): void {
  ipcMain.handle(IPC_CHANNELS.historyList, () => storageService.listHistory());
  ipcMain.handle(
    IPC_CHANNELS.historyGetDetail,
    (_event, sessionId: string) => storageService.getHistoryDetail(sessionId),
  );
}
