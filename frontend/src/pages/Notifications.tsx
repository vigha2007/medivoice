/**
 * Notifications.tsx
 * -------------------
 * Module 6: Browser & Voice Notifications
 *
 * Lets the user grant/check browser notification permission, toggle
 * browser popups / spoken voice reminders / alarm sound independently,
 * and send a test of each so they know what to expect.
 */

import { useEffect, useState } from "react";
import { Bell, Volume2, BellRing, CheckCircle2, AlertCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import { useReminderAlarm } from "../hooks/useReminderAlarm";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
        checked ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function Notifications() {
  const { preferences, isLoading, updatePreference } =
    useNotificationPreferences();
  const { startAlarm, stopAlarm, speak } = useReminderAlarm();

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "Notification" in window ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    if (permission !== "unsupported" && "Notification" in window) {
      const check = () => setPermission(Notification.permission);
      const interval = setInterval(check, 1500);
      return () => clearInterval(interval);
    }
  }, [permission]);

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  function testBrowserNotification() {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("MediVoice Test", {
        body: "This is what your medicine reminders will look like.",
        icon: "/favicon.svg",
      });
    }
  }

  function testAlarm() {
    startAlarm();
    setTimeout(stopAlarm, 2500);
  }

  function testVoice() {
    speak("This is a test of your MediVoice reminder voice.");
  }

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Control how MediVoice alerts you when a medicine is due.
        </p>

        {/* Permission status */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  permission === "granted"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
                }`}
              >
                {permission === "granted" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  Browser notification permission
                </p>
                <p className="text-sm text-slate-400">
                  {permission === "granted" && "Granted — you'll receive OS-level popups."}
                  {permission === "denied" &&
                    "Blocked — enable it in your browser's site settings to receive popups."}
                  {permission === "default" &&
                    "Not yet requested — click to allow browser popups."}
                  {permission === "unsupported" &&
                    "Not supported in this browser."}
                </p>
              </div>
            </div>
            {permission === "default" && (
              <button
                onClick={requestPermission}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Allow
              </button>
            )}
          </div>
        </div>

        {/* Preference toggles */}
        {!isLoading && (
          <div className="mt-6 space-y-4 rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between gap-4 border-b border-blue-50 pb-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    Browser Notifications
                  </p>
                  <p className="text-xs text-slate-400">
                    Show an OS popup when a medicine is due.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={testBrowserNotification}
                  disabled={permission !== "granted"}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-blue-100 disabled:opacity-40 dark:bg-slate-700 dark:text-primary-300"
                >
                  Test
                </button>
                <Toggle
                  checked={preferences.browser_enabled}
                  onChange={(v) => updatePreference("browser_enabled", v)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-blue-50 pb-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    Voice Reminders
                  </p>
                  <p className="text-xs text-slate-400">
                    Speak "It is time to take your [medicine]" aloud.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={testVoice}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-blue-100 dark:bg-slate-700 dark:text-primary-300"
                >
                  Test
                </button>
                <Toggle
                  checked={preferences.voice_enabled}
                  onChange={(v) => updatePreference("voice_enabled", v)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    Alarm Sound
                  </p>
                  <p className="text-xs text-slate-400">
                    Play a repeating tone until the reminder is resolved.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={testAlarm}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-blue-100 dark:bg-slate-700 dark:text-primary-300"
                >
                  Test
                </button>
                <Toggle
                  checked={preferences.alarm_enabled}
                  onChange={(v) => updatePreference("alarm_enabled", v)}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
