import { useEffect, useRef, useState } from "react";
import AppNavigation from "./components/AppNavigation";
import ChatPanel from "./components/ChatPanel";
import FeedbackPanel from "./components/FeedbackPanel";
import RecorderBar from "./components/RecorderBar";
import ReportView from "./components/ReportView";
import ScenarioPanel from "./components/ScenarioPanel";
import { usePracticeSession } from "./hooks/usePracticeSession";
import { useRecorder } from "./hooks/useRecorder";
import { useSpeech } from "./hooks/useSpeech";
import { useTranscription } from "./hooks/useTranscription";
import HistoryPage from "./pages/HistoryPage";
import PracticePage from "./pages/PracticePage";
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
  const [page, setPage] = useState<"practice" | "history">("practice");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [scenarioError, setScenarioError] = useState("");
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [correctionMode, setCorrectionMode] = useState<CorrectionMode>("gentle");
  const [inputText, setInputText] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const lastSpokenMessageIdRef = useRef("");
  const { session, isBusy, error: sessionError, startPractice, sendMessage, endPractice } = usePracticeSession();
  const { recording, audioBlob, audioUrl, error: recordingError, elapsedSeconds, startRecording, stopRecording } = useRecorder();
  const { isTranscribing, transcript, error: transcriptionError, warning: transcriptionWarning, transcribe, clearTranscript } = useTranscription();
  const { speaking, supported: speechSupported, mode: speechMode, error: speechError, warning: speechWarning, speak, stop: stopSpeaking } = useSpeech();

  useEffect(() => {
    let active = true;
    window.speakCoachAPI.getScenarios()
      .then((loaded) => {
        if (active && loaded.length > 0) {
          setScenarios(loaded);
          setSelectedScenarioId(session?.scenarioId ?? loaded[0].id);
        }
      })
      .catch((error) => {
        console.error("[Renderer] Failed to load scenarios:", error);
        if (active) setScenarioError("场景加载失败，请重启客户端后重试。");
      })
      .finally(() => active && setIsLoadingScenarios(false));
    return () => { active = false; };
  }, [session?.scenarioId]);

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId);
  const isSessionActive = session?.status === "active";
  const messages = session?.scenarioId === selectedScenarioId ? session.messages : [];

  useEffect(() => {
    if (!selectedScenario?.openingMessage) return;
    const chunks = selectedScenario.openingMessage.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) ?? [];
    void Promise.all(chunks.map((chunk) => window.speakCoachAPI.synthesizeSpeech(chunk).catch((error) => console.warn("[TTS] Prewarm failed:", error))));
  }, [selectedScenario?.id, selectedScenario?.openingMessage]);

  useEffect(() => {
    const lastMessage = messages.at(-1);
    if (!autoSpeak || !lastMessage || lastMessage.role !== "assistant" || lastSpokenMessageIdRef.current === lastMessage.id) return;
    lastSpokenMessageIdRef.current = lastMessage.id;
    void speak(lastMessage.content);
  }, [autoSpeak, messages, speak]);

  useEffect(() => {
    if (session?.report) setShowReport(true);
  }, [session?.report]);

  const handleAction = async (action: string) => {
    if (action === "start-practice") {
      setShowReport(false);
      clearTranscript();
      stopSpeaking();
      await startPractice(selectedScenarioId, correctionMode);
    } else if (action === "submit-text") {
      if (await sendMessage(inputText, Boolean(transcript))) {
        setInputText("");
        clearTranscript();
      }
    } else if (action === "end-practice") {
      stopSpeaking();
      if (recording) stopRecording();
      await endPractice();
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    const result = await transcribe(audioBlob, { scenarioId: selectedScenarioId });
    if (result) setInputText(result);
  };

  if (page === "history") {
    return <HistoryPage onNavigate={setPage} />;
  }

  if (isLoadingScenarios || !selectedScenario) {
    return (
      <main className="grid min-h-screen place-items-center bg-mist p-6 text-ink">
        <section className="app-enter w-full max-w-md rounded-[32px] border border-white bg-white/90 p-8 text-center shadow-panel backdrop-blur">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 font-black text-white">SC</div>
          <h1 className="mt-5 text-xl font-black">SpeakCoach AI Desktop</h1>
          <div className="mx-auto mt-4 size-6 animate-spin rounded-full border-2 border-violet-100 border-t-brand" />
          <p className="mt-3 text-sm text-slate-500">{scenarioError || "正在通过安全 IPC 加载练习场景..."}</p>
        </section>
      </main>
    );
  }

  const status = session?.offlineFallback ? "离线模拟模式" : isSessionActive ? "练习进行中" : "准备就绪";
  const statusTone = session?.offlineFallback ? "offline" : isSessionActive ? "active" : "ready";

  return (
    <PracticePage>
      <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-mist p-3 pb-20 text-ink">
        <AppNavigation activePage="practice" onNavigate={setPage} status={status} statusTone={statusTone} />
        <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3 overflow-hidden">
          {showReport && session?.report ? (
            <div className="app-content-enter min-h-0 flex-1 overflow-y-auto">
              <ReportView report={session.report} onClose={() => setShowReport(false)} />
            </div>
          ) : (
            <>
              <section className="app-content-enter grid min-h-0 flex-1 gap-3 lg:grid-cols-[230px_minmax(420px,1fr)_280px] xl:grid-cols-[250px_minmax(500px,1fr)_300px]">
                <ScenarioPanel correctionMode={correctionMode} disabled={isSessionActive} onCorrectionModeChange={setCorrectionMode} onScenarioChange={setSelectedScenarioId} scenarios={scenarios} selectedScenarioId={selectedScenarioId} />
                <ChatPanel autoSpeak={autoSpeak} isBusy={isBusy} messages={messages} onAutoSpeakChange={setAutoSpeak} onSpeakMessage={speak} onStopSpeaking={stopSpeaking} scenario={selectedScenario} speaking={speaking} speechError={speechError} speechMode={speechMode} speechSupported={speechSupported} speechWarning={speechWarning} />
                <FeedbackPanel correctionMode={session?.correctionMode ?? correctionMode} corrections={session?.corrections ?? []} isAnalyzing={isBusy} score={session?.score ?? initialScore} />
              </section>
              <RecorderBar audioBlob={audioBlob} audioUrl={audioUrl} elapsedSeconds={elapsedSeconds} isActive={isSessionActive} isBusy={isBusy} isTranscribing={isTranscribing} onAction={(action) => void handleAction(action)} onStartRecording={() => { clearTranscript(); void startRecording(); }} onStopRecording={stopRecording} onTextChange={setInputText} onTranscribe={() => void handleTranscribe()} recording={recording} recordingError={recordingError} text={inputText} transcript={transcript} transcriptionError={transcriptionError} transcriptionWarning={transcriptionWarning} />
            </>
          )}
          {sessionError && <p className="app-toast rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{sessionError}</p>}
          {session?.storageWarning && <p className="app-toast rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">{session.storageWarning}</p>}
        </div>
      </main>
    </PracticePage>
  );
}

export default App;
