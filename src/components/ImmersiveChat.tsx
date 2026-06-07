import { useEffect, useRef } from "react";
import type {
  ChatMessage,
  EnglishAccent,
  EnglishTTSVoice,
  Scenario,
} from "../types";
import GlassCard from "./GlassCard";
import SpeechOptionPicker from "./SpeechOptionPicker";
import StatusBadge from "./StatusBadge";
import WaveformIndicator from "./WaveformIndicator";

const accentOptions: Array<{
  value: EnglishAccent;
  label: string;
  description: string;
}> = [
  { value: "neutral", label: "国际标准口音", description: "清晰、适合学习者的英语发音" },
  { value: "american", label: "美式英语", description: "自然的通用美式发音" },
  { value: "british", label: "英式英语", description: "清晰的标准英式发音" },
  { value: "australian", label: "澳式英语", description: "自然的澳大利亚英语发音" },
  { value: "irish", label: "爱尔兰英语", description: "自然的爱尔兰英语发音" },
  { value: "africanAmerican", label: "非裔美式英语", description: "自然、尊重语境的表达风格" },
  { value: "indian", label: "印度英语", description: "清晰自然的印度英语发音" },
  { value: "eastAsian", label: "东亚英语", description: "带轻微东亚特征的英语发音" },
];

const voiceOptions: Array<{
  value: EnglishTTSVoice;
  label: string;
  description: string;
  badge: string;
}> = [
  { value: "Chloe", label: "Chloe", description: "明亮清晰", badge: "女声" },
  { value: "Mia", label: "Mia", description: "自然温和", badge: "女声" },
  { value: "Milo", label: "Milo", description: "年轻健谈", badge: "男声" },
  { value: "Dean", label: "Dean", description: "沉稳专业", badge: "男声" },
];

interface ImmersiveChatProps {
  scenario: Scenario;
  messages: ChatMessage[];
  isActive: boolean;
  isBusy: boolean;
  isVoiceProcessing: boolean;
  recording: boolean;
  speaking: boolean;
  speechSupported: boolean;
  accent: EnglishAccent;
  voice: EnglishTTSVoice;
  speechError: string;
  speechWarning: string;
  onAccentChange: (accent: EnglishAccent) => void;
  onVoiceChange: (voice: EnglishTTSVoice) => void;
  onSpeakMessage: (text: string) => void;
  onStopSpeaking: () => void;
}

export default function ImmersiveChat(props: ImmersiveChatProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [props.messages, props.isBusy, props.isVoiceProcessing]);

  return (
    <GlassCard
      className="app-panel-center flex min-h-0 flex-col overflow-hidden"
      glow="cyan"
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-300 opacity-30" />
              <span className="relative inline-flex size-2.5 rounded-full bg-cyan-300" />
            </span>
            <p className="cockpit-label">模拟对话频道</p>
            <StatusBadge tone="cyan">{props.scenario.aiRole}</StatusBadge>
          </div>
          <h2 className="mt-1 truncate text-sm font-black text-white">
            {props.scenario.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {props.speaking && (
            <button
              className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-[10px] font-bold text-cyan-200 transition hover:bg-cyan-300/[0.15]"
              onClick={props.onStopSpeaking}
              type="button"
            >
              停止朗读
            </button>
          )}
          <WaveformIndicator active={props.speaking} compact />
        </div>
      </header>

      <div className="grid gap-2 border-b border-white/[0.06] bg-black/15 px-4 py-2 sm:grid-cols-2">
        <SpeechOptionPicker
          accent="violet"
          icon="音"
          label="教练口音"
          onChange={props.onAccentChange}
          options={accentOptions}
          value={props.accent}
        />
        <SpeechOptionPicker
          accent="cyan"
          icon="声"
          label="教练音色"
          onChange={props.onVoiceChange}
          options={voiceOptions}
          value={props.voice}
        />
      </div>

      {(props.speechError || props.speechWarning) && (
        <p className="mx-4 mt-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2 text-[10px] text-amber-200">
          {props.speechError || props.speechWarning}
        </p>
      )}

      <div className="cockpit-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {props.messages.length === 0 && (
          <WelcomeState scenario={props.scenario} />
        )}
        {props.messages.map((message, index) =>
          message.role === "assistant" ? (
            <CoachCard
              key={message.id}
              message={message}
              onSpeak={props.onSpeakMessage}
              scenario={props.scenario}
              speechSupported={props.speechSupported}
              step={index + 1}
            />
          ) : (
            <TranscriptCard key={message.id} message={message} step={index + 1} />
          ),
        )}
        {(props.isBusy || props.isVoiceProcessing) && (
          <div className="app-message flex items-center gap-3 rounded-2xl border border-violet-300/15 bg-violet-400/[0.05] px-4 py-3">
            <div className="grid size-9 place-items-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-[10px] font-black text-violet-200">
              AI
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                {props.isVoiceProcessing ? "正在转写..." : "教练正在思考..."}
              </p>
              <WaveformIndicator active compact />
            </div>
          </div>
        )}
        {props.recording && (
          <div className="sticky bottom-0 rounded-2xl border border-cyan-300/20 bg-slate-950/85 px-4 py-3 shadow-[0_0_30px_rgba(34,211,238,0.12)] backdrop-blur-xl">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
              正在聆听你的语音
            </p>
            <WaveformIndicator active />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </GlassCard>
  );
}

function WelcomeState({ scenario }: { scenario: Scenario }) {
  return (
    <div className="grid min-h-[360px] place-items-center">
      <div className="max-w-md text-center">
        <div className="pulse-ring mx-auto grid size-20 place-items-center rounded-full border border-cyan-300/25 bg-gradient-to-br from-violet-500/20 to-cyan-400/10">
          <span className="text-lg font-black text-cyan-100">AI</span>
        </div>
        <p className="cockpit-label mt-6">训练舱准备就绪</p>
        <h3 className="mt-2 text-2xl font-black text-white">
          进入“{scenario.name}”模拟训练
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-xs leading-6 text-slate-400">
          开始练习后自然表达即可。AI 教练会持续推进场景，并分析你的每次回答。
        </p>
      </div>
    </div>
  );
}

function CoachCard({
  message,
  onSpeak,
  scenario,
  speechSupported,
  step,
}: {
  message: ChatMessage;
  onSpeak: (text: string) => void;
  scenario: Scenario;
  speechSupported: boolean;
  step: number;
}) {
  return (
    <article className="app-message relative overflow-hidden rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.09] via-white/[0.025] to-transparent p-4">
      <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg border border-violet-300/25 bg-violet-500/15 text-[9px] font-black text-violet-100">
            AI
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-300">
              教练回复 · {String(step).padStart(2, "0")}
            </p>
            <p className="mt-0.5 text-[9px] text-slate-500">{scenario.aiRole}</p>
          </div>
        </div>
        <button
          className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-[9px] font-bold text-slate-400 transition hover:border-cyan-300/25 hover:text-cyan-200 disabled:opacity-30"
          disabled={!speechSupported}
          onClick={() => onSpeak(message.content)}
          type="button"
        >
          播放语音
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-100">{message.content}</p>
    </article>
  );
}

function TranscriptCard({ message, step }: { message: ChatMessage; step: number }) {
  return (
    <article className="app-message ml-auto max-w-[88%] rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.07] to-blue-500/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">
          {message.transcript ? "语音转写" : "手动输入"} ·{" "}
          {String(step).padStart(2, "0")}
        </p>
        <span className="text-[9px] text-slate-600">学习者</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-cyan-50">{message.content}</p>
    </article>
  );
}
