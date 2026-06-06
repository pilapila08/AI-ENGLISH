import { useEffect, useRef, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import FeedbackPanel from "./components/FeedbackPanel";
import RecorderBar from "./components/RecorderBar";
import ScenarioPanel from "./components/ScenarioPanel";
import { usePracticeSession } from "./hooks/usePracticeSession";
import { useRecorder } from "./hooks/useRecorder";
import { useTranscription } from "./hooks/useTranscription";
import { useSpeech } from "./hooks/useSpeech";
import type { CorrectionMode, Scenario, ScoreResult } from "./types";

const initialScore: ScoreResult = {
  pronunciationScore: 60,
  grammarScore: 90,
  fluencyScore: 55,
  vocabularyScore: 55,
  naturalnessScore: 90,
  contextAppropriatenessScore: 60,
  overallScore: 69,
};

function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [scenarioError, setScenarioError] = useState("");
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [correctionMode, setCorrectionMode] =
    useState<CorrectionMode>("gentle");
  const [inputText, setInputText] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const lastSpokenMessageIdRef = useRef("");
  const {
    session,
    isBusy,
    error: sessionError,
    startPractice,
    sendMessage,
    endPractice,
  } = usePracticeSession();
  const {
    recording,
    audioBlob,
    audioUrl,
    error: recordingError,
    startRecording,
    stopRecording,
  } = useRecorder();
  const {
    isTranscribing,
    transcript,
    error: transcriptionError,
    warning: transcriptionWarning,
    transcribe,
    clearTranscript,
  } = useTranscription();
  const {
    speaking,
    supported: speechSupported,
    mode: speechMode,
    error: speechError,
    warning: speechWarning,
    speak,
    stop: stopSpeaking,
  } = useSpeech();

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

  useEffect(() => {
    if (!selectedScenario?.openingMessage) {
      return;
    }

    const openingChunks =
      selectedScenario.openingMessage
        .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
        ?.map((part) => part.trim())
        .filter(Boolean) ?? [];

    // Warm the Main Process TTS cache while the learner reviews the scenario.
    void Promise.all(
      openingChunks.map((chunk) =>
        window.speakCoachAPI.synthesizeSpeech(chunk).catch((error) => {
          console.warn("[TTS] Failed to prewarm opening message:", error);
        }),
      ),
    );
  }, [selectedScenario?.id, selectedScenario?.openingMessage]);

  useEffect(() => {
    const lastMessage = messages.at(-1);

    if (
      !autoSpeak ||
      !lastMessage ||
      lastMessage.role !== "assistant" ||
      lastSpokenMessageIdRef.current === lastMessage.id
    ) {
      return;
    }

    lastSpokenMessageIdRef.current = lastMessage.id;
    void speak(lastMessage.content);
  }, [autoSpeak, messages, speak]);

  const handleAction = async (action: string) => {
    if (action === "start-practice") {
      clearTranscript();
      stopSpeaking();
      await startPractice(selectedScenarioId, correctionMode);
      return;
    }

    if (action === "submit-text") {
      const didSend = await sendMessage(inputText, Boolean(transcript));

      if (didSend) {
        setInputText("");
        clearTranscript();
      }
      return;
    }

    if (action === "end-practice") {
      stopSpeaking();
      if (recording) {
        stopRecording();
      }
      await endPractice();
      return;
    }

    console.log(`[SpeakCoach] ${action}`);
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      return;
    }

    const result = await transcribe(audioBlob, {
      scenarioId: selectedScenarioId,
    });

    if (result) {
      setInputText(result);
    }
  };

  const handleStartRecording = async () => {
    clearTranscript();
    await startRecording();
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
          {session?.offlineFallback
            ? "已切换到离线模拟模式"
            : isSessionActive
              ? "练习进行中"
              : "场景配置已加载"}
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
            autoSpeak={autoSpeak}
            isBusy={isBusy}
            messages={messages}
            onAutoSpeakChange={setAutoSpeak}
            onSpeakMessage={speak}
            onStopSpeaking={stopSpeaking}
            scenario={selectedScenario}
            speaking={speaking}
            speechError={speechError}
            speechMode={speechMode}
            speechSupported={speechSupported}
            speechWarning={speechWarning}
          />
          <FeedbackPanel
            correctionMode={session?.correctionMode ?? correctionMode}
            corrections={session?.corrections ?? []}
            isAnalyzing={isBusy}
            score={session?.score ?? initialScore}
          />
        </section>
        <RecorderBar
          audioBlob={audioBlob}
          audioUrl={audioUrl}
          isActive={isSessionActive}
          isBusy={isBusy}
          isTranscribing={isTranscribing}
          onStartRecording={() => void handleStartRecording()}
          onStopRecording={stopRecording}
          onTranscribe={() => void handleTranscribe()}
          onAction={(action) => void handleAction(action)}
          onTextChange={setInputText}
          recording={recording}
          recordingError={recordingError}
          text={inputText}
          transcript={transcript}
          transcriptionError={transcriptionError}
          transcriptionWarning={transcriptionWarning}
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
