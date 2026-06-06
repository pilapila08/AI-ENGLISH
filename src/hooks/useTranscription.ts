import { useCallback, useState } from "react";

interface TranscribeOptions {
  scenarioId?: string;
}

interface UseTranscriptionResult {
  isTranscribing: boolean;
  transcript: string;
  error: string;
  transcribe: (
    audioBlob: Blob,
    options?: TranscribeOptions,
  ) => Promise<string | null>;
  clearTranscript: () => void;
}

export function useTranscription(): UseTranscriptionResult {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const transcribe = useCallback(
    async (audioBlob: Blob, options?: TranscribeOptions) => {
      setIsTranscribing(true);
      setError("");

      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const result = await window.speakCoachAPI.transcribeAudio(arrayBuffer, {
          mimeType: audioBlob.type,
          scenarioId: options?.scenarioId,
        });

        setTranscript(result);
        return result;
      } catch (transcriptionError) {
        console.error("[Transcription] Failed to transcribe audio:", transcriptionError);
        setError("音频转写失败，你仍可以手动输入英文文本。");
        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    [],
  );

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setError("");
  }, []);

  return {
    isTranscribing,
    transcript,
    error,
    transcribe,
    clearTranscript,
  };
}
