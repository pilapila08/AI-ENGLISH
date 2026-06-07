interface RecorderBarProps {
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
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function RecorderBar(props: RecorderBarProps) {
  const processing = props.isBusy || props.isVoiceProcessing;
  const status = props.recording
    ? `录音中 ${formatTime(props.elapsedSeconds)}`
    : props.isVoiceProcessing
      ? "转写与回复中"
      : props.isBusy
        ? "AI 生成中"
        : props.isActive
          ? "可输入文字或一键语音"
          : "请先开始练习";

  return (
    <footer className="app-recorder-enter fixed inset-x-3 bottom-3 z-30 mx-auto max-w-[1600px] rounded-2xl border border-white/80 bg-white/95 p-2.5 shadow-2xl shadow-slate-300/60 backdrop-blur-xl">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <span className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold ${
          props.recording ? "bg-red-50 text-red-600" : processing ? "bg-violet-50 text-brand" : "bg-emerald-50 text-emerald-700"
        }`}>
          <span className={`size-2 rounded-full ${props.recording || processing ? "animate-pulse" : ""} ${props.recording ? "bg-red-500" : processing ? "bg-violet-500" : "bg-emerald-500"}`} />
          {status}
        </span>
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-50 disabled:opacity-60"
          disabled={!props.isActive || processing || props.recording}
          onChange={(event) => props.onTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && props.isActive && props.text.trim() && !processing) {
              props.onAction("submit-text");
            }
          }}
          placeholder={props.isActive ? "输入英文回答，或使用一键语音输入" : "请先开始练习"}
          value={props.text}
        />
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Action label="开始练习" primary disabled={props.isActive || processing} onClick={() => props.onAction("start-practice")} />
          <Action label="开始录音" disabled={!props.isActive || processing || props.recording} onClick={props.onStartVoiceInput} />
          <Action label="停止并发送" danger disabled={!props.recording || props.isVoiceProcessing} onClick={props.onStopVoiceInputAndSend} />
          <Action label={props.isBusy ? "生成中" : "提交文本"} disabled={!props.isActive || !props.text.trim() || processing || props.recording} onClick={() => props.onAction("submit-text")} />
          <Action label="结束练习" disabled={!props.isActive || processing || props.recording} onClick={() => props.onAction("end-practice")} />
        </div>
      </div>
      {props.voiceError && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] text-amber-700">
          {props.voiceError} 你可以重新录音，或直接使用文本输入。
        </p>
      )}
    </footer>
  );
}

function Action({ label, disabled, onClick, primary, danger }: { label: string; disabled: boolean; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button
      className={`rounded-lg border px-3 py-2.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${
        primary ? "border-brand bg-brand text-white shadow-md shadow-violet-200" : danger ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-600 hover:bg-violet-50"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
