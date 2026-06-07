import { useCallback, useEffect, useRef, useState } from "react";

interface UseRecorderResult {
  recording: boolean;
  audioBlob: Blob | null;
  audioUrl: string;
  error: string;
  elapsedSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

function getRecorderErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "麦克风权限被拒绝，请在 Windows 隐私设置中允许麦克风访问。";
    }

    if (error.name === "NotFoundError") {
      return "未检测到可用麦克风，请连接麦克风后重试。";
    }

    if (error.name === "NotReadableError") {
      return "麦克风当前无法使用，可能正被其他应用占用。";
    }
  }

  return error instanceof Error ? error.message : "录音失败，请稍后重试。";
}

function getSupportedMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];

  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

export function useRecorder(): UseRecorderResult {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef("");

  const stopTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      return;
    }

    setError("");
    setElapsedSeconds(0);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("当前环境不支持麦克风录音。");
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error("当前环境不支持 MediaRecorder。");
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = "";
        setAudioUrl("");
      }

      setAudioBlob(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("录音过程中发生错误，请重新录音。");
        setRecording(false);
        stopTracks();
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (blob.size > 0) {
          const nextAudioUrl = URL.createObjectURL(blob);
          audioUrlRef.current = nextAudioUrl;
          setAudioBlob(blob);
          setAudioUrl(nextAudioUrl);
        } else {
          setError("没有录制到音频，请检查麦克风后重试。");
        }

        setRecording(false);
        stopTracks();
      };

      recorder.start();
      setRecording(true);
    } catch (recordingError) {
      console.error("[Recorder] Failed to start recording:", recordingError);
      setError(getRecorderErrorMessage(recordingError));
      setRecording(false);
      stopTracks();
    }
  }, [stopTracks]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.stop();
    }
  }, []);

  useEffect(
    () => () => {
      const recorder = mediaRecorderRef.current;

      if (recorder?.state === "recording") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      }

      stopTracks();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    },
    [stopTracks],
  );

  useEffect(() => {
    if (!recording) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recording]);

  return {
    recording,
    audioBlob,
    audioUrl,
    error,
    elapsedSeconds,
    startRecording,
    stopRecording,
  };
}
