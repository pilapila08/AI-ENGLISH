import "dotenv/config";
import { safeStorage } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ApiConfigInput,
  ApiConfigStatus,
  ApiProviderPreset,
} from "../types";

interface StoredApiConfig {
  provider: ApiProviderPreset;
  apiKey: string;
}

const providers: Record<
  ApiProviderPreset,
  { baseUrl: string; model: string; capabilities: string[] }
> = {
  offline: {
    baseUrl: "",
    model: "",
    capabilities: ["模拟文本对话", "模拟语音转写", "启发式纠错与评分"],
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    capabilities: ["真实文本对话", "LLM 纠错与评分", "Whisper 语音转写"],
  },
  mimo: {
    baseUrl: "https://api.xiaomimimo.com/v1",
    model: "mimo-v2-flash",
    capabilities: ["真实文本对话", "LLM 纠错与评分", "MiMo ASR", "MiMo TTS"],
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    capabilities: ["真实文本对话", "LLM 纠错与评分", "模拟语音转写"],
  },
  qwen: {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen3.6-plus",
    capabilities: ["真实文本对话", "LLM 纠错与评分", "模拟语音转写"],
  },
};

export class ConfigService {
  private filePath = path.resolve(process.cwd(), "data", "api-config.json");
  private config: StoredApiConfig = { provider: "offline", apiKey: "" };
  private environmentActive = false;

  setStoragePath(filePath: string): void {
    this.filePath = filePath;
  }

  async initialize(): Promise<void> {
    this.environmentActive = this.hasEnvironmentConfiguration();
    if (this.environmentActive) return;

    this.config = await this.readStoredConfig();
    this.applyPreset(this.config);
  }

  getStatus(): ApiConfigStatus {
    const provider = this.environmentActive
      ? this.inferEnvironmentProvider()
      : this.config.provider;
    return {
      source: this.environmentActive
        ? "env"
        : this.config.apiKey
          ? "local"
          : "none",
      provider,
      configured: this.environmentActive || Boolean(this.config.apiKey),
      storageProtected: safeStorage.isEncryptionAvailable(),
      capabilities: providers[provider].capabilities,
    };
  }

  async save(input: ApiConfigInput): Promise<ApiConfigStatus> {
    if (this.environmentActive) {
      throw new Error("当前已检测到 .env 配置，无需在客户端重复设置。");
    }

    const provider = this.isProvider(input.provider) ? input.provider : "offline";
    const apiKey = this.cleanSecret(input.apiKey) || this.config.apiKey;
    if (provider !== "offline" && !apiKey) {
      throw new Error("请输入 API Key。");
    }

    this.config = { provider, apiKey: provider === "offline" ? "" : apiKey };
    await this.writeStoredConfig();
    this.applyPreset(this.config);
    return this.getStatus();
  }

  async clearSecrets(): Promise<ApiConfigStatus> {
    if (this.environmentActive) {
      throw new Error("当前使用 .env，请在项目目录中修改或删除 .env。");
    }
    this.config = { provider: "offline", apiKey: "" };
    await this.writeStoredConfig();
    this.applyPreset(this.config);
    return this.getStatus();
  }

  private applyPreset(config: StoredApiConfig): void {
    const preset = providers[config.provider];
    const key = config.apiKey;
    const mimo = config.provider === "mimo";
    const openai = config.provider === "openai";
    const values: Record<string, string> = {
      OPENAI_API_KEY: key,
      OPENAI_BASE_URL: preset.baseUrl,
      OPENAI_MODEL: preset.model,
      USE_MOCK_LLM: String(config.provider === "offline"),
      USE_LLM_ANALYSIS: String(config.provider !== "offline"),
      ANALYSIS_API_KEY: key,
      ANALYSIS_BASE_URL: preset.baseUrl,
      ANALYSIS_MODEL: preset.model,
      ASR_PROVIDER: mimo ? "mimo" : openai ? "whisper" : "mock",
      WHISPER_API_KEY: openai ? key : "",
      WHISPER_BASE_URL: "https://api.openai.com/v1",
      WHISPER_MODEL: "whisper-1",
      MIMO_API_KEY: mimo ? key : "",
      MIMO_ASR_API_KEY: mimo ? key : "",
      MIMO_ASR_BASE_URL: providers.mimo.baseUrl,
      MIMO_ASR_MODEL: "mimo-v2.5-asr",
      TTS_PROVIDER: mimo ? "mimo" : "",
      MIMO_TTS_API_KEY: mimo ? key : "",
      MIMO_TTS_BASE_URL: providers.mimo.baseUrl,
      MIMO_TTS_MODEL: "mimo-v2.5-tts",
      MIMO_TTS_VOICE: "Chloe",
    };
    for (const [name, value] of Object.entries(values)) process.env[name] = value;
  }

  private hasEnvironmentConfiguration(): boolean {
    return Boolean(
      process.env.OPENAI_API_KEY?.trim() ||
        process.env.ANALYSIS_API_KEY?.trim() ||
        process.env.WHISPER_API_KEY?.trim() ||
        process.env.MIMO_API_KEY?.trim() ||
        process.env.MIMO_ASR_API_KEY?.trim() ||
        process.env.MIMO_TTS_API_KEY?.trim(),
    );
  }

  private inferEnvironmentProvider(): ApiProviderPreset {
    const baseUrl = process.env.OPENAI_BASE_URL?.toLowerCase() ?? "";
    if (
      process.env.MIMO_API_KEY?.trim() ||
      process.env.MIMO_ASR_API_KEY?.trim() ||
      baseUrl.includes("xiaomimimo")
    ) return "mimo";
    if (baseUrl.includes("deepseek")) return "deepseek";
    if (baseUrl.includes("dashscope")) return "qwen";
    return "openai";
  }

  private isProvider(value: unknown): value is ApiProviderPreset {
    return typeof value === "string" && value in providers;
  }

  private cleanSecret(value: unknown): string {
    return typeof value === "string" ? value.trim().slice(0, 10_000) : "";
  }

  private async readStoredConfig(): Promise<StoredApiConfig> {
    try {
      const payload = await readFile(this.filePath, "utf8");
      const content = safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(Buffer.from(payload, "base64"))
        : Buffer.from(payload, "base64").toString("utf8");
      const parsed = JSON.parse(content) as Partial<StoredApiConfig>;
      return {
        provider: this.isProvider(parsed.provider) ? parsed.provider : "offline",
        apiKey: this.cleanSecret(parsed.apiKey),
      };
    } catch {
      return { provider: "offline", apiKey: "" };
    }
  }

  private async writeStoredConfig(): Promise<void> {
    const json = JSON.stringify(this.config);
    const payload = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(json).toString("base64")
      : Buffer.from(json, "utf8").toString("base64");
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, payload, "utf8");
  }
}

export const configService = new ConfigService();
