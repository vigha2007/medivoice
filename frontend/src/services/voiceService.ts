/**
 * voiceService.ts
 * -----------------
 * Wraps the /api/voice/* endpoints.
 */

import api from "./api";

export interface VoiceCommandResult {
  success: boolean;
  reply: string;
  action: "none" | "refresh_medicines" | "stop_alarm";
  heard?: string;
  data?: unknown;
}

export async function sendVoiceCommand(text: string): Promise<VoiceCommandResult> {
  const response = await api.post<VoiceCommandResult>("/voice/command", { text });
  return response.data;
}

/**
 * Fetches a server-rendered (pyttsx3) spoken version of the given text
 * and returns a playable object URL. Used as an optional alternative
 * to the browser's built-in speechSynthesis.
 */
export async function fetchServerSpeech(text: string): Promise<string> {
  const response = await api.post(
    "/voice/speak",
    { text },
    { responseType: "blob" }
  );
  return URL.createObjectURL(response.data as Blob);
}
