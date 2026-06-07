import type { CorrectionMode } from "../types";
import StatusBadge from "./StatusBadge";

interface TopStatusBarProps {
  page: "practice" | "history";
  scenarioName: string;
  correctionMode: CorrectionMode;
  practiceStatus: "idle" | "active" | "analyzing" | "completed";
  offlineFallback: boolean;
  autoSpeak: boolean;
  speaking: boolean;
  onAutoSpeakChange: (enabled: boolean) => void;
  onNavigate: (page: "practice" | "history") => void;
}

export default function TopStatusBar(props: TopStatusBarProps) {
  const statusLabel = {
    idle: "准备就绪",
    active: "练习中",
    analyzing: "分析中",
    completed: "已完成",
  }[props.practiceStatus];

  return (
    <header className="cockpit-topbar app-enter mx-auto flex h-16 w-full max-w-[1800px] shrink-0 items-center justify-between gap-4 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-cyan-300/30 bg-gradient-to-br from-violet-600/90 via-blue-600/90 to-cyan-500/90 text-xs font-black text-white shadow-[0_0_24px_rgba(34,211,238,0.2)]"
          onClick={() => props.onNavigate("practice")}
          type="button"
        >
          SC
          <span className="absolute inset-x-1 bottom-0 h-px bg-cyan-200/80" />
        </button>
        <div className="min-w-0">
          <p className="gradient-text truncate text-base font-black tracking-tight">
            SpeakCoach AI
          </p>
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            在真实场景中练习英语
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 xl:flex">
        <StatusBadge tone="cyan">{props.scenarioName}</StatusBadge>
        <StatusBadge tone="violet">
          {{ immersive: "沉浸纠错", gentle: "轻度纠错", strict: "严格纠错" }[props.correctionMode]}
        </StatusBadge>
        <StatusBadge
          pulse={props.practiceStatus === "active" || props.practiceStatus === "analyzing"}
          tone={props.practiceStatus === "analyzing" ? "violet" : props.practiceStatus === "active" ? "green" : "slate"}
        >
          {statusLabel}
        </StatusBadge>
        <StatusBadge tone={props.offlineFallback ? "amber" : "green"}>
          {props.offlineFallback ? "模拟模式兜底" : "LLM / ASR 在线"}
        </StatusBadge>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-slate-300 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]">
          <input
            checked={props.autoSpeak}
            className="accent-cyan-400"
            onChange={(event) => props.onAutoSpeakChange(event.target.checked)}
            type="checkbox"
          />
          {props.speaking ? "正在朗读..." : "自动朗读"}
        </label>
        <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
          <NavButton
            active={props.page === "practice"}
            label="训练"
            onClick={() => props.onNavigate("practice")}
          />
          <NavButton
            active={props.page === "history"}
            label="报告"
            onClick={() => props.onNavigate("history")}
          />
        </div>
      </div>
    </header>
  );
}

function NavButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
        active
          ? "bg-gradient-to-r from-violet-500/80 to-cyan-500/70 text-white shadow-[0_0_15px_rgba(34,211,238,0.18)]"
          : "text-slate-500 hover:text-slate-200"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
