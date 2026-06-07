import { useState } from "react";
import type { PracticeReport, ScoreResult } from "../types";

interface ReportViewProps {
  report: PracticeReport;
  onClose: () => void;
}

const scoreLabels: Array<[keyof Omit<ScoreResult, "overallScore">, string]> = [
  ["pronunciationScore", "发音清晰度估算"],
  ["grammarScore", "语法准确度"],
  ["fluencyScore", "表达流畅度"],
  ["vocabularyScore", "词汇丰富度"],
  ["naturalnessScore", "表达自然度"],
  ["contextAppropriatenessScore", "语境适切度"],
];

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
    <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel">
      <header className="flex flex-col gap-5 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Practice report</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{report.scenarioName} · 课后总结</h2>
          <p className="mt-2 text-sm text-slate-500">练习 {report.durationSeconds} 秒 · 完成 {report.dialogueTurns} 轮回答</p>
        </div>
        <div className="min-w-44 rounded-[28px] bg-gradient-to-br from-violet-600 to-indigo-600 px-8 py-5 text-center text-white shadow-xl shadow-violet-200">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-100">综合评分</p>
          <p className="mt-1 text-6xl font-black">{report.scores.overallScore}</p>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {scoreLabels.map(([key, label]) => (
          <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={key}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">{label}</span>
              <strong className="text-xl text-brand">{report.scores[key]}</strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${report.scores[key]}%` }} />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ListCard title="本次优点" items={report.strengths} style="border-emerald-100 bg-emerald-50/70 text-emerald-800" />
        <ListCard title="待改进点" items={report.weaknesses} style="border-amber-100 bg-amber-50/70 text-amber-800" />
        <ListCard title="推荐表达" items={report.recommendedExpressions} style="border-violet-100 bg-violet-50/70 text-violet-800" />
        <ListCard title="下次练习建议" items={report.nextPracticeSuggestions} style="border-sky-100 bg-sky-50/70 text-sky-800" />
      </div>

      <section className="mt-6 rounded-3xl border border-slate-100 p-5">
        <h3 className="font-bold">错误表达回顾</h3>
        {report.corrections.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">本次没有记录到典型错误。增加对话轮数后可获得更丰富的反馈。</p>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {report.corrections.map((item) => (
              <article className="rounded-2xl bg-slate-50 p-4 text-sm" key={item.id}>
                <p className="text-red-500 line-through">{item.original}</p>
                <p className="mt-1 font-bold text-emerald-700">{item.corrected}</p>
                <p className="mt-2 text-slate-500">{item.explanation}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h3 className="font-bold">学习卡片</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {report.studyCards.map((card, index) => (
            <article className="group min-h-40 rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-5 transition hover:-translate-y-1 hover:shadow-lg" key={`${card.front}-${index}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-brand">Card {index + 1}</p>
                <button
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand shadow-sm"
                  onClick={() => void copyCard(index, `${card.front}\n${card.back}`)}
                  type="button"
                >
                  {copied === index ? "已复制" : "复制"}
                </button>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">{card.front}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{card.back}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="mt-7 flex justify-end">
        <button className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200" onClick={onClose} type="button">返回</button>
      </footer>
    </section>
  );
}

function ListCard({ title, items, style }: { title: string; items: string[]; style: string }) {
  return (
    <section className={`rounded-3xl border p-5 ${style}`}>
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6">
        {items.map((item) => <li className="flex gap-2" key={item}><span>•</span><span>{item}</span></li>)}
      </ul>
    </section>
  );
}
