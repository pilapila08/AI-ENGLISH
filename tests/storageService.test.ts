import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { StorageService } from "../electron/services/storageService";
import type {
  PracticeReport,
  PracticeSession,
  ScoreResult,
} from "../electron/types";

const scores: ScoreResult = {
  pronunciationScore: 75,
  grammarScore: 80,
  fluencyScore: 76,
  vocabularyScore: 74,
  naturalnessScore: 78,
  contextAppropriatenessScore: 82,
  overallScore: 78,
};

function createRecord(): { session: PracticeSession; report: PracticeReport } {
  const report: PracticeReport = {
    id: "report-storage",
    sessionId: "session-storage",
    scenarioId: "interview",
    scenarioName: "英文面试",
    durationSeconds: 60,
    dialogueTurns: 2,
    scores,
    strengths: ["表达清楚", "语境合适"],
    weaknesses: ["增加细节", "丰富词汇"],
    corrections: [],
    recommendedExpressions: ["One project I am proud of is..."],
    nextPracticeSuggestions: ["继续练习"],
    studyCards: [{ front: "场景表达", back: "My main responsibility was..." }],
    createdAt: new Date(0).toISOString(),
  };
  const session: PracticeSession = {
    id: "session-storage",
    scenarioId: "interview",
    correctionMode: "gentle",
    status: "completed",
    messages: [],
    corrections: [],
    offlineFallback: false,
    score: scores,
    report,
    startedAt: new Date(0).toISOString(),
    endedAt: new Date(60_000).toISOString(),
  };

  return { session, report };
}

test("storage service saves, lists, and returns history detail", async () => {
  const directory = path.resolve("dist-tests", "storage-test");
  const filePath = path.join(directory, "sessions.json");
  const service = new StorageService(filePath);
  const { session, report } = createRecord();

  await rm(directory, { recursive: true, force: true });
  await service.saveSession(session, report);

  const history = await service.listHistory();
  const detail = await service.getHistoryDetail(session.id);

  assert.equal(history.length, 1);
  assert.equal(history[0].overallScore, scores.overallScore);
  assert.equal(detail?.report.scenarioName, report.scenarioName);
  await rm(directory, { recursive: true, force: true });
});

test("missing or damaged JSON falls back to empty history", async () => {
  const directory = path.resolve("dist-tests", "storage-damaged-test");
  const filePath = path.join(directory, "sessions.json");
  const service = new StorageService(filePath);

  await rm(directory, { recursive: true, force: true });
  assert.deepEqual(await service.listHistory(), []);

  await mkdir(directory, { recursive: true });
  await writeFile(filePath, "{damaged", "utf8");
  assert.deepEqual(await service.listHistory(), []);
  await rm(directory, { recursive: true, force: true });
});
