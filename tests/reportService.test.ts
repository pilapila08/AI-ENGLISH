import assert from "node:assert/strict";
import test from "node:test";
import { ReportService } from "../electron/services/reportService";
import type {
  CorrectionItem,
  PracticeSession,
  ScoreResult,
} from "../electron/types";

const scores: ScoreResult = {
  pronunciationScore: 75,
  grammarScore: 70,
  fluencyScore: 68,
  vocabularyScore: 72,
  naturalnessScore: 66,
  contextAppropriatenessScore: 80,
  overallScore: 72,
};

function createSession(): PracticeSession {
  return {
    id: "session-report",
    scenarioId: "interview",
    correctionMode: "strict",
    status: "completed",
    messages: [],
    corrections: [],
    offlineFallback: false,
    score: scores,
    startedAt: new Date(0).toISOString(),
    endedAt: new Date(5_000).toISOString(),
  };
}

const correction: CorrectionItem = {
  id: "correction-1",
  original: "I have three year experience.",
  corrected: "I have three years of experience.",
  errorType: "grammar",
  explanation: "Use the plural noun after three.",
  betterExpression: "I have three years of backend development experience.",
  severity: "high",
};

test("empty corrections still produce a complete report", () => {
  const report = new ReportService().generate(
    createSession(),
    [],
    scores,
    "英文面试",
  );

  assert.equal(report.durationSeconds, 5);
  assert.equal(report.dialogueTurns, 0);
  assert.ok(report.strengths.length >= 2);
  assert.ok(report.weaknesses.length >= 2);
  assert.ok(report.recommendedExpressions.length >= 3);
  assert.ok(report.nextPracticeSuggestions.length >= 3);
  assert.ok(report.studyCards.length >= 3);
});

test("typical corrections become expressions and study cards", () => {
  const session = createSession();
  session.messages.push({
    id: "message-1",
    role: "user",
    content: correction.original,
    createdAt: new Date(1_000).toISOString(),
  });
  const report = new ReportService().generate(
    session,
    [correction],
    scores,
    "英文面试",
  );

  assert.equal(report.dialogueTurns, 1);
  assert.ok(report.recommendedExpressions.includes(correction.betterExpression));
  assert.ok(report.studyCards.some((card) => card.front === correction.original));
});
