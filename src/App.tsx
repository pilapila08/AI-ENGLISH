import { useEffect, useRef, useState } from "react";
import CoachFeedbackPanel from "./components/CoachFeedbackPanel";
import ApiConfigPanel from "./components/ApiConfigPanel";
import ImmersiveChat from "./components/ImmersiveChat";
import ReportView from "./components/ReportView";
import ScenarioDock from "./components/ScenarioDock";
import TopStatusBar from "./components/TopStatusBar";
import VoiceControlBar from "./components/VoiceControlBar";
import { usePracticeSession } from "./hooks/usePracticeSession";
import { useSpeech } from "./hooks/useSpeech";
import { useVoiceConversation } from "./hooks/useVoiceConversation";
import HistoryPage from "./pages/HistoryPage";
import PracticePage from "./pages/PracticePage";
import type {
  CorrectionMode,
  EnglishAccent,
  EnglishTTSVoice,
  Scenario,
  ScoreResult,
} from "./types";

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
  const [speechAccent, setSpeechAccent] = useState<EnglishAccent>("neutral");
  const [speechVoice, setSpeechVoice] = useState<EnglishTTSVoice>("Chloe");
  const [showReport, setShowReport] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const lastSpokenMessageIdRef = useRef("");
  const {
    session,
    isBusy,
    error: sessionError,
    startPractice,
    sendMessage,
    endPractice,
    refreshSession,
  } = usePracticeSession();
  const isSessionActive = session?.status === "active";
  const {
    recording,
    elapsedSeconds,
    error: voiceError,
    isProcessing: isVoiceProcessing,
    result: voiceResult,
    startVoiceInput,
    stopVoiceInputAndSend,
    stopRecording,
  } = useVoiceConversation(isSessionActive);
  const {
    speaking,
    supported: speechSupported,
    error: speechError,
    warning: speechWarning,
    speak,
    stop: stopSpeaking,
  } = useSpeech();

  useEffect(() => {
    let active = true;
    window.speakCoachAPI
      .getScenarios()
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
    return () => {
      active = false;
    };
  }, [session?.scenarioId]);

  const selectedScenario = scenarios.find(
    (scenario) => scenario.id === selectedScenarioId,
  );
  const messages =
    session?.scenarioId === selectedScenarioId ? session.messages : [];

  useEffect(() => {
    if (!autoSpeak || !selectedScenario?.openingMessage) return;
    const chunks =
      selectedScenario.openingMessage
        .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
        ?.map((part) => part.trim())
        .filter(Boolean) ?? [];
    void Promise.all(
      chunks.map((chunk) =>
        window.speakCoachAPI
          .synthesizeSpeech(chunk, {
            accent: speechAccent,
            voice: speechVoice,
          })
          .catch((error) => console.warn("[TTS] Prewarm failed:", error)),
      ),
    );
  }, [
    autoSpeak,
    selectedScenario?.id,
    selectedScenario?.openingMessage,
    speechAccent,
    speechVoice,
  ]);

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
    void speak(lastMessage.content, {
      accent: speechAccent,
      voice: speechVoice,
    });
  }, [autoSpeak, messages, speak, speechAccent, speechVoice]);

  useEffect(() => {
    if (session?.report) setShowReport(true);
  }, [session?.report]);

  useEffect(() => {
    if (voiceResult) void refreshSession();
  }, [refreshSession, voiceResult]);

  const handleAction = async (action: string) => {
    if (action === "start-practice") {
      setShowReport(false);
      stopSpeaking();
      await startPractice(selectedScenarioId, correctionMode);
    } else if (action === "submit-text") {
      if (await sendMessage(inputText, false)) setInputText("");
    } else if (action === "end-practice") {
      stopSpeaking();
      if (recording) stopRecording();
      await endPractice();
    }
  };

  if (page === "history") {
    return (
      <>
        <HistoryPage
          autoSpeak={autoSpeak}
          onAutoSpeakChange={setAutoSpeak}
          onNavigate={setPage}
          onOpenConfig={() => setShowApiConfig(true)}
        />
        <ApiConfigPanel open={showApiConfig} onClose={() => setShowApiConfig(false)} />
      </>
    );
  }

  if (isLoadingScenarios || !selectedScenario) {
    return (
      <main className="cockpit-shell grid min-h-screen place-items-center p-6 text-slate-100">
        <section className="glass-card app-enter w-full max-w-md p-8 text-center">
          <div className="pulse-ring mx-auto grid size-16 place-items-center rounded-full border border-cyan-300/30 bg-gradient-to-br from-violet-500/30 to-cyan-400/15 font-black text-cyan-100">
            SC
          </div>
          <p className="cockpit-label mt-6">正在初始化训练舱</p>
          <h1 className="mt-2 text-xl font-black">SpeakCoach AI Desktop</h1>
          <div className="mx-auto mt-5 size-6 animate-spin rounded-full border-2 border-cyan-300/10 border-t-cyan-300" />
          <p className="mt-3 text-xs text-slate-500">
            {scenarioError || "正在通过安全 IPC 加载模拟场景..."}
          </p>
        </section>
      </main>
    );
  }

  const practiceStatus = showReport
    ? "completed"
    : isBusy || isVoiceProcessing
      ? "analyzing"
      : isSessionActive
        ? "active"
        : "idle";

  return (
    <PracticePage>
      <main className="cockpit-shell flex h-screen min-h-0 flex-col overflow-hidden p-3 pb-24 text-slate-100">
        <TopStatusBar
          autoSpeak={autoSpeak}
          correctionMode={session?.correctionMode ?? correctionMode}
          offlineFallback={Boolean(session?.offlineFallback)}
          onAutoSpeakChange={setAutoSpeak}
          onNavigate={setPage}
          onOpenConfig={() => setShowApiConfig(true)}
          page="practice"
          practiceStatus={practiceStatus}
          scenarioName={selectedScenario.name}
          speaking={speaking}
        />
        <div className="mx-auto mt-3 flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-3 overflow-hidden">
          {showReport && session?.report ? (
            <div className="cockpit-scroll app-content-enter min-h-0 flex-1 overflow-y-auto">
              <ReportView
                onClose={() => setShowReport(false)}
                report={session.report}
              />
            </div>
          ) : (
            <>
              <section className="app-content-enter grid min-h-0 flex-1 gap-3 lg:grid-cols-[240px_minmax(430px,1fr)_300px] xl:grid-cols-[270px_minmax(560px,1fr)_330px]">
                <ScenarioDock
                  correctionMode={correctionMode}
                  disabled={isSessionActive}
                  onCorrectionModeChange={setCorrectionMode}
                  onScenarioChange={setSelectedScenarioId}
                  scenarios={scenarios}
                  selectedScenarioId={selectedScenarioId}
                />
                <ImmersiveChat
                  accent={speechAccent}
                  isActive={Boolean(isSessionActive)}
                  isBusy={isBusy}
                  isVoiceProcessing={isVoiceProcessing}
                  messages={messages}
                  onAccentChange={setSpeechAccent}
                  onSpeakMessage={(text) =>
                    void speak(text, {
                      accent: speechAccent,
                      voice: speechVoice,
                    })
                  }
                  onStopSpeaking={stopSpeaking}
                  onVoiceChange={setSpeechVoice}
                  recording={recording}
                  scenario={selectedScenario}
                  speaking={speaking}
                  speechError={speechError}
                  speechSupported={speechSupported}
                  speechWarning={speechWarning}
                  voice={speechVoice}
                />
                <CoachFeedbackPanel
                  correctionMode={session?.correctionMode ?? correctionMode}
                  corrections={session?.corrections ?? []}
                  isAnalyzing={isBusy}
                  score={session?.score ?? initialScore}
                />
              </section>
              <VoiceControlBar
                elapsedSeconds={elapsedSeconds}
                isActive={Boolean(isSessionActive)}
                isBusy={isBusy}
                isVoiceProcessing={isVoiceProcessing}
                onAction={(action) => void handleAction(action)}
                onStartVoiceInput={() => void startVoiceInput()}
                onStopVoiceInputAndSend={() => void stopVoiceInputAndSend()}
                onTextChange={setInputText}
                recording={recording}
                text={inputText}
                voiceError={voiceError}
              />
            </>
          )}
          {sessionError && (
            <p className="app-toast rounded-xl border border-red-300/15 bg-red-400/[0.08] px-4 py-2 text-xs text-red-200">
              {sessionError}
            </p>
          )}
          {session?.storageWarning && (
            <p className="app-toast rounded-xl border border-amber-300/15 bg-amber-400/[0.08] px-4 py-2 text-xs text-amber-200">
              {session.storageWarning}
            </p>
          )}
        </div>
      </main>
      <ApiConfigPanel open={showApiConfig} onClose={() => setShowApiConfig(false)} />
    </PracticePage>
  );
}

export default App;
