import type { AnalysisProvider } from "../providers/analysisProvider";
import { createAnalysisProvider } from "../providers/providerFactory";
import type {
  CorrectionItem,
  PracticeSession,
  ScoreResult,
} from "../types";
import { parseAnalysisJson } from "./analysisJson";
import type { Scenario } from "./scenarioService";

type ScoreDimensions = Omit<ScoreResult, "overallScore">;

const scenarioKeywords: Record<string, string[]> = {
  interview: ["experience", "project", "team", "backend", "challenge", "role"],
  restaurant: ["order", "menu", "dish", "drink", "recommend", "bill", "please"],
  meeting: ["project", "progress", "risk", "timeline", "agree", "team", "next"],
  airport: ["passport", "flight", "gate", "boarding", "bag", "booking"],
  self_introduction: ["name", "from", "work", "study", "enjoy", "interest", "goal"],
};

const severityPenalty: Record<CorrectionItem["severity"], number> = {
  high: 10,
  medium: 6,
  low: 3,
};

function clamp(score: number, minimum = 0, maximum = 100): number {
  return Math.round(Math.min(maximum, Math.max(minimum, score)));
}

function getWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

export class ScoringService {
  private readonly analysisProvider: AnalysisProvider | null;

  constructor(provider?: AnalysisProvider | null) {
    this.analysisProvider =
      provider === undefined ? createAnalysisProvider().provider : provider;
  }

  async score(
    session: PracticeSession,
    scenario: Scenario,
    corrections: CorrectionItem[] = session.corrections,
  ): Promise<ScoreResult> {
    if (this.analysisProvider) {
      try {
        return await this.scoreWithLLM(session, scenario, corrections);
      } catch (error) {
        console.warn(
          "[ScoringService] LLM scoring failed; using heuristic scoring.",
          error,
        );
      }
    }

    return this.calculateHeuristic(session, corrections);
  }

  calculateHeuristic(
    session: PracticeSession,
    corrections: CorrectionItem[] = session.corrections,
  ): ScoreResult {
    const userMessages = session.messages.filter(
      (message) => message.role === "user" && message.content.trim(),
    );
    const answers = userMessages.map((message) => ({
      content: message.content.trim(),
      words: getWords(message.content),
    }));
    const allWords = answers.flatMap((answer) => answer.words);
    const averageAnswerLength =
      answers.length === 0 ? 0 : allWords.length / answers.length;
    const completeAnswers = answers.filter(
      (answer) => answer.words.length >= 6 || /[.!?]$/.test(answer.content),
    ).length;
    const asrAnswerCount = userMessages.filter((message) =>
      Boolean(message.transcript?.trim()),
    ).length;
    const dimensions: ScoreDimensions = {
      pronunciationScore: this.scorePronunciation(
        answers.length,
        asrAnswerCount,
        averageAnswerLength,
        completeAnswers,
      ),
      grammarScore: this.scoreGrammar(corrections),
      fluencyScore: this.scoreFluency(
        answers.length,
        averageAnswerLength,
        completeAnswers,
      ),
      vocabularyScore: this.scoreVocabulary(session.scenarioId, allWords),
      naturalnessScore: this.scoreNaturalness(corrections),
      contextAppropriatenessScore: this.scoreContextAppropriateness(
        session,
        corrections,
      ),
    };

    return this.withOverall(dimensions);
  }

  private async scoreWithLLM(
    session: PracticeSession,
    scenario: Scenario,
    corrections: CorrectionItem[],
  ): Promise<ScoreResult> {
    const userMessages = session.messages.filter(
      (message) => message.role === "user" && message.content.trim(),
    );
    const dialogue = session.messages
      .map(
        (message, index) =>
          `${index + 1}. ${message.role}: ${message.content.trim() || "(empty)"}`,
      )
      .join("\n");
    const correctionSummary = corrections
      .map(
        (item) =>
          `${item.severity} ${item.errorType}: ${item.original} -> ${item.corrected}; explanation: ${item.explanation}; better expression: ${item.betterExpression}`,
      )
      .join("\n");
    const userWordCounts = userMessages.map(
      (message) => getWords(message.content).length,
    );
    const totalUserWords = userWordCounts.reduce(
      (total, count) => total + count,
      0,
    );
    const averageUserWords =
      userMessages.length === 0 ? 0 : totalUserWords / userMessages.length;
    const asrMessageCount = userMessages.filter((message) =>
      Boolean(message.transcript?.trim()),
    ).length;
    const response = await this.analysisProvider!.analyze([
      {
        role: "system",
        content: [
          "You are a rigorous and fair English speaking assessment engine for scenario-based conversation practice.",
          "Evaluate only the learner's messages. Use the scenario, complete conversation, measurable conversation statistics, and correction evidence supplied by the application.",
          "",
          "General scoring rules:",
          "- Score every dimension with an integer from 0 to 100.",
          "- Use evidence from the supplied conversation only. Do not invent mistakes, audio qualities, intentions, or vocabulary that are not present.",
          "- Be consistent and conservative. A score above 90 requires sustained excellent performance, not merely an absence of detected errors.",
          "- Consider the quantity of evidence. When there are few or very short learner responses, avoid extreme high scores and reflect limited evidence.",
          "- Repeated instances of the same issue should matter, but should not be penalized as harshly as several different serious issues.",
          "- Corrections are supporting evidence, not the sole source of truth. Also inspect the conversation directly.",
          "",
          "Dimension rubrics:",
          "1. pronunciationScore: This is only an ASR-based clarity and completeness estimate. Consider whether ASR transcripts exist, whether transcribed responses are complete and intelligible, and whether the text appears fragmented. Do not claim to assess accent, stress, intonation, phonemes, or actual acoustic pronunciation. If no learner message came from ASR, keep this score in a cautious middle range.",
          "2. grammarScore: Assess grammatical accuracy, sentence structure, tense, agreement, articles, prepositions, word forms, and whether errors obstruct meaning. Minor isolated errors should have limited impact; repeated or meaning-changing errors should have substantial impact.",
          "3. fluencyScore: Estimate the learner's ability to produce complete, connected, appropriately developed responses across turns. Consider response length, continuity, excessive fragments, repetition, and whether the learner can maintain the exchange. Do not infer speaking speed or pauses that are not provided.",
          "4. vocabularyScore: Assess range, precision, appropriate scenario vocabulary, collocations, and avoidance of excessive repetition. Reward accurate specific vocabulary more than unnecessarily difficult words.",
          "5. naturalnessScore: Assess whether expressions sound idiomatic, concise, polite, and natural for spoken English. Penalize awkward literal translations, unnatural phrasing, and register problems while distinguishing them from pure grammar errors.",
          "6. contextAppropriatenessScore: Assess whether each learner response answers or meaningfully relates to the preceding assistant prompt, fits the learner's assigned role, respects the scenario and register, advances the stated goals, and remains coherent with earlier turns.",
          "",
          "Score-band calibration for every dimension:",
          "- 90-100: consistently excellent, precise, natural, and supported by enough evidence.",
          "- 80-89: strong performance with only minor or occasional issues.",
          "- 70-79: generally effective but with noticeable limitations or recurring issues.",
          "- 60-69: understandable and partially effective, but frequent limitations reduce quality.",
          "- 40-59: major or repeated problems substantially affect communication, or evidence is very limited.",
          "- 0-39: communication is mostly ineffective, irrelevant, or unusable.",
          "",
          "Return exactly one JSON object and no markdown, explanation, comments, or extra keys:",
          '{"pronunciationScore":0,"grammarScore":0,"fluencyScore":0,"vocabularyScore":0,"naturalnessScore":0,"contextAppropriatenessScore":0}',
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Assessment evidence:",
          `Scenario: ${scenario.name}`,
          `Description: ${scenario.description}`,
          `Learner role: ${scenario.userRole}`,
          `AI role: ${scenario.aiRole}`,
          `Goals: ${scenario.goals.join("; ")}`,
          `Learner turns: ${userMessages.length}`,
          `Total learner words: ${totalUserWords}`,
          `Average learner words per turn: ${averageUserWords.toFixed(1)}`,
          `ASR-transcribed learner turns: ${asrMessageCount} of ${userMessages.length}`,
          `Detected corrections: ${corrections.length}`,
          "",
          `Complete conversation:\n${dialogue || "(empty conversation)"}`,
          "",
          `Correction evidence:\n${correctionSummary || "(no corrections detected)"}`,
          "",
          "Now score the six dimensions according to the rubric. Return JSON only.",
        ].join("\n"),
      },
    ]);
    const parsed = parseAnalysisJson<Partial<ScoreDimensions>>(response);
    const requiredKeys: Array<keyof ScoreDimensions> = [
      "pronunciationScore",
      "grammarScore",
      "fluencyScore",
      "vocabularyScore",
      "naturalnessScore",
      "contextAppropriatenessScore",
    ];

    for (const key of requiredKeys) {
      if (typeof parsed[key] !== "number") {
        throw new Error(`LLM scoring response is missing ${key}.`);
      }
    }

    return this.withOverall({
      pronunciationScore: clamp(parsed.pronunciationScore!),
      grammarScore: clamp(parsed.grammarScore!),
      fluencyScore: clamp(parsed.fluencyScore!),
      vocabularyScore: clamp(parsed.vocabularyScore!),
      naturalnessScore: clamp(parsed.naturalnessScore!),
      contextAppropriatenessScore: clamp(parsed.contextAppropriatenessScore!),
    });
  }

  private withOverall(scores: ScoreDimensions): ScoreResult {
    return {
      ...scores,
      overallScore: clamp(
        scores.pronunciationScore * 0.15 +
          scores.grammarScore * 0.2 +
          scores.fluencyScore * 0.15 +
          scores.vocabularyScore * 0.15 +
          scores.naturalnessScore * 0.15 +
          scores.contextAppropriatenessScore * 0.2,
      ),
    };
  }

  private scorePronunciation(
    answerCount: number,
    asrAnswerCount: number,
    averageLength: number,
    completeAnswers: number,
  ): number {
    if (answerCount === 0) return 60;
    const completenessBonus = (completeAnswers / answerCount) * 10;
    const shortPenalty = averageLength < 4 ? 12 : averageLength < 7 ? 5 : 0;
    return clamp((asrAnswerCount > 0 ? 75 : 68) + completenessBonus - shortPenalty, 50);
  }

  private scoreGrammar(corrections: CorrectionItem[]): number {
    const deduction = corrections
      .filter((item) => item.errorType.toLowerCase().includes("grammar"))
      .reduce((total, item) => total + severityPenalty[item.severity], 0);
    return clamp(90 - deduction, 50);
  }

  private scoreFluency(
    answerCount: number,
    averageLength: number,
    completeAnswers: number,
  ): number {
    if (answerCount === 0) return 55;
    return clamp(
      50 +
        Math.min(25, averageLength * 1.8) +
        Math.min(10, Math.max(0, answerCount - 1) * 2) +
        (completeAnswers / answerCount) * 10,
    );
  }

  private scoreVocabulary(scenarioId: string, words: string[]): number {
    if (words.length === 0) return 55;
    const uniqueWords = new Set(words);
    const keywordHits = (scenarioKeywords[scenarioId] ?? []).filter((keyword) =>
      uniqueWords.has(keyword),
    ).length;
    return clamp(55 + (uniqueWords.size / words.length) * 25 + Math.min(15, keywordHits * 3));
  }

  private scoreNaturalness(corrections: CorrectionItem[]): number {
    const deduction = corrections.reduce(
      (total, item) => total + severityPenalty[item.severity] + 1,
      0,
    );
    return clamp(90 - deduction, 45);
  }

  private scoreContextAppropriateness(
    session: PracticeSession,
    corrections: CorrectionItem[],
  ): number {
    const userTurns = session.messages.filter((message) => message.role === "user").length;
    if (userTurns === 0) return 60;
    const contextIssues = corrections.filter((item) =>
      item.errorType.toLowerCase().includes("context"),
    );
    const deduction = contextIssues.reduce(
      (total, item) => total + severityPenalty[item.severity],
      0,
    );
    return clamp(85 + Math.min(8, userTurns * 2) - deduction, 45);
  }
}
