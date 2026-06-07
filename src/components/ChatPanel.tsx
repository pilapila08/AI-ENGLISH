import { useEffect, useRef } from "react";
import type {
  ChatMessage,
  EnglishAccent,
  EnglishTTSVoice,
  Scenario,
} from "../types";
import SpeechOptionPicker from "./SpeechOptionPicker";

const accentOptions: Array<{
  value: EnglishAccent;
  label: string;
  description: string;
}> = [
  { value: "neutral", label: "中性国际英语", description: "清晰、自然，适合通用口语练习" },
  { value: "american", label: "美式英语", description: "自然的通用美式发音风格" },
  { value: "british", label: "英式英语", description: "清晰的标准英式发音风格" },
  { value: "australian", label: "澳式英语", description: "自然的澳大利亚英语风格" },
  { value: "irish", label: "爱尔兰英语", description: "自然的爱尔兰英语风格" },
  { value: "africanAmerican", label: "非裔美国英语", description: "自然、尊重的非裔美国英语风格" },
  { value: "indian", label: "印度英语", description: "清晰自然的印度英语风格" },
  { value: "eastAsian", label: "东亚英语风格", description: "轻微东亚影响的清晰英语风格" },
];

const voiceOptions: Array<{
  value: EnglishTTSVoice;
  label: string;
  description: string;
  badge: string;
}> = [
  { value: "Chloe", label: "Chloe", description: "明亮清晰，适合日常陪练", badge: "女声" },
  { value: "Mia", label: "Mia", description: "自然柔和，适合沉浸对话", badge: "女声" },
  { value: "Milo", label: "Milo", description: "年轻自然，适合轻松交流", badge: "男声" },
  { value: "Dean", label: "Dean", description: "沉稳清晰，适合商务场景", badge: "男声" },
];

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
  accent: EnglishAccent;
  voice: EnglishTTSVoice;
  onAccentChange: (accent: EnglishAccent) => void;
  onVoiceChange: (voice: EnglishTTSVoice) => void;
  onAutoSpeakChange: (enabled: boolean) => void;
  onSpeakMessage: (text: string) => void;
  onStopSpeaking: () => void;
}

export default function ChatPanel(props: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [props.messages, props.isBusy]);

  const ttsStatus = props.speaking
    ? "朗读中"
    : props.speechMode === "mimo"
      ? "TTS 就绪"
      : "TTS 不可用";

  return (
    <section className="app-panel-center flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-panel">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <h2 className="truncate text-base font-black">{props.scenario.name}</h2>
            <span className="truncate text-xs text-slate-400">· {props.scenario.aiRole}</span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-400">{props.scenario.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${props.speaking ? "bg-violet-100 text-brand" : "bg-slate-100 text-slate-500"}`}>
            {ttsStatus}
          </span>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1.5 text-[11px] font-bold text-brand">
            <input
              checked={props.autoSpeak}
              className="accent-violet-600"
              disabled={!props.speechSupported}
              onChange={(event) => props.onAutoSpeakChange(event.target.checked)}
              type="checkbox"
            />
            自动朗读
          </label>
          {props.speaking && (
            <button className="rounded-full border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-500" onClick={props.onStopSpeaking} type="button">
              停止
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/80 px-4 py-2.5 sm:grid-cols-2">
        <SpeechOptionPicker
          accent="violet"
          icon="ACC"
          label="口音训练"
          onChange={props.onAccentChange}
          options={accentOptions}
          value={props.accent}
        />
        <SpeechOptionPicker
          accent="cyan"
          icon="VOX"
          label="AI 音色"
          onChange={props.onVoiceChange}
          options={voiceOptions}
          value={props.voice}
        />
      </div>

      {(props.speechError || props.speechWarning) && (
        <p className="mx-4 mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] text-amber-700">
          {props.speechError || props.speechWarning}
        </p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto scroll-smooth px-4 py-4">
        {props.messages.length === 0 && (
          <div className="grid h-full min-h-48 place-items-center">
            <div className="max-w-xs text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-black text-white">AI</div>
              <h3 className="mt-3 text-sm font-bold">准备开始场景对话</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">点击底部“开始练习”，AI 将发送开场白。</p>
            </div>
          </div>
        )}
        {props.messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div className={`app-message flex gap-2 ${isUser ? "justify-end" : "justify-start"}`} key={message.id}>
              {!isUser && <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-black text-white">AI</div>}
              <div className={`flex max-w-[82%] flex-col ${isUser ? "items-end" : "items-start"}`}>
                <span className="mb-1 px-1 text-[10px] font-semibold text-slate-400">
                  {isUser ? (message.transcript ? "你的转写" : "你的回答") : props.scenario.aiRole}
                </span>
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-5 shadow-sm ${isUser ? "rounded-br-md bg-slate-900 text-white" : "rounded-bl-md border border-slate-100 bg-slate-50 text-slate-700"}`}>
                  <p>{message.content}</p>
                  {!isUser && (
                    <button className="mt-1.5 text-[10px] font-bold text-brand disabled:opacity-40" disabled={!props.speechSupported} onClick={() => props.onSpeakMessage(message.content)} type="button">
                      播放回复
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {props.isBusy && props.messages.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="grid size-8 place-items-center rounded-xl bg-violet-100 font-black text-brand">AI</div>
            <span className="size-1.5 animate-bounce rounded-full bg-violet-400" />
            <span className="size-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:120ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:240ms]" />
            正在生成回复
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
