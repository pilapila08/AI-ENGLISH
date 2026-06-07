import { useCallback, useEffect, useRef, useState } from "react";
import type { EnglishAccent, EnglishTTSVoice } from "../types";

interface SpeechOptions {
  voice?: EnglishTTSVoice;
  style?: string;
  accent?: EnglishAccent;
}

interface UseSpeechResult {
  speaking: boolean;
  supported: boolean;
  mode: "mimo" | "unavailable";
  error: string;
  warning: string;
  speak: (text: string, options?: SpeechOptions) => Promise<void>;
  stop: () => void;
}

function splitIntoSpeechChunks(text: string): string[] {
  return (
    text
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((part) => part.trim())
      .filter(Boolean) ?? [text.trim()]
  );
}

export function useSpeech(): UseSpeechResult {
  const [speaking, setSpeaking] = useState(false);
  const [mode, setMode] = useState<"mimo" | "unavailable">("mimo");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const playbackIdRef = useRef(0);

  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }
  }, []);

  const stop = useCallback(() => {
    playbackIdRef.current += 1;
    clearAudio();
    setSpeaking(false);
  }, [clearAudio]);

  const playAudio = useCallback(
    async (audioData: Uint8Array, mimeType: "audio/wav", playbackId: number) => {
      if (playbackId !== playbackIdRef.current) {
        return;
      }

      clearAudio();
      const blob = new Blob([audioData], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.preload = "auto";
      audio.volume = 1;
      audioUrlRef.current = audioUrl;
      audioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("MiMo 音频播放失败。"));
        audio.play().catch(reject);
      });
    },
    [clearAudio],
  );

  const speak = useCallback(
    async (text: string, options: SpeechOptions = {}) => {
      const chunks = splitIntoSpeechChunks(text);
      if (chunks.length === 0 || !chunks[0]) {
        return;
      }

      stop();
      const playbackId = playbackIdRef.current;
      setError("");
      setWarning("");
      setMode("mimo");
      setSpeaking(true);

      // Start every sentence request immediately. Playback still follows the
      // original sentence order, so later sentences synthesize in parallel
      // while the first sentence is being spoken.
      const requests = chunks.map((chunk) =>
        window.speakCoachAPI.synthesizeSpeech(chunk, options),
      );

      try {
        for (const request of requests) {
          const result = await request;

          if (playbackId !== playbackIdRef.current) {
            return;
          }

          setMode(result.mode);
          if (result.warning) {
            setWarning(result.warning);
          }

          if (!result.audioData || !result.mimeType) {
            throw new Error(result.warning || "MiMo TTS 未返回音频。");
          }

          await playAudio(result.audioData, result.mimeType, playbackId);
        }
      } catch (speechError) {
        console.error("[Speech] MiMo speech synthesis failed:", speechError);
        setMode("unavailable");
        setError(
          speechError instanceof Error
            ? speechError.message
            : "MiMo TTS 朗读失败。",
        );
      } finally {
        if (playbackId === playbackIdRef.current) {
          clearAudio();
          setSpeaking(false);
        }
      }
    },
    [clearAudio, playAudio, stop],
  );

  useEffect(() => stop, [stop]);

  return {
    speaking,
    supported: true,
    mode,
    error,
    warning,
    speak,
    stop,
  };
}
