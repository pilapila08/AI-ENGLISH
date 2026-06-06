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

const severityStyles: Record<CorrectionItem["severity"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-sky-100 text-sky-700",
};

function FeedbackPanel({
  correctionMode,
  corrections,
  score,
}: FeedbackPanelProps) {
  const visibleCorrections = corrections.slice(-5).reverse();

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
          <span className="text-xs text-slate-400">实时估算</span>
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

      <p className="mt-2 text-[11px] leading-4 text-slate-400">
        当前发音分为基于 ASR 文本完整度的清晰度估算，并非声学级发音测评。
      </p>

      <section className="mt-5 min-h-0 flex-1">
        <h3 className="text-sm font-semibold">纠错建议</h3>
        <div className="mt-3 max-h-[390px] space-y-3 overflow-y-auto pr-1">
          {correctionMode === "immersive" ? (
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 text-center">
              <p className="text-sm font-semibold text-brand">当前为沉浸模式</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                对话过程中不会打断你，用户表达将在课后统一分析。
              </p>
            </div>
          ) : visibleCorrections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-600">暂未发现需要纠正的问题</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                提交英文文本后，建议会显示在这里。
              </p>
            </div>
          ) : (
            visibleCorrections.map((item) => (
              <article
                className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
                key={item.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-amber-800">
                    {item.errorType}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${severityStyles[item.severity]}`}
                  >
                    {item.severity}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-400">原句</p>
                <p className="mt-1 text-sm text-slate-500 line-through">
                  {item.original}
                </p>
                <p className="mt-3 text-xs font-semibold text-slate-400">修改</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {item.corrected}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  {item.explanation}
                </p>
                <div className="mt-3 rounded-xl bg-white/80 p-3">
                  <p className="text-[11px] font-semibold text-brand">更自然表达</p>
                  <p className="mt-1 text-xs leading-5 text-slate-700">
                    {item.betterExpression}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}

export default FeedbackPanel;
