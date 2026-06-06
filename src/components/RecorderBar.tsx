interface RecorderBarProps {
  text: string;
  onTextChange: (value: string) => void;
  onAction: (action: string) => void;
}

const actions = [
  { id: "start-practice", label: "开始练习", primary: true },
  { id: "start-recording", label: "开始录音" },
  { id: "stop-recording", label: "停止录音" },
  { id: "submit-text", label: "提交文本" },
  { id: "end-practice", label: "结束练习" },
];

function RecorderBar({ text, onTextChange, onAction }: RecorderBarProps) {
  return (
    <footer className="rounded-3xl bg-white p-4 shadow-panel">
      <div className="flex flex-col gap-3 xl:flex-row">
        <input
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="输入英文回答，本阶段仅展示基础状态..."
          type="text"
          value={text}
        />
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              className={`rounded-2xl px-4 py-3 text-xs font-semibold transition ${
                action.primary
                  ? "bg-brand text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50"
              }`}
              key={action.id}
              onClick={() => onAction(action.id)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default RecorderBar;
