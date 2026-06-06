import "dotenv/config";
import type { ASRProvider } from "./asrProvider";
import type { LLMProvider } from "./llmProvider";
import { XiaomiMimoASRProvider } from "./xiaomiMimoASRProvider";
import { MockASRProvider } from "./mockASRProvider";
import { MockLLMProvider } from "./mockLLMProvider";
import { OpenAICompatibleProvider } from "./openAICompatibleProvider";
import { WhisperAPIProvider } from "./whisperAPIProvider";

export type LLMMode = "mock" | "remote" | "fallback";
export type ASRMode = "mock" | "whisper" | "mimo";

export interface ProviderSelection {
  provider: LLMProvider;
  mode: Exclude<LLMMode, "fallback">;
}

export interface ASRProviderSelection {
  provider: ASRProvider;
  mode: ASRMode;
}

export function createLLMProvider(): ProviderSelection {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (process.env.USE_MOCK_LLM?.toLowerCase() === "true") {
    console.info("[ProviderFactory] USE_MOCK_LLM=true, using MockLLMProvider.");
    return { provider: new MockLLMProvider(), mode: "mock" };
  }

  if (!apiKey) {
    console.info("[ProviderFactory] No API key configured, using MockLLMProvider.");
    return { provider: new MockLLMProvider(), mode: "mock" };
  }

  console.info("[ProviderFactory] Using OpenAICompatibleProvider.");
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

export function createASRProvider(): ASRProviderSelection {
  const providerName = process.env.ASR_PROVIDER?.trim().toLowerCase();

  if (providerName === "mimo") {
    const apiKey =
      process.env.MIMO_ASR_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      console.warn(
        "[ProviderFactory] ASR_PROVIDER=mimo but no MiMo API key is configured. Using MockASRProvider.",
      );
      return { provider: new MockASRProvider(), mode: "mock" };
    }

    const model = process.env.MIMO_ASR_MODEL?.trim() || "mimo-v2.5-asr";
    console.info(`[ProviderFactory] Using MiMoASRProvider with model ${model}.`);
    return {
      provider: new XiaomiMimoASRProvider({
        apiKey,
        baseUrl:
          process.env.MIMO_ASR_BASE_URL?.trim() ||
          "https://api.xiaomimimo.com/v1",
        model,
      }),
      mode: "mimo",
    };
  }

  if (providerName === "whisper") {
    const apiKey = process.env.WHISPER_API_KEY?.trim();

    if (!apiKey) {
      console.warn(
        "[ProviderFactory] ASR_PROVIDER=whisper but no API key is configured. Using MockASRProvider.",
      );
      return { provider: new MockASRProvider(), mode: "mock" };
    }

    const model = process.env.WHISPER_MODEL?.trim() || "whisper-1";
    console.info(
      `[ProviderFactory] Using WhisperAPIProvider with model ${model}.`,
    );
    return {
      provider: new WhisperAPIProvider({
        apiKey,
        baseUrl:
          process.env.WHISPER_BASE_URL?.trim() || "https://api.openai.com/v1",
        model,
      }),
      mode: "whisper",
    };
  }

  console.info("[ProviderFactory] Using MockASRProvider.");
  return { provider: new MockASRProvider(), mode: "mock" };
}
