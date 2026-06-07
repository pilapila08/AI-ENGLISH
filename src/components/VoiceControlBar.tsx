import WaveformIndicator from "./WaveformIndicator";

interface VoiceControlBarProps {
  text: string;
  isActive: boolean;
  isBusy: boolean;
  isVoiceProcessing: boolean;
  recording: boolean;
  elapsedSeconds: number;
  voiceError: string;
  onTextChange: (value: string) => void;
  onAction: (action: string) => void;
  onStartVoiceInput: () => void;
  onStopVoiceInputAndSend: () => void;
}

function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
}

export default function VoiceControlBar(props: VoiceControlBarProps) {
  const processing = props.isBusy || props.isVoiceProcessing;
  const micLabel = props.recording
    ? "停止并发送"
    : processing
      ? "处理中..."
      : "开始说话";

  return (
    <footer className="voice-console app-recorder-enter fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[1800px]">
      <div className="grid items-center gap-3 px-3 py-2.5 lg:grid-cols-[auto_minmax(240px,1fr)_auto]">
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-violet-300/20 bg-violet-400/[0.08] px-3 py-2 text-[10px] font-black text-violet-100 transition hover:bg-violet-400/[0.15] disabled:cursor-not-allowed disabled:opacity-35"
            disabled={props.isActive || processing}
            onClick={() => props.onAction("start-practice")}
            type="button"
          >
            开始练习
          </button>
          <div className="hidden min-w-24 xl:block">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-600">
              语音信号
            </p>
            <WaveformIndicator active={props.recording} compact />
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <button
            className={`relative grid size-14 shrink-0 place-items-center rounded-full border text-[9px] font-black transition duration-300 disabled:cursor-not-allowed disabled:opacity-35 ${
              props.recording
                ? "pulse-ring border-red-300/50 bg-red-400/20 text-red-100 shadow-[0_0_30px_rgba(248,113,113,0.35)]"
                : processing
                  ? "border-violet-300/30 bg-violet-400/15 text-violet-100"
                  : "border-cyan-300/45 bg-gradient-to-br from-violet-500/50 to-cyan-400/30 text-white shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:scale-105"
            }`}
            disabled={!props.isActive || processing}
            onClick={
              props.recording
                ? props.onStopVoiceInputAndSend
                : props.onStartVoiceInput
            }
            title={micLabel}
            type="button"
          >
            {props.recording ? formatTime(props.elapsedSeconds) : processing ? "..." : "麦克风"}
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">
                {micLabel}
              </p>
              <p className="text-[9px] text-slate-600">
                {props.isActive ? "练习频道已开启" : "请先开始练习"}
              </p>
            </div>
            <div className="flex overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 focus-within:border-cyan-300/25">
              <input
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-600 disabled:opacity-40"
                disabled={!props.isActive || processing || props.recording}
                onChange={(event) => props.onTextChange(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    props.isActive &&
                    props.text.trim() &&
                    !processing
                  ) {
                    props.onAction("submit-text");
                  }
                }}
                placeholder="输入英文回答，或使用语音输入..."
                value={props.text}
              />
              <button
                className="border-l border-white/[0.07] px-3 text-[9px] font-black uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-300/[0.08] disabled:opacity-30"
                disabled={
                  !props.isActive ||
                  !props.text.trim() ||
                  processing ||
                  props.recording
                }
                onClick={() => props.onAction("submit-text")}
                type="button"
              >
                发送
              </button>
            </div>
          </div>
        </div>

        <button
          className="rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2 text-[10px] font-black text-amber-100 transition hover:border-amber-300/30 hover:bg-amber-300/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
          disabled={!props.isActive || processing || props.recording}
          onClick={() => props.onAction("end-practice")}
          type="button"
        >
          结束并生成报告
        </button>
      </div>
      {props.voiceError && (
        <p className="border-t border-amber-300/10 bg-amber-300/[0.05] px-4 py-1.5 text-center text-[10px] text-amber-200">
          {props.voiceError}
        </p>
      )}
    </footer>
  );
}
