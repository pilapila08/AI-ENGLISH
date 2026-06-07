import type { CorrectionMode, Scenario } from "../types";
import GlassCard from "./GlassCard";
import StatusBadge from "./StatusBadge";

interface ScenarioDockProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  correctionMode: CorrectionMode;
  disabled?: boolean;
  onScenarioChange: (scenarioId: string) => void;
  onCorrectionModeChange: (mode: CorrectionMode) => void;
}

const scenarioCodes: Record<string, string> = {
  interview: "面",
  restaurant: "餐",
  meeting: "会",
  airport: "机",
  self_introduction: "介",
};

const difficultyLabels: Record<Scenario["difficulty"], string> = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

const modes: Array<{ id: CorrectionMode; label: string; description: string }> = [
  { id: "immersive", label: "沉浸", description: "练习结束后统一反馈" },
  { id: "gentle", label: "轻度", description: "仅提示重要错误" },
  { id: "strict", label: "严格", description: "每轮提供纠错建议" },
];

export default function ScenarioDock(props: ScenarioDockProps) {
  const selected =
    props.scenarios.find((scenario) => scenario.id === props.selectedScenarioId) ??
    props.scenarios[0];

  return (
    <GlassCard
      as="aside"
      className="app-panel-left flex min-h-0 flex-col overflow-hidden p-3"
      glow="violet"
    >
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="cockpit-label">训练任务舱</p>
          <h2 className="mt-1 text-sm font-black text-white">选择模拟场景</h2>
        </div>
        <StatusBadge tone="violet">
          {selected ? difficultyLabels[selected.difficulty] : "准备就绪"}
        </StatusBadge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
        {props.scenarios.map((scenario) => {
          const active = scenario.id === props.selectedScenarioId;
          return (
            <button
              className={`group relative overflow-hidden rounded-xl border px-3 py-2.5 text-left transition duration-300 disabled:cursor-not-allowed disabled:opacity-45 ${
                active
                  ? "neon-border border-violet-400/50 bg-violet-500/[0.13]"
                  : "border-white/[0.06] bg-white/[0.025] hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/[0.05]"
              }`}
              disabled={props.disabled}
              key={scenario.id}
              onClick={() => props.onScenarioChange(scenario.id)}
              type="button"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg border text-[9px] font-black ${
                    active
                      ? "border-violet-300/40 bg-violet-400/20 text-violet-100"
                      : "border-white/10 bg-black/20 text-slate-500"
                  }`}
                >
                  {scenarioCodes[scenario.id] ?? "场"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-100">
                    {scenario.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[9px] text-slate-500">
                    {scenario.userRole} · {difficultyLabels[scenario.difficulty]}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <section className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-black/20 p-3">
          <p className="cockpit-label">任务简报</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            {selected.description}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            <Role label="AI 角色" value={selected.aiRole} />
            <Role label="你的角色" value={selected.userRole} />
          </div>
          <div className="mt-3 space-y-1.5">
            {selected.goals.slice(0, 3).map((goal, index) => (
              <div
                className="flex gap-2 rounded-lg border border-white/[0.05] bg-white/[0.025] px-2.5 py-2 text-[10px] leading-4 text-slate-300"
                key={goal}
              >
                <span className="font-black text-cyan-300">0{index + 1}</span>
                <span>{goal}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="cockpit-label">纠错模式</p>
          <span className="text-[9px] text-slate-500">练习中不可切换</span>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.07] bg-black/25 p-1">
          {modes.map((mode) => (
            <button
              className={`rounded-lg px-1.5 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-45 ${
                props.correctionMode === mode.id
                  ? "bg-gradient-to-b from-violet-500/45 to-cyan-500/15 text-white shadow-[0_0_14px_rgba(139,92,246,0.2)]"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
              disabled={props.disabled}
              key={mode.id}
              onClick={() => props.onCorrectionModeChange(mode.id)}
              title={mode.description}
              type="button"
            >
              <span className="block text-[9px] font-black">{mode.label}</span>
            </button>
          ))}
        </div>
      </section>
    </GlassCard>
  );
}

function Role({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2">
      <p className="font-black tracking-widest text-slate-600">{label}</p>
      <p className="mt-1 truncate text-slate-300">{value}</p>
    </div>
  );
}
