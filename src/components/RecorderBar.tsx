interface RecorderBarProps {
  text: string;
  isActive: boolean;
  isBusy: boolean;
  recording: boolean;
  elapsedSeconds: number;
  audioBlob: Blob | null;
  audioUrl: string;
  recordingError: string;
  isTranscribing: boolean;
  transcript: string;
  transcriptionError: string;
  transcriptionWarning: string;
  onTextChange: (value: string) => void;
  onAction: (action: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTranscribe: () => void;
}

function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function RecorderBar(props: RecorderBarProps) {
  const status = props.recording
    ? `录音 ${formatTime(props.elapsedSeconds)}`
    : props.isTranscribing
      ? "转写中"
      : props.isBusy
        ? "AI 生成中"
        : props.isActive
          ? "练习中"
          : "待开始";
  const warning = props.recordingError || props.transcriptionError || props.transcriptionWarning;

  return (
    <footer className="app-recorder-enter fixed inset-x-3 bottom-3 z-30 mx-auto max-w-[1600px] rounded-2xl border border-white/80 bg-white/95 p-2.5 shadow-2xl shadow-slate-300/60 backdrop-blur-xl">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <span className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold ${
          props.recording ? "bg-red-50 text-red-600" : props.isBusy || props.isTranscribing ? "bg-violet-50 text-brand" : "bg-emerald-50 text-emerald-700"
        }`}>
          <span className={`size-2 rounded-full ${props.recording || props.isBusy || props.isTranscribing ? "animate-pulse" : ""} ${props.recording ? "bg-red-500" : props.isBusy || props.isTranscribing ? "bg-violet-500" : "bg-emerald-500"}`} />
          {status}
        </span>
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-50 disabled:opacity-60"
          disabled={!props.isActive || props.isBusy || props.isTranscribing || props.recording}
          onChange={(event) => props.onTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && props.isActive && props.text.trim() && !props.isBusy) props.onAction("submit-text");
          }}
          placeholder={props.isActive ? "输入或转写英文回答，按 Enter 提交" : "请先开始练习"}
          value={props.text}
        />
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Action label="开始练习" primary disabled={props.isActive || props.isBusy} onClick={() => props.onAction("start-practice")} />
          <Action label="录音" disabled={!props.isActive || props.isBusy || props.recording || props.isTranscribing} onClick={props.onStartRecording} />
          <Action label="停止" danger disabled={!props.recording} onClick={props.onStopRecording} />
          <Action label={props.isTranscribing ? "转写中" : "转写"} disabled={!props.isActive || !props.audioBlob || props.recording || props.isTranscribing || props.isBusy} onClick={props.onTranscribe} />
          <Action label={props.isBusy ? "生成中" : "提交"} disabled={!props.isActive || !props.text.trim() || props.isBusy || props.isTranscribing || props.recording} onClick={() => props.onAction("submit-text")} />
          <Action label="结束" disabled={!props.isActive || props.isBusy || props.isTranscribing || props.recording} onClick={() => props.onAction("end-practice")} />
        </div>
      </div>
      {(warning || props.transcript || (!props.recording && props.audioUrl)) && (
        <div className="mt-2 flex items-center gap-3 px-1 text-[11px]">
          {!props.recording && props.audioUrl && <audio className="h-7 max-w-64" controls src={props.audioUrl} />}
          {props.transcript && <span className="text-emerald-700">转写完成，可编辑后提交。</span>}
          {warning && <span className="truncate text-amber-700">{warning}</span>}
        </div>
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
