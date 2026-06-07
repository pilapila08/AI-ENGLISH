import type { CorrectionItem, CorrectionMode, ScoreResult } from "../types";

interface FeedbackPanelProps {
  correctionMode: CorrectionMode;
  corrections: CorrectionItem[];
  score: ScoreResult;
  isAnalyzing?: boolean;
}

const scores: Array<{ key: keyof Omit<ScoreResult, "overallScore">; label: string }> = [
  { key: "pronunciationScore", label: "发音清晰度" },
  { key: "grammarScore", label: "语法" },
  { key: "fluencyScore", label: "流利度" },
  { key: "vocabularyScore", label: "词汇" },
  { key: "naturalnessScore", label: "自然度" },
  { key: "contextAppropriatenessScore", label: "语境适切度" },
];

const severityStyle = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-sky-100 text-sky-700",
};

export default function FeedbackPanel({
  correctionMode,
  corrections,
  score,
  isAnalyzing = false,
}: FeedbackPanelProps) {
  const visible = corrections.slice(-5).reverse();
  const activeFeedback = correctionMode !== "immersive";

  return (
    <aside className={`app-panel-right flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white/95 p-3.5 shadow-panel ${
      activeFeedback ? "border-violet-200 ring-2 ring-violet-100/70" : "border-white/80"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Live feedback</p>
          <h2 className="mt-1 text-lg font-bold">实时反馈</h2>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
          activeFeedback ? "bg-violet-100 text-brand" : "bg-slate-100 text-slate-500"
        }`}>
          {correctionMode}
        </span>
      </div>

      <section className="mt-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-3.5 text-white shadow-lg shadow-slate-200">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400">当前综合评分</p>
            <p className="text-4xl font-black">{score.overallScore}</p>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-slate-300">实时估算</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          {scores.map(({ key, label }) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-slate-400">{label}</span>
                <span>{score[key]}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-violet-400" style={{ width: `${score[key]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">纠错建议</h3>
          {isAnalyzing && activeFeedback && <span className="size-2 animate-pulse rounded-full bg-violet-500" />}
        </div>
        <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-4 pr-1">
          {correctionMode === "immersive" ? (
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 text-center">
              <p className="text-sm font-bold text-brand">沉浸模式进行中</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">对话过程不会打断你，所有表达将在课后统一总结。</p>
            </div>
          ) : isAnalyzing ? (
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 text-center">
              <div className="mx-auto size-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <p className="mt-3 text-sm font-semibold text-brand">正在分析表达与语境...</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm font-semibold text-slate-600">暂未发现需要纠正的问题</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">提交英文回答后，实时建议会显示在这里。</p>
            </div>
          ) : (
            visible.map((item) => (
              <article className="rounded-xl border border-amber-100 bg-amber-50/80 p-3" key={item.id}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-800">{item.errorType}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityStyle[item.severity]}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500 line-through">{item.original}</p>
                <p className="mt-2 text-sm font-bold text-emerald-700">{item.corrected}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.explanation}</p>
                <div className="mt-3 rounded-xl border border-violet-100 bg-white p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand">推荐表达</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">{item.betterExpression}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      <p className="mt-3 text-[10px] leading-4 text-slate-400">发音分数当前为基于 ASR 文本完整度的清晰度估算。</p>
    </aside>
  );
}
