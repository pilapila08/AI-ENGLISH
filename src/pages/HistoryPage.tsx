import { useCallback, useEffect, useState } from "react";
import AppNavigation from "../components/AppNavigation";
import ReportView from "../components/ReportView";
import type { HistoryRecord, HistorySummary } from "../types";

interface HistoryPageProps {
  onNavigate: (page: "practice" | "history") => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function HistoryPage({ onNavigate }: HistoryPageProps) {
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

  useEffect(() => void loadHistory(), [loadHistory]);

  const openDetail = async (sessionId: string) => {
    setError("");
    try {
      const detail = await window.speakCoachAPI.getHistoryDetail(sessionId);
      detail ? setSelected(detail) : setError("未找到这条练习记录。");
    } catch (detailError) {
      console.error("[HistoryPage] Failed to load history detail:", detailError);
      setError("完整报告加载失败，请稍后重试。");
    }
  };

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-mist p-3 text-ink">
      <AppNavigation activePage="history" onNavigate={onNavigate} status={`${history.length} 份本地报告`} statusTone="ready" />
      <div className="app-content-enter mx-auto min-h-0 w-full max-w-[1600px] flex-1 overflow-y-auto">
        {selected ? (
          <ReportView report={selected.report} onClose={() => setSelected(null)} />
        ) : error ? (
          <StateCard title="历史记录加载失败" description={error} />
        ) : isLoading ? (
          <StateCard title="正在加载历史记录..." description="正在读取本地练习报告。" loading />
        ) : history.length === 0 ? (
          <StateCard title="还没有历史记录" description="完成一次练习后，报告会自动保存在这里。" />
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {history.map((item, index) => (
              <button
                className="app-history-card group rounded-2xl border border-white/80 bg-white/90 p-4 text-left shadow-panel transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
                key={item.sessionId}
                onClick={() => void openDetail(item.sessionId)}
                style={{ animationDelay: `${index * 55}ms` }}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-slate-400">{formatDate(item.savedAt)}</p>
                    <h3 className="mt-1.5 truncate text-base font-black">{item.scenarioName}</h3>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-100 to-cyan-100 text-xl font-black text-brand transition duration-300 group-hover:scale-105">
                    {item.overallScore}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
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

function StateCard({ title, description, loading = false }: { title: string; description: string; loading?: boolean }) {
  return (
    <section className="app-enter rounded-2xl border border-white bg-white/90 p-8 text-center shadow-panel">
      {loading && <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-violet-100 border-t-brand" />}
      <p className="text-base font-black">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </section>
  );
}
