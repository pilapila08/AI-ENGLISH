import type { CorrectionItem, CorrectionMode, ScoreResult } from "../types";
import GlassCard from "./GlassCard";
import ScoreDashboard from "./ScoreDashboard";
import StatusBadge from "./StatusBadge";

interface CoachFeedbackPanelProps {
  correctionMode: CorrectionMode;
  corrections: CorrectionItem[];
  score: ScoreResult;
  isAnalyzing?: boolean;
}

const severityTone = {
  high: "border-red-300/15 bg-red-400/[0.06] text-red-200",
  medium: "border-amber-300/15 bg-amber-400/[0.06] text-amber-200",
  low: "border-cyan-300/15 bg-cyan-400/[0.06] text-cyan-200",
};

const severityLabels: Record<CorrectionItem["severity"], string> = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

export default function CoachFeedbackPanel({
  correctionMode,
  corrections,
  score,
  isAnalyzing = false,
}: CoachFeedbackPanelProps) {
  const visible = corrections.slice(-5).reverse();

  return (
    <GlassCard
      as="aside"
      className="app-panel-right flex min-h-0 flex-col overflow-hidden p-3"
      glow="violet"
    >
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="cockpit-label">教练观察面板</p>
          <h2 className="mt-1 text-sm font-black text-white">实时反馈</h2>
        </div>
        <StatusBadge
          pulse={isAnalyzing}
          tone={correctionMode === "immersive" ? "slate" : "violet"}
        >
          {{ immersive: "沉浸", gentle: "轻度", strict: "严格" }[correctionMode]}
        </StatusBadge>
      </div>

      <div className="mt-3">
        <ScoreDashboard compact score={score} />
      </div>

      <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <p className="cockpit-label">纠错动态</p>
          <span className="text-[9px] text-slate-600">{visible.length} 条建议</span>
        </div>
        <div className="cockpit-scroll mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {correctionMode === "immersive" ? (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-violet-300/15 bg-violet-400/[0.045] p-5 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-full border border-violet-300/20 bg-violet-400/10 text-xs font-black text-violet-200">
                  FCS
                </span>
                <p className="mt-4 text-sm font-black text-white">专注表达，自然开口</p>
                <p className="mt-2 text-[10px] leading-5 text-slate-400">
                  当前为沉浸模式，反馈将在练习结束后统一展示。
                </p>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] p-5 text-center">
              <div className="mx-auto size-6 animate-spin rounded-full border-2 border-cyan-300/15 border-t-cyan-300" />
              <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-cyan-200">
                正在分析表达...
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
              <p className="text-xs font-bold text-slate-300">暂无纠错建议</p>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                提交英文回答后，教练会开始分析你的表达。
              </p>
            </div>
          ) : (
            visible.map((item, index) => (
              <article
                className={`app-message rounded-2xl border p-3 ${severityTone[item.severity]}`}
                key={item.id}
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[9px] font-black uppercase tracking-wider">
                    {item.errorType}
                  </p>
                  <span className="rounded-full border border-current/15 px-1.5 py-0.5 text-[8px] font-black uppercase">
                    {severityLabels[item.severity]}
                  </span>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-slate-500 line-through">
                  {item.original}
                </p>
                <p className="mt-1.5 text-xs font-bold leading-5 text-slate-100">
                  {item.corrected}
                </p>
                <p className="mt-2 text-[10px] leading-4 text-slate-400">
                  {item.explanation}
                </p>
                <div className="mt-2 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06] p-2.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-emerald-300">
                    更自然的表达
                  </p>
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-emerald-50">
                    {item.betterExpression}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <p className="mt-2 border-t border-white/[0.05] pt-2 text-[8px] leading-4 text-slate-600">
        当前发音评分基于 ASR 转写清晰度估算，并非音素级声学评测。
      </p>
    </GlassCard>
  );
}
