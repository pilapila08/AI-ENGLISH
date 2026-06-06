import { useCallback, useEffect, useState } from "react";
import type { CorrectionMode, PracticeSession } from "../types";

interface UsePracticeSessionResult {
  session: PracticeSession | null;
  isBusy: boolean;
  error: string;
  startPractice: (
    scenarioId: string,
    correctionMode: CorrectionMode,
  ) => Promise<void>;
  sendMessage: (text: string) => Promise<boolean>;
  endPractice: () => Promise<void>;
}

export function usePracticeSession(): UsePracticeSessionResult {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    window.speakCoachAPI
      .getCurrentSession()
      .then((currentSession) => {
        if (isActive) {
          setSession(currentSession);
        }
      })
      .catch((loadError) => {
        console.error("[PracticeSession] Failed to restore session:", loadError);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const runAction = useCallback(
    async (
      action: () => Promise<PracticeSession | null>,
    ): Promise<PracticeSession | null> => {
      setIsBusy(true);
      setError("");

      try {
        const nextSession = await action();
        setSession(nextSession);
        return nextSession;
      } catch (actionError) {
        console.error("[PracticeSession] Action failed:", actionError);
        setError("操作失败，请稍后重试。");
        return null;
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const startPractice = useCallback(
    async (scenarioId: string, correctionMode: CorrectionMode) => {
      await runAction(() =>
        window.speakCoachAPI.startPractice(scenarioId, correctionMode),
      );
    },
    [runAction],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const nextSession = await runAction(() =>
        window.speakCoachAPI.sendMessage(text),
      );
      return Boolean(nextSession);
    },
    [runAction],
  );

  const endPractice = useCallback(async () => {
    await runAction(() => window.speakCoachAPI.endPractice());
  }, [runAction]);

  return {
    session,
    isBusy,
    error,
    startPractice,
    sendMessage,
    endPractice,
  };
}
