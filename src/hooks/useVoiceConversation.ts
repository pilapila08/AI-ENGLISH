import { useCallback, useState } from "react";
import type { VoiceReplyResult } from "../types";
import { convertAudioBlobToWav } from "../utils/audioConversion";
import { useRecorder } from "./useRecorder";

export function useVoiceConversation(isPracticeActive: boolean) {
  const recorder = useRecorder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [result, setResult] = useState<VoiceReplyResult | null>(null);

  const startVoiceInput = useCallback(async () => {
    setVoiceError("");
    setResult(null);
    if (!isPracticeActive) {
      setVoiceError("请先开始练习，再使用一键语音输入。");
      return;
    }
    await recorder.startRecording();
  }, [isPracticeActive, recorder.startRecording]);

  const stopVoiceInputAndSend = useCallback(async (): Promise<VoiceReplyResult | null> => {
    setVoiceError("");
    setIsProcessing(true);
    try {
      const blob = await recorder.stopRecordingAndGetBlob();
      if (!blob || blob.size === 0) throw new Error("录音内容为空，请重新录音。");

      const compatibleBlob = await convertAudioBlobToWav(blob);
      const response = await window.speakCoachAPI.transcribeAndReply(
        await compatibleBlob.arrayBuffer(),
        { mimeType: compatibleBlob.type },
      );
      if (response.errorMessage) throw new Error(response.errorMessage);

      setResult(response);
      recorder.clearAudio();
      return response;
    } catch (error) {
      console.error("[VoiceConversation] Failed:", error);
      setVoiceError(error instanceof Error ? error.message : "语音处理失败，请重试或手动输入。");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [recorder.clearAudio, recorder.stopRecordingAndGetBlob]);

  return {
    ...recorder,
    isProcessing,
    error: voiceError || recorder.error,
    result,
    startVoiceInput,
    stopVoiceInputAndSend,
  };
}
