import type {
  CorrectionItem,
  PracticeSession,
  ScoreResult,
} from "../types";

const scenarioKeywords: Record<string, string[]> = {
  interview: [
    "experience",
    "project",
    "team",
    "backend",
    "development",
    "challenge",
    "role",
  ],
  restaurant: ["order", "menu", "dish", "drink", "recommend", "bill", "please"],
  meeting: ["project", "progress", "risk", "timeline", "agree", "team", "next"],
  airport: ["passport", "flight", "gate", "boarding", "bag", "check", "booking"],
  self_introduction: [
    "name",
    "from",
    "work",
    "study",
    "enjoy",
    "interest",
    "goal",
  ],
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
  calculate(
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
      (answer) =>
        answer.words.length >= 6 || /[.!?]$/.test(answer.content),
    ).length;
    const asrAnswerCount = userMessages.filter((message) =>
      Boolean(message.transcript?.trim()),
    ).length;

    const pronunciationScore = this.scorePronunciation(
      answers.length,
      asrAnswerCount,
      averageAnswerLength,
      completeAnswers,
    );
    const grammarScore = this.scoreGrammar(corrections);
    const fluencyScore = this.scoreFluency(
      answers.length,
      averageAnswerLength,
      completeAnswers,
    );
    const vocabularyScore = this.scoreVocabulary(
      session.scenarioId,
      allWords,
    );
    const naturalnessScore = this.scoreNaturalness(corrections);
    const overallScore = clamp(
      pronunciationScore * 0.2 +
        grammarScore * 0.25 +
        fluencyScore * 0.2 +
        vocabularyScore * 0.15 +
        naturalnessScore * 0.2,
    );

    return {
      pronunciationScore,
      grammarScore,
      fluencyScore,
      vocabularyScore,
      naturalnessScore,
      overallScore,
    };
  }

  private scorePronunciation(
    answerCount: number,
    asrAnswerCount: number,
    averageLength: number,
    completeAnswers: number,
  ): number {
    if (answerCount === 0) {
      return 60;
    }

    // This is a clarity estimate based on usable ASR text, not acoustic scoring.
    const completenessBonus = (completeAnswers / answerCount) * 10;
    const shortAnswerPenalty = averageLength < 4 ? 12 : averageLength < 7 ? 5 : 0;
    const baseScore = asrAnswerCount > 0 ? 75 : 68;
    return clamp(baseScore + completenessBonus - shortAnswerPenalty, 50);
  }

  private scoreGrammar(corrections: CorrectionItem[]): number {
    const grammarErrors = corrections.filter((correction) =>
      correction.errorType.toLowerCase().includes("grammar"),
    );
    const deduction = grammarErrors.reduce(
      (total, correction) => total + severityPenalty[correction.severity],
      0,
    );
    return clamp(90 - deduction, 50);
  }

  private scoreFluency(
    answerCount: number,
    averageLength: number,
    completeAnswers: number,
  ): number {
    if (answerCount === 0) {
      return 55;
    }

    const lengthScore = Math.min(25, averageLength * 1.8);
    const continuityBonus = Math.min(10, Math.max(0, answerCount - 1) * 2);
    const completenessBonus = (completeAnswers / answerCount) * 10;
    return clamp(50 + lengthScore + continuityBonus + completenessBonus);
  }

  private scoreVocabulary(scenarioId: string, words: string[]): number {
    if (words.length === 0) {
      return 55;
    }

    const uniqueWords = new Set(words);
    const diversity = uniqueWords.size / words.length;
    const keywords = scenarioKeywords[scenarioId] ?? [];
    const keywordHits = keywords.filter((keyword) => uniqueWords.has(keyword)).length;
    return clamp(55 + diversity * 25 + Math.min(15, keywordHits * 3));
  }

  private scoreNaturalness(corrections: CorrectionItem[]): number {
    const deduction = corrections.reduce(
      (total, correction) =>
        total +
        severityPenalty[correction.severity] +
        (correction.betterExpression.trim() ? 1 : 0),
      0,
    );
    return clamp(90 - deduction, 45);
  }
}
