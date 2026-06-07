import { randomUUID } from "node:crypto";
import type {
  ChatMessage,
  CorrectionItem,
  CorrectionMode,
} from "../types";
import type { AnalysisProvider } from "../providers/analysisProvider";
import { createAnalysisProvider } from "../providers/providerFactory";
import { parseAnalysisJson } from "./analysisJson";
import type { Scenario } from "./scenarioService";

interface LLMCorrectionResponse {
  corrections?: Array<Partial<Omit<CorrectionItem, "id">>>;
}

export class CorrectionService {
  private readonly analysisProvider: AnalysisProvider | null;

  constructor(provider?: AnalysisProvider | null) {
    this.analysisProvider =
      provider === undefined ? createAnalysisProvider().provider : provider;
  }

  async analyze(
    original: string,
    scenario: Scenario,
    mode: CorrectionMode,
    history: ChatMessage[] = [],
  ): Promise<CorrectionItem[]> {
    if (mode === "immersive") {
      return [];
    }

    if (this.analysisProvider) {
      try {
        const corrections = await this.analyzeWithLLM(
          original,
          scenario,
          mode,
          history,
        );
        const heuristicCorrections = this.analyzeHeuristic(
          original,
          scenario,
          "strict",
        );
        return this.applyModeLimits(
          this.mergeCorrections(corrections, heuristicCorrections),
          mode,
        );
      } catch (error) {
        console.warn(
          "[CorrectionService] LLM correction failed; using heuristic rules.",
          error,
        );
      }
    }

    return this.analyzeHeuristic(original, scenario, mode);
  }

  analyzeHeuristic(
    original: string,
    scenario: Scenario,
    mode: CorrectionMode,
  ): CorrectionItem[] {
    if (mode === "immersive") {
      return [];
    }

    const corrections: CorrectionItem[] = [];
    const add = (
      corrected: string,
      errorType: string,
      explanation: string,
      betterExpression: string,
      severity: CorrectionItem["severity"],
    ) =>
      corrections.push(
        this.createCorrection(
          original,
          corrected,
          errorType,
          explanation,
          betterExpression,
          severity,
        ),
      );

    if (/\bI have\s+(?:one|two|three|four|five|\d+)\s+year\b/i.test(original)) {
      add(
        original.replace(/\byear\b/i, "years"),
        "Grammar · plural noun",
        "Use the plural noun “years” after a number greater than one.",
        "I have three years of experience in backend development.",
        "high",
      );
    }

    if (/\bI am agree\b/i.test(original)) {
      add(
        original.replace(/\bI am agree\b/gi, "I agree"),
        "Grammar · verb form",
        "“Agree” is a verb, so it does not need “am”.",
        "I agree with that approach.",
        "high",
      );
    }

    if (/\bHow to say\b/i.test(original)) {
      add(
        original.replace(/\bHow to say\b/gi, "How do you say"),
        "Grammar · question form",
        "Use an auxiliary verb when asking a complete question.",
        "How do you say this more naturally in English?",
        "medium",
      );
    }

    if (mode === "strict" && original.trim().split(/\s+/).length < 4) {
      const corrected = corrections.at(-1)?.corrected ?? original;
      add(
        corrected,
        "Fluency · incomplete answer",
        "Add a reason, detail, or example to make the answer complete.",
        `${corrected.replace(/[.!?]+$/, "")}, and I can explain why.`,
        "low",
      );
    }

    return this.applyModeLimits(corrections, mode);
  }

  private async analyzeWithLLM(
    original: string,
    scenario: Scenario,
    mode: CorrectionMode,
    history: ChatMessage[],
  ): Promise<CorrectionItem[]> {
    const recentHistory = history
      .slice(-6)
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");
    const response = await this.analysisProvider!.analyze([
      {
        role: "system",
        content: [
          "You are an English speaking coach.",
          "Analyze the learner's latest sentence for grammar, expression, naturalness, and contextual appropriateness.",
          "Consider whether it appropriately answers the preceding conversation and fits the scenario.",
          `Correction mode: ${mode}.`,
          mode === "gentle"
            ? "Return only one serious issue, or an empty list."
            : "Return up to three concise, useful issues.",
          "Return JSON only with this shape:",
          '{"corrections":[{"original":"...","corrected":"...","errorType":"Grammar|Expression|Naturalness|Context · detail","explanation":"...","betterExpression":"...","severity":"low|medium|high"}]}',
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Scenario: ${scenario.name}`,
          `Description: ${scenario.description}`,
          `Learner role: ${scenario.userRole}`,
          `AI role: ${scenario.aiRole}`,
          `Goals: ${scenario.goals.join("; ")}`,
          `Recent conversation:\n${recentHistory || "(none)"}`,
          `Latest learner sentence: ${original}`,
        ].join("\n"),
      },
    ]);
    const parsed = parseAnalysisJson<LLMCorrectionResponse>(response);

    return (parsed.corrections ?? [])
      .map((item) => this.validateCorrection(item, original))
      .filter((item): item is CorrectionItem => Boolean(item));
  }

  private validateCorrection(
    item: Partial<Omit<CorrectionItem, "id">>,
    original: string,
  ): CorrectionItem | null {
    if (
      typeof item.corrected !== "string" ||
      typeof item.errorType !== "string" ||
      typeof item.explanation !== "string" ||
      typeof item.betterExpression !== "string" ||
      typeof item.severity !== "string" ||
      !["low", "medium", "high"].includes(item.severity.toLowerCase())
    ) {
      return null;
    }

    return this.createCorrection(
      typeof item.original === "string" ? item.original : original,
      item.corrected,
      item.errorType,
      item.explanation,
      item.betterExpression,
      item.severity.toLowerCase() as CorrectionItem["severity"],
    );
  }

  private applyModeLimits(
    corrections: CorrectionItem[],
    mode: CorrectionMode,
  ): CorrectionItem[] {
    if (mode === "gentle") {
      return corrections
        .filter((item) => item.severity !== "low")
        .sort(
          (left, right) =>
            this.getSeverityRank(right.severity) -
            this.getSeverityRank(left.severity),
        )
        .slice(0, 1);
    }

    return corrections
      .sort(
        (left, right) =>
          this.getSeverityRank(right.severity) -
          this.getSeverityRank(left.severity),
      )
      .slice(0, 3);
  }

  private mergeCorrections(
    primary: CorrectionItem[],
    fallback: CorrectionItem[],
  ): CorrectionItem[] {
    const merged = [...primary];

    for (const candidate of fallback) {
      const duplicate = merged.some(
        (item) =>
          item.corrected.trim().toLowerCase() ===
            candidate.corrected.trim().toLowerCase() ||
          item.errorType.trim().toLowerCase() ===
            candidate.errorType.trim().toLowerCase(),
      );

      if (!duplicate) {
        merged.push(candidate);
      }
    }

    return merged;
  }

  private getSeverityRank(severity: CorrectionItem["severity"]): number {
    return { low: 1, medium: 2, high: 3 }[severity];
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
