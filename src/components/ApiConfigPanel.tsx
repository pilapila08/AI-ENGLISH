import { useEffect, useState } from "react";
import type {
  ApiConfigStatus,
  ApiProviderPreset,
} from "../types";
import GlassCard from "./GlassCard";
import StatusBadge from "./StatusBadge";

interface ApiConfigPanelProps {
  open: boolean;
  onClose: () => void;
}

const providerCards: Array<{
  id: ApiProviderPreset;
  name: string;
  code: string;
  description: string;
}> = [
  { id: "openai", name: "OpenAI", code: "OA", description: "文本对话、分析与 Whisper 转写" },
  { id: "mimo", name: "小米 MiMo", code: "MI", description: "文本对话、分析、ASR 与 TTS 完整能力" },
  { id: "deepseek", name: "DeepSeek", code: "DS", description: "文本对话与 LLM 纠错评分" },
  { id: "qwen", name: "通义千问", code: "QW", description: "阿里云百炼文本对话与分析" },
];

export default function ApiConfigPanel({ open, onClose }: ApiConfigPanelProps) {
  const [status, setStatus] = useState<ApiConfigStatus | null>(null);
  const [provider, setProvider] = useState<ApiProviderPreset>("mimo");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setError("");
    void window.speakCoachAPI
      .getApiConfigStatus()
      .then((nextStatus) => {
        setStatus(nextStatus);
        if (nextStatus.provider !== "offline") setProvider(nextStatus.provider);
      })
      .catch(() => setError("无法读取 API 配置状态，请重启客户端后重试。"));
  }, [open]);

  if (!open) return null;

  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const nextStatus = await window.speakCoachAPI.saveApiConfig({
        provider,
        apiKey,
      });
      setStatus(nextStatus);
      setApiKey("");
      setMessage("API Key 已安全保存。点击“重启并应用”即可使用。");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败。");
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const nextStatus = await window.speakCoachAPI.clearApiSecrets();
      setStatus(nextStatus);
      setApiKey("");
      setConfirmClear(false);
      setMessage("本地 API Key 已清除，重启后使用离线模拟模式。");
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "清除失败。");
    } finally {
      setBusy(false);
    }
  };

  const envActive = status?.source === "env";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#02040b]/80 p-4 backdrop-blur-md">
      <GlassCard className="app-enter w-full max-w-3xl overflow-hidden" glow="cyan">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="cockpit-label">服务连接</p>
              <StatusBadge tone={envActive ? "green" : status?.configured ? "cyan" : "amber"}>
                {envActive ? "正在使用 .env" : status?.configured ? "已保存本地 Key" : "离线模拟模式"}
              </StatusBadge>
            </div>
            <h2 className="mt-2 text-xl font-black text-white">连接 AI 服务</h2>
            <p className="mt-1 text-xs text-slate-500">
              选择服务商并输入一个 API Key，其余地址、模型和语音能力由客户端自动配置。
            </p>
          </div>
          <button className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-slate-400 transition hover:text-cyan-200" onClick={onClose} type="button">×</button>
        </header>

        <div className="p-5">
          {envActive ? (
            <section className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.05] p-5">
              <p className="text-sm font-black text-emerald-100">已自动加载项目 `.env`</p>
              <p className="mt-2 text-[11px] leading-6 text-slate-400">
                客户端会优先使用 `.env` 中的配置，不需要在这里重复输入 API Key。如需切换服务商，请修改或删除 `.env` 后重启客户端。
              </p>
              <CapabilityList items={status?.capabilities ?? []} />
            </section>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {providerCards.map((item) => {
                  const active = provider === item.id;
                  return (
                    <button
                      className={`group rounded-2xl border p-3 text-left transition duration-200 ${
                        active
                          ? "neon-border border-cyan-300/35 bg-cyan-400/[0.08]"
                          : "border-white/[0.07] bg-white/[0.025] hover:-translate-y-0.5 hover:border-violet-300/20"
                      }`}
                      key={item.id}
                      onClick={() => setProvider(item.id)}
                      type="button"
                    >
                      <span className="flex items-center gap-3">
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl border text-[10px] font-black ${active ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-black/20 text-slate-500"}`}>
                          {item.code}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-black text-white">{item.name}</span>
                          <span className="mt-1 block text-[9px] leading-4 text-slate-500">{item.description}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 block rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <span className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block text-xs font-black text-white">API Key</span>
                    <span className="mt-1 block text-[9px] text-slate-500">
                      {status?.configured ? "已保存 Key，留空会保持原值" : "Key 只发送到 Electron Main Process"}
                    </span>
                  </span>
                  <StatusBadge tone={status?.storageProtected ? "green" : "amber"}>
                    {status?.storageProtected ? "系统加密" : "本地存储"}
                  </StatusBadge>
                </span>
                <input
                  className="config-input mt-3"
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={status?.configured ? "••••••••••••••••" : "请输入所选服务商的 API Key"}
                  type="password"
                  value={apiKey}
                />
              </label>

              <section className="mt-3 rounded-2xl border border-violet-300/10 bg-violet-400/[0.04] p-4">
                <p className="cockpit-label">自动启用能力</p>
                <CapabilityList items={providerCards.find((item) => item.id === provider)?.description.split("、") ?? []} />
              </section>
            </>
          )}

          {(message || error) && (
            <p className={`mt-3 rounded-xl border px-3 py-2 text-[10px] ${error ? "border-red-300/15 bg-red-400/[0.06] text-red-200" : "border-cyan-300/15 bg-cyan-400/[0.06] text-cyan-100"}`}>
              {error || message}
            </p>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-black/20 px-5 py-3">
          <button className="rounded-xl border border-red-300/15 px-3 py-2 text-[10px] font-bold text-red-200 transition hover:bg-red-400/[0.08] disabled:opacity-30" disabled={busy || envActive} onClick={() => void clear()} type="button">
            {confirmClear ? "再次点击确认清除" : "切换到离线模式"}
          </button>
          <div className="flex gap-2">
            <button className="rounded-xl border border-white/10 px-4 py-2 text-[10px] font-bold text-slate-300 transition hover:bg-white/[0.05]" onClick={onClose} type="button">关闭</button>
            {!envActive && (
              <button className="rounded-xl border border-violet-300/20 bg-violet-400/[0.1] px-4 py-2 text-[10px] font-black text-violet-100 transition hover:bg-violet-400/[0.18] disabled:opacity-40" disabled={busy} onClick={() => void save()} type="button">
                {busy ? "保存中..." : "保存 API Key"}
              </button>
            )}
            <button className="rounded-xl border border-cyan-300/20 bg-gradient-to-r from-violet-500/70 to-cyan-500/50 px-4 py-2 text-[10px] font-black text-white transition hover:scale-[1.02]" onClick={() => void window.speakCoachAPI.restartApp()} type="button">重启并应用</button>
          </div>
        </footer>
      </GlassCard>
    </div>
  );
}

function CapabilityList({ items }: { items: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[9px] font-bold text-slate-300" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}
