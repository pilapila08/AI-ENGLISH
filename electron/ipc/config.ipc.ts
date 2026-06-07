import { app, ipcMain } from "electron";
import type { ApiConfigInput } from "../types";
import { configService } from "../services/configService";
import { IPC_CHANNELS } from "./channels";
import { assertTrustedSender } from "./validation";

export function registerConfigIpc(): void {
  ipcMain.handle(IPC_CHANNELS.configGetStatus, (event) => {
    assertTrustedSender(event);
    return configService.getStatus();
  });
  ipcMain.handle(IPC_CHANNELS.configSave, async (event, input: ApiConfigInput) => {
    assertTrustedSender(event);
    if (!input || typeof input !== "object") throw new Error("配置内容无效。");
    return configService.save(input);
  });
  ipcMain.handle(IPC_CHANNELS.configClearSecrets, async (event) => {
    assertTrustedSender(event);
    return configService.clearSecrets();
  });
  ipcMain.handle(IPC_CHANNELS.configRestart, (event) => {
    assertTrustedSender(event);
    app.relaunch();
    app.exit(0);
  });
}
