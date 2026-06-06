import assert from "node:assert/strict";
import test from "node:test";
import type {
  AnalysisMessage,
  AnalysisProvider,
} from "../electron/providers/analysisProvider";
import { CorrectionService } from "../electron/services/correctionService";
import { ScoringService } from "../electron/services/scoringService";
import type { Scenario } from "../electron/services/scenarioService";
import type { PracticeSession } from "../electron/types";

class FakeAnalysisProvider implements AnalysisProvider {
  constructor(private readonly response: string) {}

  async analyze(_messages: AnalysisMessage[]): Promise<string> {
    return this.response;
  }
}

const scenario: Scenario = {
  id: "interview",
  name: "English Interview",
  description: "A technical interview",
  userRole: "candidate",
  aiRole: "interviewer",
  difficulty: "intermediate",
  goals: ["answer relevantly"],
  openingMessage: "Tell me about your experience.",
  sampleQuestions: [],
};

const session: PracticeSession = {
  id: "session",
  scenarioId: "interview",
  correctionMode: "strict",
  status: "active",
  messages: [
    {
      id: "a",
      role: "assistant",
      content: "Tell me about your experience.",
      createdAt: new Date(0).toISOString(),
    },
    {
      id: "u",
      role: "user",
      content: "I like pizza.",
      createdAt: new Date(0).toISOString(),
    },
  ],
  corrections: [],
  offlineFallback: false,
  startedAt: new Date(0).toISOString(),
};

test("LLM correction can identify a context issue", async () => {
  const provider = new FakeAnalysisProvider(
    JSON.stringify({
      corrections: [
        {
          original: "I like pizza.",
          corrected: "I have three years of backend experience.",
          errorType: "Context · relevance",
          explanation: "The answer does not address the interview question.",
          betterExpression: "I have three years of backend experience.",
          severity: "high",
        },
      ],
    }),
  );
  const corrections = await new CorrectionService(provider).analyze(
    "I like pizza.",
    scenario,
    "strict",
    session.messages,
  );

  assert.equal(corrections[0]?.errorType, "Context · relevance");
});

test("LLM scoring includes context appropriateness", async () => {
  const provider = new FakeAnalysisProvider(
    JSON.stringify({
      pronunciationScore: 70,
      grammarScore: 90,
      fluencyScore: 75,
      vocabularyScore: 70,
      naturalnessScore: 80,
      contextAppropriatenessScore: 20,
    }),
  );
  const score = await new ScoringService(provider).score(session, scenario);

  assert.equal(score.contextAppropriatenessScore, 20);
  assert.ok(score.overallScore < score.grammarScore);
});

test("gentle mode keeps one medium issue instead of hiding all feedback", async () => {
  const provider = new FakeAnalysisProvider(
    JSON.stringify({
      corrections: [
        {
          original: "I have three year experience.",
          corrected: "I have three years of experience.",
          errorType: "Grammar · plural noun",
          explanation: "Use a plural noun after three.",
          betterExpression: "I have three years of backend experience.",
          severity: "medium",
        },
      ],
    }),
  );
  const corrections = await new CorrectionService(provider).analyze(
    "I have three year experience.",
    scenario,
    "gentle",
    session.messages,
  );

  assert.equal(corrections.length, 1);
  assert.equal(corrections[0]?.severity, "medium");
});
