import "dotenv/config";
import type { ASRProvider } from "./asrProvider";
import type { LLMProvider } from "./llmProvider";
import { XiaomiMimoASRProvider } from "./xiaomiMimoASRProvider";
import { MockASRProvider } from "./mockASRProvider";
import { MockLLMProvider } from "./mockLLMProvider";
import { OpenAICompatibleProvider } from "./openAICompatibleProvider";
import { WhisperAPIProvider } from "./whisperAPIProvider";
import type { TTSProvider } from "./ttsProvider";
import { XiaomiMimoTTSProvider } from "./xiaomiMimoTTSProvider";
import type { AnalysisProvider } from "./analysisProvider";
import { OpenAICompatibleAnalysisProvider } from "./openAICompatibleAnalysisProvider";

export type LLMMode = "mock" | "remote" | "fallback";
export type ASRMode = "mock" | "whisper" | "mimo";
export type TTSMode = "mimo" | "unavailable";

export interface ProviderSelection {
  provider: LLMProvider;
  mode: Exclude<LLMMode, "fallback">;
}

export interface ASRProviderSelection {
  provider: ASRProvider;
  mode: ASRMode;
}

export interface TTSProviderSelection {
  provider: TTSProvider | null;
  mode: TTSMode;
}

export interface AnalysisProviderSelection {
  provider: AnalysisProvider | null;
  mode: "remote" | "heuristic";
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

export function createTTSProvider(): TTSProviderSelection {
  const providerName = process.env.TTS_PROVIDER?.trim().toLowerCase();

  if (providerName !== "mimo") {
    console.info("[ProviderFactory] MiMo TTS is disabled.");
    return { provider: null, mode: "unavailable" };
  }

  const apiKey =
    process.env.MIMO_TTS_API_KEY?.trim() ||
    process.env.MIMO_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      "[ProviderFactory] TTS_PROVIDER=mimo but no MiMo API key is configured.",
    );
    return { provider: null, mode: "unavailable" };
  }

  const model = process.env.MIMO_TTS_MODEL?.trim() || "mimo-v2.5-tts";
  console.info(`[ProviderFactory] Using MiMoTTSProvider with model ${model}.`);

  return {
    provider: new XiaomiMimoTTSProvider({
      apiKey,
      baseUrl:
        process.env.MIMO_TTS_BASE_URL?.trim() ||
        "https://api.xiaomimimo.com/v1",
      model,
      voice: process.env.MIMO_TTS_VOICE?.trim() || "Chloe",
    }),
    mode: "mimo",
  };
}

export function createAnalysisProvider(): AnalysisProviderSelection {
  if (process.env.USE_LLM_ANALYSIS?.trim().toLowerCase() === "false") {
    console.info("[ProviderFactory] LLM analysis disabled; using heuristics.");
    return { provider: null, mode: "heuristic" };
  }

  const apiKey =
    process.env.ANALYSIS_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    console.info("[ProviderFactory] No analysis API key; using heuristics.");
    return { provider: null, mode: "heuristic" };
  }

  console.info("[ProviderFactory] Using OpenAI-compatible LLM analysis.");
  return {
    provider: new OpenAICompatibleAnalysisProvider({
      apiKey,
      baseUrl:
        process.env.ANALYSIS_BASE_URL?.trim() ||
        process.env.OPENAI_BASE_URL?.trim() ||
        "https://api.openai.com/v1",
      model:
        process.env.ANALYSIS_MODEL?.trim() ||
        process.env.OPENAI_MODEL?.trim() ||
        "gpt-4o-mini",
    }),
    mode: "remote",
  };
}
