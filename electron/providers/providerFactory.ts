import "dotenv/config";
import type { LLMProvider } from "./llmProvider";
import { MockLLMProvider } from "./mockLLMProvider";
import { OpenAICompatibleProvider } from "./openAICompatibleProvider";

export type LLMMode = "mock" | "remote" | "fallback";

export interface ProviderSelection {
  provider: LLMProvider;
  mode: Exclude<LLMMode, "fallback">;
}

function isMockEnabled(): boolean {
  return process.env.USE_MOCK_LLM?.toLowerCase() === "true";
}

export function createLLMProvider(): ProviderSelection {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (isMockEnabled()) {
    console.info("[ProviderFactory] USE_MOCK_LLM=true, using MockLLMProvider.");
    return { provider: new MockLLMProvider(), mode: "mock" };
  }

  if (!apiKey) {
    console.info("[ProviderFactory] No API key configured, using MockLLMProvider.");
    return { provider: new MockLLMProvider(), mode: "mock" };
  }

  return {
    provider: new OpenAICompatibleProvider({
      apiKey,
      baseUrl:
        process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    }),
    mode: "remote",
  };
}
