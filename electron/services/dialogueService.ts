import type { LLMProvider } from "../providers/llmProvider";
import { MockLLMProvider } from "../providers/mockLLMProvider";
import {
  createLLMProvider,
  type LLMMode,
} from "../providers/providerFactory";
import type { ChatMessage } from "../types";
import type { Scenario } from "./scenarioService";

export interface DialogueReply {
  content: string;
  fallbackUsed: boolean;
}

export class DialogueService {
  private readonly primaryProvider: LLMProvider;
  private readonly primaryMode: Exclude<LLMMode, "fallback">;
  private mode: LLMMode;
  private readonly mockProvider = new MockLLMProvider();
  private fallbackUntil = 0;
  private readonly fallbackCooldownMs = 30_000;

  constructor() {
    const selection = createLLMProvider();
    this.primaryProvider = selection.provider;
    this.primaryMode = selection.mode;
    this.mode = selection.mode;
  }

  getMode(): LLMMode {
    if (this.primaryMode === "remote" && Date.now() >= this.fallbackUntil) {
      return "remote";
    }
    return this.mode;
  }

  async reply(
    scenario: Scenario,
    history: ChatMessage[],
    userInput: string,
  ): Promise<DialogueReply> {
    if (this.primaryMode === "mock") {
      const content = await this.primaryProvider.chat({
        scenario,
        history,
        userInput,
      });
      return { content, fallbackUsed: true };
    }

    if (Date.now() < this.fallbackUntil) {
      return {
        content: await this.mockProvider.chat({ scenario, history, userInput }),
        fallbackUsed: true,
      };
    }

    try {
      const content = await this.primaryProvider.chat({
        scenario,
        history,
        userInput,
      });
      this.mode = "remote";
      this.fallbackUntil = 0;
      return { content, fallbackUsed: false };
    } catch (error) {
      console.warn(
        "[DialogueService] Remote LLM failed. Using temporary Mock fallback.",
        error,
      );
      this.mode = "fallback";
      this.fallbackUntil = Date.now() + this.fallbackCooldownMs;

      return {
        content: await this.mockProvider.chat({ scenario, history, userInput }),
        fallbackUsed: true,
      };
    }
  }
}
