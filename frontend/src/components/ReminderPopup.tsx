/**
 * ReminderPopup.tsx
 * -------------------
 * The full-screen alarm popup shown when a medicine reminder is due.
 * Plays a repeating alarm tone, speaks "It is time to take your
 * [Medicine Name]" once, and offers Mark as Taken / Snooze / Skip.
 */

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Clock3, XCircle, Loader2 } from "lucide-react";
import type { Medicine } from "../types/dashboard";
import { useReminderAlarm } from "../hooks/useReminderAlarm";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import { MEDIVOICE_EVENTS, onEvent } from "../utils/eventBus";

interface ReminderPopupProps {
  medicine: Medicine;
  onTake: () => Promise<void>;
  onSkip: () => Promise<void>;
  onSnooze: (minutes: 5 | 10) => Promise<void>;
}

export default function ReminderPopup({
  medicine,
  onTake,
  onSkip,
  onSnooze,
}: ReminderPopupProps) {
  const { startAlarm, stopAlarm, speak } = useReminderAlarm();
  const { preferences } = useNotificationPreferences();
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    if (preferences.alarm_enabled) startAlarm();
    if (preferences.voice_enabled) {
      speak(`It is time to take your ${medicine.medicine_name}.`);
    }
    return () => stopAlarm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicine.id, preferences.alarm_enabled, preferences.voice_enabled]);

  useEffect(() => {
    return onEvent(MEDIVOICE_EVENTS.STOP_ALARM, stopAlarm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handle(action: string, fn: () => Promise<void>) {
    setBusyAction(action);
    stopAlarm();
    try {
      await fn();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-800">
        <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <BellRing className="h-8 w-8 text-primary-600 dark:text-primary-300" />
        </div>

        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          Medicine Reminder
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          It's time to take{" "}
          <span className="font-semibold">{medicine.medicine_name}</span>
          {medicine.dosage ? ` (${medicine.dosage})` : ""}
        </p>
        {medicine.purpose && (
          <p className="mt-1 text-sm text-slate-400">For: {medicine.purpose}</p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => handle("take", onTake)}
            disabled={!!busyAction}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busyAction === "take" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Mark as Taken
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handle("snooze5", () => onSnooze(5))}
              disabled={!!busyAction}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60 dark:bg-amber-950 dark:text-amber-300"
            >
              {busyAction === "snooze5" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
              Snooze 5m
            </button>
            <button
              onClick={() => handle("snooze10", () => onSnooze(10))}
              disabled={!!busyAction}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60 dark:bg-amber-950 dark:text-amber-300"
            >
              {busyAction === "snooze10" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
              Snooze 10m
            </button>
          </div>

          <button
            onClick={() => handle("skip", onSkip)}
            disabled={!!busyAction}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 dark:bg-red-950 dark:text-red-300"
          >
            {busyAction === "skip" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
