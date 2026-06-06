import type { ChatMessage } from "../types";
import type { Scenario } from "../services/scenarioService";

export interface LLMChatInput {
  scenario: Scenario;
  history: ChatMessage[];
  userInput: string;
}

export interface LLMProvider {
  chat(input: LLMChatInput): Promise<string>;
}
