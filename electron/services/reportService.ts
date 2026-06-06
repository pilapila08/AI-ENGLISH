import { randomUUID } from "node:crypto";
import type {
  CorrectionItem,
  PracticeReport,
  PracticeSession,
  ScoreResult,
  StudyCard,
} from "../types";

const scenarioExpressions: Record<string, string[]> = {
  interview: [
    "One project I am particularly proud of is...",
    "My main responsibility was...",
    "The result was measurable because...",
  ],
  restaurant: [
    "Could you recommend a popular dish?",
    "I'd like to order..., please.",
    "Could we have the bill, please?",
  ],
  meeting: [
    "From my perspective, the key issue is...",
    "Could we clarify the next steps?",
    "I suggest that we...",
  ],
  airport: [
    "Could you tell me where the boarding gate is?",
    "I'd like to check in for my flight.",
    "Is this bag within the carry-on limit?",
  ],
  self_introduction: [
    "Let me briefly introduce myself.",
    "I am especially interested in...",
    "My current goal is to...",
  ],
};

const scoreLabels: Array<[keyof Omit<ScoreResult, "overallScore">, string]> = [
  ["pronunciationScore", "发音清晰度估算"],
  ["grammarScore", "语法准确度"],
  ["fluencyScore", "表达流畅度"],
  ["vocabularyScore", "词汇丰富度"],
  ["naturalnessScore", "表达自然度"],
  ["contextAppropriatenessScore", "语境适切度"],
];

export class ReportService {
  generate(
    session: PracticeSession,
    corrections: CorrectionItem[],
    scores: ScoreResult,
    scenarioName: string,
  ): PracticeReport {
    const userTurns = session.messages.filter((message) => message.role === "user");
    const rankedScores = scoreLabels
      .map(([key, label]) => ({ label, value: scores[key] }))
      .sort((left, right) => right.value - left.value);
    const expressions = this.buildRecommendedExpressions(
      session.scenarioId,
      corrections,
    );

    return {
      id: randomUUID(),
      sessionId: session.id,
      scenarioId: session.scenarioId,
      scenarioName,
      durationSeconds: this.getDurationSeconds(session),
      dialogueTurns: userTurns.length,
      scores: { ...scores },
      strengths: this.buildStrengths(rankedScores, userTurns.length),
      weaknesses: this.buildWeaknesses(rankedScores, corrections, userTurns.length),
      corrections: corrections.map((item) => ({ ...item })),
      recommendedExpressions: expressions,
      nextPracticeSuggestions: this.buildNextSuggestions(
        rankedScores,
        session.scenarioId,
      ),
      studyCards: this.buildStudyCards(corrections, expressions),
      createdAt: new Date().toISOString(),
    };
  }

  private getDurationSeconds(session: PracticeSession): number {
    const startedAt = Date.parse(session.startedAt);
    const endedAt = Date.parse(session.endedAt ?? new Date().toISOString());

    if (Number.isNaN(startedAt) || Number.isNaN(endedAt)) {
      return 0;
    }

    return Math.max(0, Math.round((endedAt - startedAt) / 1000));
  }

  private buildStrengths(
    rankedScores: Array<{ label: string; value: number }>,
    turnCount: number,
  ): string[] {
    if (turnCount === 0) {
      return [
        "已完成场景选择并熟悉练习流程。",
        "已建立本次练习记录，可继续完成更多对话轮次。",
      ];
    }

    return rankedScores.slice(0, 2).map(
      ({ label, value }) => `${label}表现较好，本次得分 ${value} 分。`,
    );
  }

  private buildWeaknesses(
    rankedScores: Array<{ label: string; value: number }>,
    corrections: CorrectionItem[],
    turnCount: number,
  ): string[] {
    if (turnCount === 0) {
      return [
        "本次尚未完成有效回答，暂时无法充分评估口语表现。",
        "需要增加回答长度和对话轮数，以获得更准确的反馈。",
      ];
    }

    const weaknesses = rankedScores
      .slice(-2)
      .reverse()
      .map(({ label, value }) => `${label}仍有提升空间，本次得分 ${value} 分。`);

    if (corrections.length > 0) {
      weaknesses[0] = `本次发现 ${corrections.length} 条可改进表达，建议优先复习典型错误。`;
    }

    return weaknesses;
  }

  private buildRecommendedExpressions(
    scenarioId: string,
    corrections: CorrectionItem[],
  ): string[] {
    const fromCorrections = corrections
      .map((item) => item.betterExpression || item.corrected)
      .filter(Boolean);
    const candidates = [...fromCorrections, ...(scenarioExpressions[scenarioId] ?? [])];
    const fallback = [
      "Could you tell me more about that?",
      "In my experience, the most important point is...",
      "Let me explain that in another way.",
    ];

    return [...new Set([...candidates, ...fallback])].slice(0, 3);
  }

  private buildNextSuggestions(
    rankedScores: Array<{ label: string; value: number }>,
    scenarioId: string,
  ): string[] {
    const lowest = rankedScores.slice(-2).reverse();

    return [
      `下一次重点练习${lowest[0].label}，尝试连续回答 2-3 句话。`,
      `围绕“${scenarioId}”场景复用本报告中的推荐表达。`,
      `复习${lowest[1].label}相关反馈，并在下一轮对话中主动应用。`,
    ];
  }

  private buildStudyCards(
    corrections: CorrectionItem[],
    expressions: string[],
  ): StudyCard[] {
    const correctionCards = corrections.slice(0, 3).map((item) => ({
      front: item.original,
      back: `${item.corrected}\n${item.explanation}`,
    }));
    const expressionCards = expressions.map((expression) => ({
      front: "场景表达",
      back: expression,
    }));

    return [...correctionCards, ...expressionCards].slice(0, 3);
  }
}
