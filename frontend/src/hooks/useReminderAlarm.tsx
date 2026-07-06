/**
 * useReminderAlarm.tsx
 * ----------------------
 * Provides the in-browser alarm sound (via the Web Audio API, so no
 * external audio file is needed) and spoken notification (via the
 * Web Speech API's SpeechSynthesis) used by the reminder popup.
 *
 * Why client-side and not pyttsx3?
 * pyttsx3 (used server-side in voice.py for the voice assistant's
 * spoken replies) renders audio on the machine running the Flask
 * process — not on the user's device. For a reminder that must be
 * heard by the person using the browser, the voice has to be
 * generated in the browser itself, so this hook uses the standard
 * Web Speech API instead.
 */

import { useRef, useCallback } from "react";

export function useReminderAlarm() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const beepOnce = useCallback(() => {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  }, []);

  const startAlarm = useCallback(() => {
    beepOnce();
    intervalRef.current = window.setInterval(beepOnce, 1200);
  }, [beepOnce]);

  const stopAlarm = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, []);

  return { startAlarm, stopAlarm, speak };
}
