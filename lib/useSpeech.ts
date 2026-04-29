"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal types to avoid pulling DOM lib quirks across browsers.
type SRConstructor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
  resultIndex: number;
}

declare global {
  interface Window {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  }
}

export type SpeechState = {
  supported: boolean;
  listening: boolean;
  interim: string;
  finalText: string;
  error: string | null;
};

export function useSpeech() {
  const [state, setState] = useState<SpeechState>({
    supported: false,
    listening: false,
    interim: "",
    finalText: "",
    error: null,
  });
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setState((s) => ({ ...s, supported: false }));
      return;
    }
    setState((s) => ({ ...s, supported: true }));
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setState((s) => ({ ...s, error: "Speech recognition not supported in this browser." }));
      return;
    }
    try {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      finalRef.current = "";

      rec.onresult = (e: SpeechRecognitionEventLike) => {
        let interim = "";
        let final = finalRef.current;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const txt = r[0].transcript;
          if (r.isFinal) final += (final ? " " : "") + txt;
          else interim += txt;
        }
        finalRef.current = final;
        setState((s) => ({ ...s, interim, finalText: final, error: null }));
      };
      rec.onerror = (e) => {
        const msg =
          e.error === "not-allowed"
            ? "Microphone permission denied. Enable mic access and try again."
            : e.error === "no-speech"
            ? "Didn't catch that — try speaking again."
            : `Mic error: ${e.error}`;
        setState((s) => ({ ...s, error: msg, listening: false }));
      };
      rec.onend = () => {
        setState((s) => ({ ...s, listening: false }));
      };

      rec.start();
      recRef.current = rec;
      setState((s) => ({ ...s, listening: true, error: null, interim: "", finalText: "" }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Failed to start microphone.",
        listening: false,
      }));
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setState((s) => ({ ...s, interim: "", finalText: "", error: null }));
  }, []);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {}
    };
  }, []);

  return { ...state, start, stop, reset };
}
