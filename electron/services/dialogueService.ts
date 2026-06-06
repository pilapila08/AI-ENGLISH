import { MockLLMProvider } from "../providers/mockLLMProvider";
import type { LLMProvider } from "../providers/llmProvider";
import type { ChatMessage } from "../types";
import type { Scenario } from "./scenarioService";

export class DialogueService {
  constructor(private readonly provider: LLMProvider = new MockLLMProvider()) {}

  async reply(
    scenario: Scenario,
    history: ChatMessage[],
    userInput: string,
  ): Promise<string> {
    try {
      return await this.provider.chat({ scenario, history, userInput });
    } catch (error) {
      console.error("[DialogueService] Failed to generate reply:", error);
      return "Thanks for sharing. Could you tell me a little more?";
    }
  }
}
