import { useState } from "react";
import type { PracticeReport } from "../types";
import GlassCard from "./GlassCard";
import ScoreDashboard from "./ScoreDashboard";
import StatusBadge from "./StatusBadge";

interface ReportViewProps {
  report: PracticeReport;
  onClose: () => void;
}

const severityLabels = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
} as const;

export default function ReportView({ report, onClose }: ReportViewProps) {
  const [copied, setCopied] = useState<number | null>(null);

  const copyCard = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      window.setTimeout(() => setCopied(null), 1500);
    } catch (error) {
      console.warn("[ReportView] Failed to copy study card.", error);
    }
  };

  return (
    <section className="space-y-3 pb-4">
      <GlassCard className="relative overflow-hidden p-5" glow="cyan">
        <div className="absolute -right-20 -top-24 size-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <header className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="green">练习已完成</StatusBadge>
              <StatusBadge tone="cyan">训练 {report.durationSeconds} 秒</StatusBadge>
              <StatusBadge tone="violet">{report.dialogueTurns} 轮对话</StatusBadge>
            </div>
            <p className="cockpit-label mt-5">课后训练报告</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
              {report.scenarioName}
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-400">
              基于对话语境、纠错建议与可量化表达特征生成的训练分析。
            </p>
          </div>
          <div className="score-orbit grid size-36 shrink-0 place-items-center rounded-full border border-cyan-300/25 bg-slate-950/70 shadow-[0_0_50px_rgba(34,211,238,0.13)]">
            <div className="text-center">
              <p className="text-6xl font-black leading-none text-white">
                {report.scores.overallScore}
              </p>
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">
                综合评分
              </p>
            </div>
          </div>
        </header>
      </GlassCard>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-4" glow="violet">
          <ScoreDashboard score={report.scores} />
        </GlassCard>
        <div className="grid gap-3 sm:grid-cols-2">
          <AnalysisList
            items={report.strengths}
            label="本次优点"
            tone="green"
          />
          <AnalysisList
            items={report.weaknesses}
            label="待改进点"
            tone="amber"
          />
          <AnalysisList
            items={report.recommendedExpressions}
            label="推荐表达"
            tone="cyan"
          />
          <AnalysisList
            items={report.nextPracticeSuggestions}
            label="下次练习建议"
            tone="violet"
          />
        </div>
      </div>

      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="cockpit-label">纠错记录</p>
            <h3 className="mt-1 text-sm font-black text-white">表达复盘</h3>
          </div>
          <StatusBadge tone="amber">{report.corrections.length} 条发现</StatusBadge>
        </div>
        {report.corrections.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center text-xs text-slate-500">
            本次练习未记录到典型表达错误。
          </p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {report.corrections.map((item) => (
              <article
                className="rounded-2xl border border-amber-300/10 bg-amber-400/[0.04] p-4"
                key={item.id}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-wider text-amber-300">
                    {item.errorType}
                  </p>
                  <span className="rounded-full border border-amber-300/15 px-2 py-0.5 text-[8px] font-black uppercase text-amber-200">
                    {severityLabels[item.severity]}
                  </span>
                </div>
                <p className="mt-3 text-xs text-red-300/70 line-through">
                  {item.original}
                </p>
                <p className="mt-2 text-xs font-bold text-emerald-200">
                  {item.corrected}
                </p>
                <p className="mt-2 text-[10px] leading-5 text-slate-400">
                  {item.explanation}
                </p>
              </article>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4" glow="cyan">
        <div className="flex items-center justify-between">
          <div>
            <p className="cockpit-label">学习卡片</p>
            <h3 className="mt-1 text-sm font-black text-white">复习卡组</h3>
          </div>
          <StatusBadge tone="cyan">{report.studyCards.length} 张卡片</StatusBadge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {report.studyCards.map((card, index) => (
            <article
              className="group min-h-40 rounded-2xl border border-cyan-300/10 bg-gradient-to-br from-cyan-400/[0.06] to-violet-500/[0.04] p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_0_25px_rgba(34,211,238,0.1)]"
              key={`${card.front}-${index}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">
                  卡片 {String(index + 1).padStart(2, "0")}
                </p>
                <button
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold text-slate-300 transition hover:text-cyan-200"
                  onClick={() => void copyCard(index, `${card.front}\n${card.back}`)}
                  type="button"
                >
                  {copied === index ? "已复制" : "复制"}
                </button>
              </div>
              <p className="mt-4 text-xs font-bold text-slate-200">{card.front}</p>
              <p className="mt-3 whitespace-pre-line text-[11px] leading-5 text-slate-400">
                {card.back}
              </p>
            </article>
          ))}
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <button
          className="rounded-xl border border-cyan-300/20 bg-gradient-to-r from-violet-500/70 to-cyan-500/50 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_24px_rgba(34,211,238,0.15)] transition hover:scale-[1.02]"
          onClick={onClose}
          type="button"
        >
          返回训练舱
        </button>
      </div>
    </section>
  );
}

function AnalysisList({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "green" | "amber" | "cyan" | "violet";
}) {
  const styles = {
    green: "border-emerald-300/10 bg-emerald-400/[0.045] text-emerald-300",
    amber: "border-amber-300/10 bg-amber-400/[0.045] text-amber-300",
    cyan: "border-cyan-300/10 bg-cyan-400/[0.045] text-cyan-300",
    violet: "border-violet-300/10 bg-violet-400/[0.045] text-violet-300",
  };

  return (
    <section className={`rounded-2xl border p-4 ${styles[tone]}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.18em]">{label}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li className="flex gap-2 text-[10px] leading-5 text-slate-300" key={item}>
            <span className="font-black text-current">0{index + 1}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
