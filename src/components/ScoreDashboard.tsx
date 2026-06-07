import type { ScoreResult } from "../types";

interface ScoreDashboardProps {
  score: ScoreResult;
  compact?: boolean;
}

const metrics: Array<{
  key: keyof Omit<ScoreResult, "overallScore">;
  label: string;
  short: string;
}> = [
  { key: "pronunciationScore", label: "发音清晰度", short: "发音" },
  { key: "grammarScore", label: "语法准确度", short: "语法" },
  { key: "fluencyScore", label: "表达流利度", short: "流利" },
  { key: "vocabularyScore", label: "词汇丰富度", short: "词汇" },
  { key: "naturalnessScore", label: "表达自然度", short: "自然" },
  { key: "contextAppropriatenessScore", label: "语境适切度", short: "语境" },
];

export default function ScoreDashboard({
  score,
  compact = false,
}: ScoreDashboardProps) {
  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.025] to-violet-500/[0.08] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="cockpit-label">当前表现</p>
          <p className="mt-1 text-xs text-slate-400">实时能力评估</p>
        </div>
        <div className="score-orbit grid size-16 shrink-0 place-items-center rounded-full border border-cyan-300/25 bg-slate-950/60">
          <div className="text-center">
            <p className="text-2xl font-black leading-none text-white">
              {score.overallScore}
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-cyan-300">
              综合评分
            </p>
          </div>
        </div>
      </div>
      <div className={`mt-3 grid ${compact ? "grid-cols-2" : "grid-cols-2"} gap-2`}>
        {metrics.map(({ key, label, short }) => (
          <div className="rounded-xl border border-white/[0.06] bg-black/15 p-2" key={key}>
            <div className="flex items-center justify-between text-[9px]">
              <span className="truncate text-slate-400" title={label}>
                {short} · {label}
              </span>
              <strong className="text-cyan-200">{score[key]}</strong>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-400 to-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.45)] transition-all duration-700"
                style={{ width: `${score[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
