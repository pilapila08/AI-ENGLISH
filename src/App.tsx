import { useMemo, useState } from "react";
import { parse } from "yaml";
import scenariosYaml from "../config/scenarios.yaml?raw";
import ChatPanel from "./components/ChatPanel";
import FeedbackPanel from "./components/FeedbackPanel";
import RecorderBar from "./components/RecorderBar";
import ScenarioPanel from "./components/ScenarioPanel";
import type {
  ChatMessage,
  CorrectionMode,
  Scenario,
  ScoreResult,
} from "./types";

const scenarios = parse(scenariosYaml) as Scenario[];

const placeholderScore: ScoreResult = {
  pronunciationScore: 82,
  grammarScore: 78,
  fluencyScore: 74,
  vocabularyScore: 80,
  naturalnessScore: 76,
  overallScore: 78,
};

function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0].id);
  const [correctionMode, setCorrectionMode] =
    useState<CorrectionMode>("gentle");
  const [inputText, setInputText] = useState("");

  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ??
    scenarios[0];

  const messages = useMemo<ChatMessage[]>(
    () => [
      {
        id: `${selectedScenario.id}-opening`,
        role: "assistant",
        content: selectedScenario.openingMessage,
        createdAt: new Date().toISOString(),
      },
      {
        id: `${selectedScenario.id}-sample-user`,
        role: "user",
        content:
          selectedScenario.id === "interview"
            ? "Hello, I am a backend developer with three years of experience."
            : selectedScenario.sampleQuestions[0],
        createdAt: new Date().toISOString(),
      },
    ],
    [selectedScenario],
  );

  const handleAction = (action: string) => {
    console.log(`[SpeakCoach] ${action}`, { inputText, selectedScenarioId });
  };

  return (
    <main className="min-h-screen bg-mist p-5 text-ink">
      <header className="mx-auto mb-5 flex max-w-[1600px] items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            Local-first speaking practice
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            SpeakCoach AI Desktop
          </h1>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          基础界面已就绪
        </span>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <section className="grid min-h-[680px] gap-5 xl:grid-cols-[280px_minmax(460px,1fr)_310px]">
          <ScenarioPanel
            correctionMode={correctionMode}
            onCorrectionModeChange={setCorrectionMode}
            onScenarioChange={setSelectedScenarioId}
            scenarios={scenarios}
            selectedScenarioId={selectedScenarioId}
          />
          <ChatPanel messages={messages} scenario={selectedScenario} />
          <FeedbackPanel
            correctionMode={correctionMode}
            corrections={[]}
            score={placeholderScore}
          />
        </section>
        <RecorderBar
          onAction={handleAction}
          onTextChange={setInputText}
          text={inputText}
        />
      </div>
    </main>
  );
}

export default App;
