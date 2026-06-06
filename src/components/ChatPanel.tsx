import type { ChatMessage, Scenario } from "../types";

interface ChatPanelProps {
  scenario: Scenario;
  messages: ChatMessage[];
  isBusy?: boolean;
  autoSpeak: boolean;
  speaking: boolean;
  speechSupported: boolean;
  speechError: string;
  speechWarning: string;
  speechMode: "mimo" | "unavailable";
  onAutoSpeakChange: (enabled: boolean) => void;
  onSpeakMessage: (text: string) => void;
  onStopSpeaking: () => void;
}

function ChatPanel({
  scenario,
  messages,
  isBusy = false,
  autoSpeak,
  speaking,
  speechSupported,
  speechError,
  speechWarning,
  speechMode,
  onAutoSpeakChange,
  onSpeakMessage,
  onStopSpeaking,
}: ChatPanelProps) {
  return (
    <section className="flex min-h-0 flex-col rounded-3xl bg-white shadow-panel">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            当前练习
          </p>
          <h2 className="mt-1 text-xl font-semibold">{scenario.name}</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            {scenario.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-brand">
            <input
              checked={autoSpeak}
              className="accent-violet-600"
              disabled={!speechSupported}
              onChange={(event) => onAutoSpeakChange(event.target.checked)}
              type="checkbox"
            />
            自动朗读 AI 回复
          </label>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-brand">
            {scenario.aiRole}
          </span>
          <button
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!speaking}
            onClick={onStopSpeaking}
            type="button"
          >
            停止朗读
          </button>
        </div>
      </header>

      <div className="border-b border-slate-100 px-6 py-2 text-xs">
        {speaking ? (
          <span className="font-medium text-violet-600">正在朗读 AI 回复...</span>
        ) : speechSupported ? (
          <span className="text-slate-400">
            MiMo TTS 已就绪 · 分句并行合成
          </span>
        ) : (
          <span className="text-amber-600">当前环境不支持语音朗读</span>
        )}
        {speechError && (
          <span className="ml-3 text-amber-600">{speechError}</span>
        )}
        <span className="ml-3 text-slate-400">
          {speechMode === "mimo" ? "MiMo V2.5 TTS" : "MiMo TTS 不可用"}
        </span>
        {speechWarning && (
          <span className="ml-3 text-amber-600">{speechWarning}</span>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="grid h-full min-h-72 place-items-center">
            <div className="max-w-sm text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-100 font-bold text-brand">
                AI
              </div>
              <h3 className="mt-4 text-base font-semibold">准备开始对话</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                点击底部“开始练习”，AI 将根据当前场景发送开场白。
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              key={message.id}
            >
              {!isUser && (
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-xs font-bold text-white">
                  AI
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  isUser
                    ? "rounded-br-md bg-slate-900 text-white"
                    : "rounded-bl-md bg-slate-100 text-slate-700"
                }`}
              >
                <p>{message.content}</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    {isUser ? "你" : scenario.aiRole}
                  </p>
                  {!isUser && (
                    <button
                      aria-label="朗读此条 AI 回复"
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-brand transition hover:bg-violet-100 disabled:opacity-40"
                      disabled={!speechSupported}
                      onClick={() => onSpeakMessage(message.content)}
                      type="button"
                    >
                      播放
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isBusy && messages.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-bold text-brand">
              AI
            </div>
            正在思考下一句追问...
          </div>
        )}
      </div>
    </section>
  );
}

export default ChatPanel;
