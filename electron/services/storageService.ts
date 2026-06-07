import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  HistoryRecord,
  HistorySummary,
  PracticeReport,
  PracticeSession,
} from "../types";

export class StorageService {
  private filePath: string;
  private writeTail: Promise<void> = Promise.resolve();

  constructor(filePath = path.resolve(process.cwd(), "data", "sessions.json")) {
    this.filePath = filePath;
  }

  getStoragePath(): string {
    return this.filePath;
  }

  setStoragePath(filePath: string): void {
    this.filePath = filePath;
  }

  async saveSession(
    session: PracticeSession,
    report: PracticeReport,
  ): Promise<void> {
    const operation = this.writeTail.then(async () => {
      const records = await this.readRecords();
      const record: HistoryRecord = {
        sessionId: session.id,
        savedAt: new Date().toISOString(),
        session: this.cloneSession(session),
        report: this.cloneReport(report),
      };
      const existingIndex = records.findIndex(
        (item) => item.sessionId === session.id,
      );

      if (existingIndex >= 0) {
        records[existingIndex] = record;
      } else {
        records.push(record);
      }

      await this.writeRecords(records);
    });
    this.writeTail = operation.catch(() => undefined);
    return operation;
  }

  async listHistory(): Promise<HistorySummary[]> {
    const records = await this.readRecords();

    return records
      .map((record) => ({
        sessionId: record.sessionId,
        savedAt: record.savedAt,
        scenarioName: record.report.scenarioName,
        overallScore: record.report.scores.overallScore,
        dialogueTurns: record.report.dialogueTurns,
      }))
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  }

  async getHistoryDetail(sessionId: string): Promise<HistoryRecord | null> {
    const records = await this.readRecords();
    const record = records.find((item) => item.sessionId === sessionId);

    return record
      ? {
          ...record,
          session: this.cloneSession(record.session),
          report: this.cloneReport(record.report),
        }
      : null;
  }

  private async readRecords(): Promise<HistoryRecord[]> {
    try {
      const content = await readFile(this.filePath, "utf8");
      const parsed: unknown = JSON.parse(content);

      return Array.isArray(parsed)
        ? parsed.filter((item): item is HistoryRecord => this.isHistoryRecord(item))
        : [];
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (error instanceof SyntaxError) {
        await this.backupDamagedFile();
      } else if (code !== "ENOENT") {
        console.warn("[StorageService] Failed to read history; using empty history.", error);
      }

      return [];
    }
  }

  private async backupDamagedFile(): Promise<void> {
    const backupPath = `${this.filePath}.corrupted-${Date.now()}.json`;

    try {
      await rename(this.filePath, backupPath);
      console.warn(`[StorageService] Damaged history moved to ${backupPath}.`);
    } catch (error) {
      console.warn("[StorageService] Failed to back up damaged history.", error);
    }
  }

  private async writeRecords(records: HistoryRecord[]): Promise<void> {
    const directory = path.dirname(this.filePath);
    const temporaryPath = `${this.filePath}.tmp`;

    await mkdir(directory, { recursive: true });
    await writeFile(temporaryPath, JSON.stringify(records, null, 2), "utf8");
    await rename(temporaryPath, this.filePath);
  }

  private isHistoryRecord(value: unknown): value is HistoryRecord {
    if (!value || typeof value !== "object") {
      return false;
    }

    const record = value as Partial<HistoryRecord>;
    const report = record.report as Partial<PracticeReport> | undefined;
    return Boolean(
      typeof record.sessionId === "string" &&
        typeof record.savedAt === "string" &&
        record.session &&
        report &&
        typeof report.scenarioName === "string" &&
        typeof report.dialogueTurns === "number" &&
        report.scores &&
        typeof report.scores.overallScore === "number",
    );
  }

  private cloneSession(session: PracticeSession): PracticeSession {
    return JSON.parse(JSON.stringify(session)) as PracticeSession;
  }

  private cloneReport(report: PracticeReport): PracticeReport {
    return JSON.parse(JSON.stringify(report)) as PracticeReport;
  }
}

export const storageService = new StorageService();
