import type { LLMChatInput, LLMProvider } from "./llmProvider";
import { PromptService } from "../services/promptService";

export interface OpenAICompatibleConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

function getChatCompletionsUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (normalizedBaseUrl.endsWith("/chat/completions")) {
    return normalizedBaseUrl;
  }

  return `${normalizedBaseUrl}/chat/completions`;
}

export class OpenAICompatibleProvider implements LLMProvider {
  private readonly promptService = new PromptService();

  constructor(private readonly config: OpenAICompatibleConfig) {}

  async chat(input: LLMChatInput): Promise<string> {
    let response: Response;

    try {
      response = await fetch(getChatCompletionsUrl(this.config.baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: this.promptService.buildMessages(input),
          temperature: 0.7,
          max_tokens: 180,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      throw new Error(
        `OpenAI Compatible request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let result: ChatCompletionResponse;

    try {
      result = (await response.json()) as ChatCompletionResponse;
    } catch {
      throw new Error(
        `OpenAI Compatible API returned invalid JSON (HTTP ${response.status}).`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `OpenAI Compatible API error (HTTP ${response.status}): ${
          result.error?.message ?? response.statusText
        }`,
      );
    }

    return (
      result.choices?.[0]?.message?.content?.trim() ||
      "Thanks for sharing. Could you tell me a little more?"
    );
  }
}
