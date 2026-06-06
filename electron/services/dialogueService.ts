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
  private provider: LLMProvider;
  private mode: LLMMode;
  private readonly mockProvider = new MockLLMProvider();

  constructor() {
    const selection = createLLMProvider();
    this.provider = selection.provider;
    this.mode = selection.mode;
  }

  getMode(): LLMMode {
    return this.mode;
  }

  async reply(
    scenario: Scenario,
    history: ChatMessage[],
    userInput: string,
  ): Promise<DialogueReply> {
    try {
      const content = await this.provider.chat({ scenario, history, userInput });
      return { content, fallbackUsed: this.mode === "fallback" };
    } catch (error) {
      console.warn(
        "[DialogueService] Remote LLM failed. Switching to MockLLMProvider.",
        error,
      );
      this.provider = this.mockProvider;
      this.mode = "fallback";

      return {
        content: await this.mockProvider.chat({ scenario, history, userInput }),
        fallbackUsed: true,
      };
    }
  }
}
