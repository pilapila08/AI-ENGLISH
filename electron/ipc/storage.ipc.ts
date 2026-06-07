import { ipcMain } from "electron";
import { storageService } from "../services/storageService";
import { IPC_CHANNELS } from "./channels";
import { assertString, assertTrustedSender } from "./validation";

export function registerStorageIpc(): void {
  ipcMain.handle(IPC_CHANNELS.historyList, (event) => {
    assertTrustedSender(event);
    return storageService.listHistory();
  });
  ipcMain.handle(
    IPC_CHANNELS.historyGetDetail,
    (event, sessionId: string) => {
      assertTrustedSender(event);
      assertString(sessionId, "Session ID", 128);
      return storageService.getHistoryDetail(sessionId);
    },
  );
}
