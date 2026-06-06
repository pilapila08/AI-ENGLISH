import type { CorrectionItem, CorrectionMode, ScoreResult } from "../types";

interface FeedbackPanelProps {
  correctionMode: CorrectionMode;
  corrections: CorrectionItem[];
  score: ScoreResult;
}

const scoreLabels: Array<{ key: keyof ScoreResult; label: string }> = [
  { key: "pronunciationScore", label: "发音" },
  { key: "grammarScore", label: "语法" },
  { key: "fluencyScore", label: "流利度" },
  { key: "vocabularyScore", label: "词汇" },
  { key: "naturalnessScore", label: "自然度" },
];

function FeedbackPanel({
  correctionMode,
  corrections,
  score,
}: FeedbackPanelProps) {
  return (
    <aside className="flex min-h-0 flex-col rounded-3xl bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Live feedback
          </p>
          <h2 className="mt-1 text-lg font-semibold">实时反馈</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {correctionMode}
        </span>
      </div>

      <section className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400">当前综合评分</p>
            <p className="mt-1 text-4xl font-bold">{score.overallScore}</p>
          </div>
          <span className="text-xs text-slate-400">Demo 占位</span>
        </div>
        <div className="mt-5 space-y-3">
          {scoreLabels.map(({ key, label }) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-300">{label}</span>
                <span>{score[key]}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-violet-400"
                  style={{ width: `${score[key]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 min-h-0 flex-1">
        <h3 className="text-sm font-semibold">纠错建议</h3>
        <div className="mt-3 space-y-3">
          {corrections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-600">等待练习内容</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                后续纠错建议与推荐表达会显示在这里。
              </p>
            </div>
          ) : (
            corrections.map((item) => (
              <div className="rounded-2xl bg-amber-50 p-4" key={item.id}>
                <p className="text-xs font-semibold text-amber-700">{item.errorType}</p>
                <p className="mt-2 text-sm text-slate-500 line-through">
                  {item.original}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">{item.corrected}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}

export default FeedbackPanel;
