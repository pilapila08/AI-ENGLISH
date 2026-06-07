import type {
  AnalysisMessage,
  AnalysisProvider,
} from "./analysisProvider";

export interface OpenAICompatibleAnalysisConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

function getChatCompletionsUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return normalizedBaseUrl.endsWith("/chat/completions")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/chat/completions`;
}

export class OpenAICompatibleAnalysisProvider implements AnalysisProvider {
  constructor(private readonly config: OpenAICompatibleAnalysisConfig) {}

  async analyze(messages: AnalysisMessage[]): Promise<string> {
    let response: Response;
    const isXiaomiMimo = this.config.baseUrl.includes("xiaomimimo.com");
    const requestBody = {
      model: this.config.model,
      messages,
      temperature: 0.1,
      ...(isXiaomiMimo
        ? {
            max_completion_tokens: 1_500,
            thinking: { type: "disabled" },
          }
        : { max_tokens: 1_500 }),
    };

    try {
      response = await fetch(getChatCompletionsUrl(this.config.baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      throw new Error(
        `LLM analysis request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let result: ChatCompletionResponse;

    try {
      result = (await response.json()) as ChatCompletionResponse;
    } catch {
      throw new Error(`LLM analysis returned invalid JSON (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(
        `LLM analysis error (HTTP ${response.status}): ${
          result.error?.message ?? response.statusText
        }`,
      );
    }

    const content = result.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("LLM analysis returned empty content.");
    }

    return content;
  }
}
