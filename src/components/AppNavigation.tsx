interface AppNavigationProps {
  activePage: "practice" | "history";
  onNavigate: (page: "practice" | "history") => void;
  status?: string;
  statusTone?: "active" | "ready" | "offline";
}

export default function AppNavigation({
  activePage,
  onNavigate,
  status,
  statusTone = "ready",
}: AppNavigationProps) {
  const tones = {
    active: "bg-violet-100 text-violet-700",
    ready: "bg-emerald-100 text-emerald-700",
    offline: "bg-amber-100 text-amber-700",
  };

  return (
    <header className="app-enter mx-auto mb-3 flex w-full max-w-[1600px] shrink-0 flex-col gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-2.5 shadow-panel backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative grid size-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-xs font-black text-white shadow-lg shadow-violet-200">
          SC
          <span className="absolute -right-2 -top-2 size-5 rounded-full bg-white/30 blur-sm" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-brand">
            Local-first speaking studio
          </p>
          <h1 className="text-lg font-black tracking-tight">SpeakCoach AI</h1>
        </div>
      </div>
      <nav className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-100/80 p-1">
        <NavItem active={activePage === "practice"} label="口语练习" onClick={() => onNavigate("practice")} />
        <NavItem active={activePage === "history"} label="历史报告" onClick={() => onNavigate("history")} />
      </nav>
      {status && (
        <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${tones[statusTone]}`}>
          <span className={`size-2 rounded-full ${statusTone === "active" ? "animate-pulse bg-violet-500" : statusTone === "offline" ? "bg-amber-500" : "bg-emerald-500"}`} />
          {status}
        </div>
      )}
    </header>
  );
}

function NavItem({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`relative rounded-lg px-4 py-2 text-xs font-bold transition-all duration-300 ${
        active ? "bg-white text-brand shadow-md shadow-slate-200/70" : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      {active && <span className="app-nav-indicator absolute inset-x-5 -bottom-1 h-0.5 rounded-full bg-brand" />}
    </button>
  );
}
