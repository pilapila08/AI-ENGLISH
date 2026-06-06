import assert from "node:assert/strict";
import test from "node:test";
import { ScoringService } from "../electron/services/scoringService";
import type {
  CorrectionItem,
  PracticeSession,
} from "../electron/types";

function createSession(userMessages: string[] = []): PracticeSession {
  return {
    id: "session-test",
    scenarioId: "interview",
    correctionMode: "strict",
    status: "active",
    messages: userMessages.map((content, index) => ({
      id: `message-${index}`,
      role: "user",
      content,
      createdAt: new Date(0).toISOString(),
    })),
    corrections: [],
    offlineFallback: false,
    startedAt: new Date(0).toISOString(),
  };
}

function createGrammarCorrection(index: number): CorrectionItem {
  return {
    id: `correction-${index}`,
    original: "I am agree.",
    corrected: "I agree.",
    errorType: "Grammar · verb form",
    explanation: "Agree is a verb.",
    betterExpression: "I agree with that approach.",
    severity: "high",
  };
}

test("empty session does not crash", () => {
  const score = new ScoringService().calculate(createSession());

  assert.equal(typeof score.overallScore, "number");
  assert.equal(score.pronunciationScore, 60);
});

test("more grammar errors produce a lower grammar score", () => {
  const service = new ScoringService();
  const session = createSession(["I have three years of backend experience."]);
  const oneError = service.calculate(session, [createGrammarCorrection(1)]);
  const threeErrors = service.calculate(session, [
    createGrammarCorrection(1),
    createGrammarCorrection(2),
    createGrammarCorrection(3),
  ]);

  assert.ok(threeErrors.grammarScore < oneError.grammarScore);
  assert.ok(threeErrors.grammarScore >= 50);
});

test("overall score stays within 0 to 100", () => {
  const score = new ScoringService().calculate(
    createSession(["Yes.", "I have three years of backend experience."]),
    Array.from({ length: 20 }, (_, index) => createGrammarCorrection(index)),
  );

  assert.ok(score.overallScore >= 0);
  assert.ok(score.overallScore <= 100);
});
