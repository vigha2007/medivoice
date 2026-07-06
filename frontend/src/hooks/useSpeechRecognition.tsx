/**
 * useSpeechRecognition.tsx
 * --------------------------
 * Thin wrapper around the browser's Web Speech API
 * (SpeechRecognition / webkitSpeechRecognition) for converting the
 * user's voice into text. This is the STT counterpart to
 * useReminderAlarm's speak() — both live in the browser because
 * that's where the microphone and speakers actually are.
 */

import { useState, useRef, useCallback, useEffect } from "react";

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T }
  ? T
  : any;

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      setError(event.error || "Speech recognition error.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript("");
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      // start() throws if already started; ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
}
