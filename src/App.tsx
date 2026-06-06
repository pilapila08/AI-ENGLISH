import { useEffect, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import FeedbackPanel from "./components/FeedbackPanel";
import RecorderBar from "./components/RecorderBar";
import ScenarioPanel from "./components/ScenarioPanel";
import { usePracticeSession } from "./hooks/usePracticeSession";
import type { CorrectionMode, Scenario, ScoreResult } from "./types";

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
  const {
    session,
    isBusy,
    error: sessionError,
    startPractice,
    sendMessage,
    endPractice,
  } = usePracticeSession();

  useEffect(() => {
    let isActive = true;

    window.speakCoachAPI
      .getScenarios()
      .then((loadedScenarios) => {
        if (!isActive || loadedScenarios.length === 0) {
          return;
        }

        setScenarios(loadedScenarios);
        setSelectedScenarioId(
          session?.scenarioId ?? loadedScenarios[0].id,
        );
      })
      .catch((error) => {
        console.error("[Renderer] Failed to load scenarios:", error);

        if (isActive) {
          setScenarioError("场景加载失败，请重启客户端后重试。");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingScenarios(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [session?.scenarioId]);

  const selectedScenario = scenarios.find(
    (scenario) => scenario.id === selectedScenarioId,
  );
  const isSessionActive = session?.status === "active";
  const messages =
    session?.scenarioId === selectedScenarioId ? session.messages : [];

  const handleAction = async (action: string) => {
    if (action === "start-practice") {
      await startPractice(selectedScenarioId, correctionMode);
      return;
    }

    if (action === "submit-text") {
      const didSend = await sendMessage(inputText);

      if (didSend) {
        setInputText("");
      }
      return;
    }

    if (action === "end-practice") {
      await endPractice();
      return;
    }

    console.log(`[SpeakCoach] ${action}`);
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
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            isSessionActive
              ? "border-violet-200 bg-violet-50 text-brand"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {isSessionActive ? "练习进行中" : "场景配置已加载"}
        </span>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <section className="grid min-h-[680px] gap-5 xl:grid-cols-[280px_minmax(460px,1fr)_310px]">
          <ScenarioPanel
            correctionMode={correctionMode}
            disabled={isSessionActive}
            onCorrectionModeChange={setCorrectionMode}
            onScenarioChange={setSelectedScenarioId}
            scenarios={scenarios}
            selectedScenarioId={selectedScenarioId}
          />
          <ChatPanel
            isBusy={isBusy}
            messages={messages}
            scenario={selectedScenario}
          />
          <FeedbackPanel
            correctionMode={correctionMode}
            corrections={[]}
            score={placeholderScore}
          />
        </section>
        <RecorderBar
          isActive={isSessionActive}
          isBusy={isBusy}
          onAction={(action) => void handleAction(action)}
          onTextChange={setInputText}
          text={inputText}
        />
        {sessionError && (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {sessionError}
          </p>
        )}
      </div>
    </main>
  );
}

export default App;
