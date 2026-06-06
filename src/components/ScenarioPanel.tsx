import type { CorrectionMode, Scenario } from "../types";

interface ScenarioPanelProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  correctionMode: CorrectionMode;
  onScenarioChange: (scenarioId: string) => void;
  onCorrectionModeChange: (mode: CorrectionMode) => void;
}

const correctionModes: Array<{
  id: CorrectionMode;
  name: string;
  description: string;
}> = [
  { id: "immersive", name: "沉浸模式", description: "练习结束后统一反馈" },
  { id: "gentle", name: "轻纠错", description: "只提醒影响表达的问题" },
  { id: "strict", name: "严格模式", description: "每轮提供详细纠错" },
];

function ScenarioPanel({
  scenarios,
  selectedScenarioId,
  correctionMode,
  onScenarioChange,
  onCorrectionModeChange,
}: ScenarioPanelProps) {
  return (
    <aside className="flex min-h-0 flex-col rounded-3xl bg-white p-5 shadow-panel">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          Practice setup
        </p>
        <h2 className="mt-1 text-lg font-semibold">选择练习场景</h2>
      </div>

      <div className="mt-5 space-y-2">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;

          return (
            <button
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                isSelected
                  ? "border-brand bg-brand text-white shadow-lg shadow-violet-200"
                  : "border-transparent bg-slate-50 text-slate-600 hover:border-violet-100 hover:bg-violet-50"
              }`}
              key={scenario.id}
              onClick={() => onScenarioChange(scenario.id)}
              type="button"
            >
              <span className="block text-sm font-semibold">{scenario.name}</span>
              <span
                className={`mt-1 block text-xs ${
                  isSelected ? "text-violet-100" : "text-slate-400"
                }`}
              >
                {scenario.userRole} · {scenario.difficulty}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold">纠错模式</h3>
        <div className="mt-3 space-y-2">
          {correctionModes.map((mode) => (
            <label
              className={`block cursor-pointer rounded-2xl border p-3 transition ${
                correctionMode === mode.id
                  ? "border-violet-200 bg-violet-50"
                  : "border-slate-100 hover:border-slate-200"
              }`}
              key={mode.id}
            >
              <div className="flex items-start gap-3">
                <input
                  checked={correctionMode === mode.id}
                  className="mt-1 accent-violet-600"
                  name="correction-mode"
                  onChange={() => onCorrectionModeChange(mode.id)}
                  type="radio"
                />
                <span>
                  <span className="block text-sm font-medium">{mode.name}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                    {mode.description}
                  </span>
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default ScenarioPanel;
