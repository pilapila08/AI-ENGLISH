import { randomUUID } from "node:crypto";
import type {
  CorrectionItem,
  CorrectionMode,
} from "../types";
import type { Scenario } from "./scenarioService";

interface CorrectionRule {
  errorType: string;
  severity: CorrectionItem["severity"];
  matches: (input: string) => boolean;
  correct: (input: string) => string;
  explanation: string;
  betterExpression: (corrected: string, scenario: Scenario) => string;
}

const rules: CorrectionRule[] = [
  {
    errorType: "Grammar · plural noun",
    severity: "high",
    matches: (input) => /\b(I have|with)\s+(\w+\s+)?(?:one|two|three|four|five|\d+)\s+year\b/i.test(input),
    correct: (input) =>
      input.replace(
        /\b((?:I have|with)\s+(?:\w+\s+)?(?:one|two|three|four|five|\d+)\s+)year\b/i,
        "$1years",
      ),
    explanation: "Use the plural noun “years” after a number greater than one.",
    betterExpression: (_corrected, scenario) =>
      scenario.id === "interview"
        ? "I have three years of experience in backend development."
        : "I have three years of relevant experience.",
  },
  {
    errorType: "Grammar · verb form",
    severity: "high",
    matches: (input) => /\bI am agree\b/i.test(input),
    correct: (input) => input.replace(/\bI am agree\b/gi, "I agree"),
    explanation: "“Agree” is a verb, so it does not need “am”.",
    betterExpression: () => "I agree with that approach.",
  },
  {
    errorType: "Grammar · question form",
    severity: "medium",
    matches: (input) => /\bHow to say\b/i.test(input),
    correct: (input) => input.replace(/\bHow to say\b/gi, "How do you say"),
    explanation: "Use an auxiliary verb when asking a complete question.",
    betterExpression: () => "How do you say this more naturally in English?",
  },
  {
    errorType: "Expression · ordering",
    severity: "medium",
    matches: (input) => /\bI want order\b/i.test(input),
    correct: (input) => input.replace(/\bI want order\b/gi, "I want to order"),
    explanation: "Use “to” before the verb after “want”.",
    betterExpression: (_corrected, scenario) =>
      scenario.id === "restaurant"
        ? "I’d like to order the grilled chicken, please."
        : "I’d like to place an order.",
  },
];

export class CorrectionService {
  analyze(
    original: string,
    scenario: Scenario,
    mode: CorrectionMode,
  ): CorrectionItem[] {
    if (mode === "immersive") {
      return [];
    }

    const corrections = rules
      .filter((rule) => rule.matches(original))
      .map((rule) => {
        const corrected = rule.correct(original);
        return this.createCorrection(
          original,
          corrected,
          rule.errorType,
          rule.explanation,
          rule.betterExpression(corrected, scenario),
          rule.severity,
        );
      });

    if (mode === "strict" && this.isTooShort(original)) {
      const correctedBase = corrections.at(-1)?.corrected ?? original;
      corrections.push(
        this.createCorrection(
          original,
          correctedBase,
          "Fluency · incomplete answer",
          "The answer is very short. Add a reason, detail, or example to make it complete.",
          this.getExpandedExpression(correctedBase, scenario),
          "low",
        ),
      );
    }

    if (mode === "gentle") {
      return corrections.filter((item) => item.severity === "high").slice(0, 1);
    }

    return corrections.slice(0, 3);
  }

  private isTooShort(input: string): boolean {
    return input.trim().split(/\s+/).filter(Boolean).length < 4;
  }

  private getExpandedExpression(input: string, scenario: Scenario): string {
    const cleanInput = input.trim().replace(/[.!?]+$/, "");

    if (scenario.id === "interview") {
      return `${cleanInput}, and I can share a specific example from my experience.`;
    }

    if (scenario.id === "meeting") {
      return `${cleanInput}, because it would help us keep the project on schedule.`;
    }

    return `${cleanInput}, and I’d be happy to explain in more detail.`;
  }

  private createCorrection(
    original: string,
    corrected: string,
    errorType: string,
    explanation: string,
    betterExpression: string,
    severity: CorrectionItem["severity"],
  ): CorrectionItem {
    return {
      id: randomUUID(),
      original,
      corrected,
      errorType,
      explanation,
      betterExpression,
      severity,
    };
  }
}
