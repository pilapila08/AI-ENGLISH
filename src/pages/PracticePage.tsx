import type { ReactNode } from "react";

interface PracticePageProps {
  children: ReactNode;
  onShowHistory: () => void;
}

export default function PracticePage({
  children,
  onShowHistory,
}: PracticePageProps) {
  return (
    <div className="relative">
      <button
        className="fixed right-5 top-5 z-20 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-brand shadow-lg shadow-violet-100 transition hover:bg-violet-50"
        onClick={onShowHistory}
        type="button"
      >
        历史记录
      </button>
      {children}
    </div>
  );
}
