interface RecorderBarProps {
  text: string;
  isActive: boolean;
  isBusy: boolean;
  recording: boolean;
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

function RecorderBar({
  text,
  isActive,
  isBusy,
  recording,
  audioBlob,
  audioUrl,
  recordingError,
  isTranscribing,
  transcript,
  transcriptionError,
  transcriptionWarning,
  onTextChange,
  onAction,
  onStartRecording,
  onStopRecording,
  onTranscribe,
}: RecorderBarProps) {
  return (
    <footer className="rounded-3xl bg-white p-4 shadow-panel">
      <div className="flex flex-col gap-3 xl:flex-row">
        <input
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isActive || isBusy || isTranscribing}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && isActive && text.trim() && !isBusy) {
              onAction("submit-text");
            }
          }}
          placeholder={isActive ? "输入英文回答并提交..." : "请先点击开始练习"}
          type="text"
          value={text}
        />

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-2xl bg-brand px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isActive || isBusy}
            onClick={() => onAction("start-practice")}
            type="button"
          >
            开始练习
          </button>
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!isActive || isBusy || recording || isTranscribing}
            onClick={onStartRecording}
            type="button"
          >
            开始录音
          </button>
          <button
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!isActive || !recording}
            onClick={onStopRecording}
            type="button"
          >
            停止录音
          </button>
          <button
            className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-semibold text-brand transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!isActive || !audioBlob || recording || isTranscribing}
            onClick={onTranscribe}
            type="button"
          >
            {isTranscribing ? "转写中..." : "转写音频"}
          </button>
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!isActive || !text.trim() || isBusy || isTranscribing}
            onClick={() => onAction("submit-text")}
            type="button"
          >
            {isBusy ? "回复中..." : "提交文本"}
          </button>
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!isActive || isBusy || isTranscribing}
            onClick={() => onAction("end-practice")}
            type="button"
          >
            结束练习
          </button>
        </div>
      </div>

      {(recording ||
        audioUrl ||
        recordingError ||
        transcript ||
        transcriptionError ||
        transcriptionWarning) && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          {recording && (
            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
              <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
              正在录音...
            </div>
          )}
          {!recording && audioUrl && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <audio className="h-9 flex-1" controls src={audioUrl}>
                您的浏览器不支持音频预览。
              </audio>
              <span className="text-xs text-slate-400">
                已录制{" "}
                {(audioBlob?.size ?? 0) / 1024 < 1
                  ? "<1"
                  : Math.round((audioBlob?.size ?? 0) / 1024)}{" "}
                KB
              </span>
            </div>
          )}
          {transcript && (
            <p className="text-sm text-emerald-700">
              转写成功：文本已填入输入框，可以继续手动修改。
            </p>
          )}
          {recordingError && (
            <p className="text-sm text-red-600">{recordingError}</p>
          )}
          {transcriptionError && (
            <p className="text-sm text-red-600">{transcriptionError}</p>
          )}
          {transcriptionWarning && (
            <p className="text-sm text-amber-700">{transcriptionWarning}</p>
          )}
        </div>
      )}
    </footer>
  );
}

export default RecorderBar;
