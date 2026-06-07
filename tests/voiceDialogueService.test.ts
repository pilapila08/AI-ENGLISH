import assert from "node:assert/strict";
import test from "node:test";
import { CorrectionService } from "../electron/services/correctionService";
import { PracticeTurnService } from "../electron/services/practiceTurnService";
import { ScoringService } from "../electron/services/scoringService";
import { SessionService } from "../electron/services/sessionService";
import { VoiceDialogueService } from "../electron/services/voiceDialogueService";
import type { Scenario } from "../electron/services/scenarioService";

const scenario: Scenario = {
  id: "interview",
  name: "English interview",
  description: "Interview practice",
  userRole: "Candidate",
  aiRole: "Interviewer",
  difficulty: "intermediate",
  goals: ["Describe experience"],
  openingMessage: "Tell me about your experience.",
  sampleQuestions: [],
};

function createTurnService(sessionService: SessionService): PracticeTurnService {
  return new PracticeTurnService({
    sessionService,
    dialogueService: {
      getMode: () => "mock",
      reply: async () => ({
        content: "Thanks. Which backend project are you most proud of?",
        fallbackUsed: false,
      }),
    },
    correctionService: new CorrectionService(null),
    scoringService: new ScoringService(null),
  });
}

test("voice input completes mock ASR and LLM conversation", async () => {
  const sessionService = new SessionService();
  sessionService.createSession(scenario, "strict");
  const service = new VoiceDialogueService({
    asrService: {
      getMode: () => "mock",
      transcribe: async () =>
        "I have three year experience in backend development.",
    },
    sessionService,
    turnService: createTurnService(sessionService),
    scenarioLoader: async () => [scenario],
  });

  const result = await service.handleVoiceInput(Buffer.from("audio"), {
    mimeType: "audio/wav",
  });
  const session = sessionService.getCurrentSession();

  assert.equal(
    result.userText,
    "I have three year experience in backend development.",
  );
  assert.match(result.assistantReply, /backend project/);
  assert.ok(result.corrections.length > 0);
  assert.ok((result.score?.grammarScore ?? 100) < 90);
  assert.equal(result.fallbackUsed, true);
  assert.equal(
    session?.messages.filter((message) => message.role === "user").length,
    1,
  );
  assert.equal(
    session?.messages.filter((message) => message.role === "assistant").length,
    2,
  );
  assert.equal(session?.offlineFallback, true);
});

test("voice input rejects requests without an active session", async () => {
  const sessionService = new SessionService();
  const service = new VoiceDialogueService({
    asrService: {
      getMode: () => "mock",
      transcribe: async () => "Hello",
    },
    sessionService,
    turnService: createTurnService(sessionService),
    scenarioLoader: async () => [scenario],
  });

  await assert.rejects(
    () => service.handleVoiceInput(Buffer.from("audio")),
    /请先开始练习/,
  );
});

test("session exclusive operations preserve request order", async () => {
  const sessionService = new SessionService();
  const order: string[] = [];

  await Promise.all([
    sessionService.runExclusive(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push("first");
    }),
    sessionService.runExclusive(async () => {
      order.push("second");
    }),
  ]);

  assert.deepEqual(order, ["first", "second"]);
});
