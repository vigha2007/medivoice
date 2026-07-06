/**
 * VoiceAssistant.tsx
 * --------------------
 * Module 5: Voice Assistant
 *
 * Lets the user speak commands ("add medicine", "show today's
 * medicines", "what medicines are pending", "mark as taken", "delete
 * medicine", "snooze reminder", "stop reminder"). Captures speech via
 * the browser's SpeechRecognition, sends the transcript to the
 * backend for processing, speaks the reply back, and reacts to any
 * action the backend returns (stopping an alarm, refreshing lists).
 */

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, Bot, User, AlertCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useReminderAlarm } from "../hooks/useReminderAlarm";
import { sendVoiceCommand, fetchServerSpeech } from "../services/voiceService";
import { MEDIVOICE_EVENTS, emitEvent } from "../utils/eventBus";

interface ConversationEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const EXAMPLE_COMMANDS = [
  "Add medicine Paracetamol at 8 PM",
  "Show today's medicines",
  "What medicines are pending?",
  "Mark Paracetamol as taken",
  "Snooze reminder for 10 minutes",
  "Delete medicine Vitamin C",
  "Stop reminder",
];

export default function VoiceAssistant() {
  const {
    isSupported,
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition();
  const { speak } = useReminderAlarm();

  const [conversation, setConversation] = useState<ConversationEntry[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Hi! Tap the microphone and tell me what you'd like to do.",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastHandledTranscript = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation]);

  useEffect(() => {
    if (
      transcript &&
      transcript !== lastHandledTranscript.current &&
      !isListening
    ) {
      lastHandledTranscript.current = transcript;
      handleCommand(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  async function handleCommand(text: string) {
    setConversation((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text },
    ]);
    setIsProcessing(true);

    try {
      const result = await sendVoiceCommand(text);

      setConversation((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: result.reply },
      ]);
      speak(result.reply);

      if (result.action === "stop_alarm") {
        emitEvent(MEDIVOICE_EVENTS.STOP_ALARM);
      }
      if (result.action === "refresh_medicines") {
        emitEvent(MEDIVOICE_EVENTS.REFRESH_MEDICINES);
      }
    } catch {
      const fallback =
        "Sorry, I couldn't process that command. Please try again.";
      setConversation((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: fallback },
      ]);
      speak(fallback);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handlePlayServerVoice(text: string) {
    try {
      const url = await fetchServerSpeech(text);
      const audio = new Audio(url);
      audio.play();
    } catch {
      // Server TTS unavailable — browser voice already covered it live.
    }
  }

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex flex-1 flex-col px-8 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Voice Assistant
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Speak naturally — try "show today's medicines" or "mark as taken".
          </p>
        </div>

        {!isSupported && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Speech recognition isn't supported in this browser. Try Chrome or
            Edge on desktop or Android.
          </div>
        )}

        {speechError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Microphone error: {speechError}. Please check microphone
            permissions.
          </div>
        )}

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
          {/* Conversation panel */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
              {conversation.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 ${
                    entry.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      entry.role === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-blue-100 text-primary-600 dark:bg-slate-700 dark:text-primary-300"
                    }`}
                  >
                    {entry.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`group flex max-w-[75%] items-center gap-2 rounded-2xl px-4 py-2 text-sm ${
                      entry.role === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-blue-50 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <span>{entry.text}</span>
                    {entry.role === "assistant" && entry.id !== "intro" && (
                      <button
                        onClick={() => handlePlayServerVoice(entry.text)}
                        title="Play with server voice (pyttsx3)"
                        className="flex-shrink-0 text-primary-500 opacity-0 transition group-hover:opacity-100 dark:text-primary-300"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <p className="pl-10 text-xs text-slate-400">Thinking...</p>
              )}
            </div>

            <div className="flex items-center justify-center border-t border-blue-100 p-6 dark:border-slate-700">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={!isSupported}
                className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition disabled:opacity-40 ${
                  isListening
                    ? "animate-pulse bg-red-500 text-white"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                {isListening ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Example commands panel */}
          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Try saying...
            </h2>
            <ul className="space-y-2">
              {EXAMPLE_COMMANDS.map((cmd) => (
                <li
                  key={cmd}
                  className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  "{cmd}"
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
