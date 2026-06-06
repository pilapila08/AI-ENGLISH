import { useEffect, useMemo, useState } from "react";
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

const placeholderScore: ScoreResult = {
  pronunciationScore: 82,
  grammarScore: 78,
  fluencyScore: 74,
  vocabularyScore: 80,
  naturalnessScore: 76,
  overallScore: 78,
};

function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [scenarioError, setScenarioError] = useState("");
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [correctionMode, setCorrectionMode] =
    useState<CorrectionMode>("gentle");
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadScenarios() {
      try {
        const loadedScenarios = await window.speakCoachAPI.getScenarios();

        if (!isActive) {
          return;
        }

        if (loadedScenarios.length === 0) {
          throw new Error("没有可用的练习场景。");
        }

        setScenarios(loadedScenarios);
        setSelectedScenarioId(loadedScenarios[0].id);
      } catch (error) {
        console.error("[Renderer] Failed to load scenarios:", error);

        if (isActive) {
          setScenarioError("场景加载失败，请重启客户端后重试。");
        }
      } finally {
        if (isActive) {
          setIsLoadingScenarios(false);
        }
      }
    }

    void loadScenarios();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedScenario = scenarios.find(
    (scenario) => scenario.id === selectedScenarioId,
  );

  const messages = useMemo<ChatMessage[]>(() => {
    if (!selectedScenario) {
      return [];
    }

    return [
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
    ];
  }, [selectedScenario]);

  const handleAction = (action: string) => {
    console.log(`[SpeakCoach] ${action}`, { inputText, selectedScenarioId });
  };

  if (isLoadingScenarios || !selectedScenario) {
    return (
      <main className="grid min-h-screen place-items-center bg-mist p-6 text-ink">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-panel">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-100 font-bold text-brand">
            SC
          </div>
          <h1 className="mt-5 text-xl font-bold">SpeakCoach AI Desktop</h1>
          <p className="mt-2 text-sm text-slate-500">
            {scenarioError || "正在通过安全 IPC 加载练习场景..."}
          </p>
        </section>
      </main>
    );
  }

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
          场景配置已加载
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
