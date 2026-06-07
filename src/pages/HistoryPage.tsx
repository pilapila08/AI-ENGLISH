import { useCallback, useEffect, useState } from "react";
import ReportView from "../components/ReportView";
import type { HistoryRecord, HistorySummary } from "../types";

interface HistoryPageProps {
  onBack: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export default function HistoryPage({ onBack }: HistoryPageProps) {
  const [history, setHistory] = useState<HistorySummary[]>([]);
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setHistory(await window.speakCoachAPI.listHistory());
    } catch (loadError) {
      console.error("[HistoryPage] Failed to load history:", loadError);
      setError("历史记录加载失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const openDetail = async (sessionId: string) => {
    setError("");

    try {
      const detail = await window.speakCoachAPI.getHistoryDetail(sessionId);

      if (!detail) {
        setError("未找到这条练习记录。");
        return;
      }

      setSelected(detail);
    } catch (detailError) {
      console.error("[HistoryPage] Failed to load history detail:", detailError);
      setError("完整报告加载失败，请稍后重试。");
    }
  };

  if (selected) {
    return (
      <main className="min-h-screen bg-mist p-5 text-ink">
        <div className="mx-auto max-w-[1400px]">
          <ReportView report={selected.report} onClose={() => setSelected(null)} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mist p-5 text-ink">
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              Local practice archive
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">历史练习记录</h1>
            <p className="mt-2 text-sm text-slate-500">
              回顾每次练习的评分、对话轮数与完整课后报告。
            </p>
          </div>
          <button
            className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200"
            onClick={onBack}
            type="button"
          >
            返回练习
          </button>
        </header>

        {error && (
          <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {isLoading ? (
          <section className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-panel">
            正在加载历史记录...
          </section>
        ) : history.length === 0 ? (
          <section className="rounded-3xl bg-white p-10 text-center shadow-panel">
            <p className="text-lg font-bold">还没有历史记录</p>
            <p className="mt-2 text-sm text-slate-500">
              完成一次练习并生成报告后，记录会自动保存在本地。
            </p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {history.map((item) => (
              <button
                className="rounded-3xl border border-white bg-white p-5 text-left shadow-panel transition hover:-translate-y-1 hover:border-violet-200"
                key={item.sessionId}
                onClick={() => void openDetail(item.sessionId)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      {formatDate(item.savedAt)}
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-ink">{item.scenarioName}</h2>
                  </div>
                  <span className="grid size-14 place-items-center rounded-2xl bg-violet-50 text-xl font-black text-brand">
                    {item.overallScore}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">对话轮数</span>
                  <strong>{item.dialogueTurns} 轮</strong>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
