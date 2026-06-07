import { useCallback, useEffect, useState } from "react";
import GlassCard from "../components/GlassCard";
import ReportView from "../components/ReportView";
import StatusBadge from "../components/StatusBadge";
import TopStatusBar from "../components/TopStatusBar";
import type { HistoryRecord, HistorySummary } from "../types";
import PracticePage from "./PracticePage";

interface HistoryPageProps {
  onNavigate: (page: "practice" | "history") => void;
  autoSpeak: boolean;
  onAutoSpeakChange: (enabled: boolean) => void;
  onOpenConfig: () => void;
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

export default function HistoryPage(props: HistoryPageProps) {
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
    <PracticePage>
      <main className="cockpit-shell flex h-screen min-h-0 flex-col overflow-hidden p-3 text-slate-100">
        <TopStatusBar
          autoSpeak={props.autoSpeak}
          correctionMode="gentle"
          offlineFallback={false}
          onAutoSpeakChange={props.onAutoSpeakChange}
          onNavigate={props.onNavigate}
          onOpenConfig={props.onOpenConfig}
          page="history"
          practiceStatus="completed"
          scenarioName={`${history.length} 份报告`}
          speaking={false}
        />
        <div className="cockpit-scroll app-content-enter mx-auto mt-3 min-h-0 w-full max-w-[1800px] flex-1 overflow-y-auto">
          {selected ? (
            <ReportView onClose={() => setSelected(null)} report={selected.report} />
          ) : error ? (
            <StateCard description={error} title="训练报告暂不可用" />
          ) : isLoading ? (
            <StateCard
              description="正在读取本地训练记录..."
              loading
              title="正在加载报告记录"
            />
          ) : history.length === 0 ? (
            <StateCard
              description="完成一次练习后，即可生成第一份训练分析报告。"
              title="暂无训练报告"
            />
          ) : (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {history.map((item, index) => (
                <button
                  className="app-history-card group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-cyan-300/[0.04]"
                  key={item.sessionId}
                  onClick={() => void openDetail(item.sessionId)}
                  style={{ animationDelay: `${index * 55}ms` }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="cockpit-label">练习记录</p>
                      <h3 className="mt-2 truncate text-sm font-black text-white">
                        {item.scenarioName}
                      </h3>
                      <p className="mt-1 truncate text-[9px] text-slate-500">
                        {formatDate(item.savedAt)}
                      </p>
                    </div>
                    <div className="score-orbit grid size-14 shrink-0 place-items-center rounded-full border border-cyan-300/20 bg-slate-950/60">
                      <strong className="text-xl text-cyan-100">
                        {item.overallScore}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
                    <StatusBadge tone="violet">{item.dialogueTurns} 轮对话</StatusBadge>
                    <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300">
                      查看分析
                    </span>
                  </div>
                </button>
              ))}
            </section>
          )}
        </div>
      </main>
    </PracticePage>
  );
}

function StateCard({
  title,
  description,
  loading = false,
}: {
  title: string;
  description: string;
  loading?: boolean;
}) {
  return (
    <GlassCard className="app-enter p-10 text-center">
      {loading && (
        <div className="mx-auto mb-4 size-7 animate-spin rounded-full border-2 border-cyan-300/10 border-t-cyan-300" />
      )}
      <p className="cockpit-label">训练报告库</p>
      <p className="mt-2 text-base font-black text-white">{title}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </GlassCard>
  );
}
