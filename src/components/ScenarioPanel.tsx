import type { CorrectionMode, Scenario } from "../types";

interface ScenarioPanelProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  correctionMode: CorrectionMode;
  disabled?: boolean;
  onScenarioChange: (scenarioId: string) => void;
  onCorrectionModeChange: (mode: CorrectionMode) => void;
}

const modes: Array<{ id: CorrectionMode; name: string; description: string }> = [
  { id: "immersive", name: "沉浸模式", description: "不中断对话，课后统一反馈" },
  { id: "gentle", name: "轻纠错", description: "只提醒影响表达的问题" },
  { id: "strict", name: "严格模式", description: "每轮提供简洁纠错建议" },
];

export default function ScenarioPanel(props: ScenarioPanelProps) {
  return (
    <aside className="app-panel-left flex min-h-0 w-full flex-col overflow-y-auto rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-panel">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Practice setup</p>
        <h2 className="mt-1 text-lg font-bold">选择练习场景</h2>
      </div>
      <div className="mt-3 space-y-1.5">
        {props.scenarios.map((scenario) => {
          const selected = scenario.id === props.selectedScenarioId;
          return (
            <button
              className={`w-full rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-brand bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200"
                  : "border-slate-100 bg-slate-50 text-slate-600 hover:border-violet-200 hover:bg-violet-50"
              }`}
              disabled={props.disabled}
              key={scenario.id}
              onClick={() => props.onScenarioChange(scenario.id)}
              type="button"
            >
              <span className="block text-sm font-bold">{scenario.name}</span>
              <span className={`mt-1 block text-xs ${selected ? "text-violet-100" : "text-slate-400"}`}>
                {scenario.userRole} · {scenario.difficulty}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <h3 className="text-sm font-bold">纠错模式</h3>
        <div className="mt-2 space-y-1.5">
          {modes.map((mode) => (
            <label
              className={`block rounded-xl border p-2.5 transition ${
                props.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              } ${props.correctionMode === mode.id ? "border-violet-300 bg-violet-50 ring-2 ring-violet-100" : "border-slate-100 hover:border-slate-200"}`}
              key={mode.id}
            >
              <div className="flex gap-3">
                <input
                  checked={props.correctionMode === mode.id}
                  className="mt-1 accent-violet-600"
                  disabled={props.disabled}
                  name="correction-mode"
                  onChange={() => props.onCorrectionModeChange(mode.id)}
                  type="radio"
                />
                <span>
                  <span className="block text-sm font-semibold">{mode.name}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-400">{mode.description}</span>
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
