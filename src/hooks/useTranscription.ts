import { useCallback, useState } from "react";
import { convertAudioBlobToWav } from "../utils/audioConversion";

interface TranscribeOptions {
  scenarioId?: string;
}

interface UseTranscriptionResult {
  isTranscribing: boolean;
  transcript: string;
  error: string;
  warning: string;
  transcribe: (
    audioBlob: Blob,
    options?: TranscribeOptions,
  ) => Promise<string | null>;
  clearTranscript: () => void;
}

const ASR_FALLBACK_PREFIX = "__SPEAKCOACH_ASR_FALLBACK__:";

export function useTranscription(): UseTranscriptionResult {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const transcribe = useCallback(
    async (audioBlob: Blob, options?: TranscribeOptions) => {
      setIsTranscribing(true);
      setError("");
      setWarning("");

      try {
        const compatibleAudioBlob = await convertAudioBlobToWav(audioBlob);
        const arrayBuffer = await compatibleAudioBlob.arrayBuffer();
        const result = await window.speakCoachAPI.transcribeAudio(arrayBuffer, {
          mimeType: compatibleAudioBlob.type,
          scenarioId: options?.scenarioId,
        });

        const usedFallback = result.startsWith(ASR_FALLBACK_PREFIX);
        const cleanTranscript = usedFallback
          ? result.slice(ASR_FALLBACK_PREFIX.length)
          : result;

        if (usedFallback) {
          setWarning("真实 ASR 失败，已使用模拟转写。");
        }

        setTranscript(cleanTranscript);
        return cleanTranscript;
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
    setWarning("");
  }, []);

  return {
    isTranscribing,
    transcript,
    error,
    warning,
    transcribe,
    clearTranscript,
  };
}
