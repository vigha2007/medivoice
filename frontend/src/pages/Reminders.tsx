/**
 * Reminders.tsx
 * --------------
 * Module 4: Reminder Scheduler (page view)
 *
 * Shows today's reminders grouped by status (upcoming, missed, taken)
 * and lets the user manually take/skip/snooze any of them — the same
 * actions available from the automatic popup, for when someone wants
 * to act ahead of or after the alarm fires.
 */

import { useCallback, useEffect, useState } from "react";
import {
  AlarmClock,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  XCircle,
  Loader2,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { fetchDashboardStats } from "../services/dashboardService";
import {
  takeReminder,
  skipReminder,
  snoozeReminder,
} from "../services/reminderService";
import type { DashboardResponse, Medicine } from "../types/dashboard";
import { MEDIVOICE_EVENTS, onEvent } from "../utils/eventBus";

function ReminderRow({
  medicine,
  variant,
  onAction,
}: {
  medicine: Medicine;
  variant: "upcoming" | "missed";
  onAction: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    try {
      await fn();
      onAction();
    } catch {
      // swallow — a toast could be added here if desired
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-50 px-4 py-3 dark:border-slate-700">
      <div>
        <p className="font-medium text-slate-700 dark:text-slate-200">
          {medicine.medicine_name}
          {medicine.dosage ? ` — ${medicine.dosage}` : ""}
        </p>
        <p className="text-xs text-slate-400">
          ⏰ {medicine.reminder_time || "—"} · {medicine.frequency}
          {medicine.snoozed_until && (
            <span className="ml-2 text-amber-500">
              Snoozed until {new Date(medicine.snoozed_until).toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => run("take", () => takeReminder(medicine.id))}
          disabled={!!busy}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {busy === "take" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Take
        </button>
        {variant === "upcoming" && (
          <>
            <button
              onClick={() => run("snooze5", () => snoozeReminder(medicine.id, 5))}
              disabled={!!busy}
              className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60 dark:bg-amber-950 dark:text-amber-300"
            >
              {busy === "snooze5" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}
              Snooze 5m
            </button>
          </>
        )}
        <button
          onClick={() => run("skip", () => skipReminder(medicine.id))}
          disabled={!!busy}
          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 dark:bg-red-950 dark:text-red-300"
        >
          {busy === "skip" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Skip
        </button>
      </div>
    </div>
  );
}

export default function Reminders() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchDashboardStats()
      .then(setData)
      .catch(() => setError("Unable to load reminders."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
    return onEvent(MEDIVOICE_EVENTS.REFRESH_MEDICINES, load);
  }, [load]);

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Reminders
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Today's reminder schedule — the alarm popup will also trigger
          automatically at each scheduled time.
        </p>

        {isLoading && (
          <div className="mt-6 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-6">
            <section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <AlarmClock className="h-4 w-4" />
                Upcoming ({data.upcoming_reminders.length})
              </h2>
              {data.upcoming_reminders.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No upcoming reminders right now.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.upcoming_reminders.map((m) => (
                    <ReminderRow
                      key={m.id}
                      medicine={m}
                      variant="upcoming"
                      onAction={load}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Missed ({data.missed_medicines.length})
              </h2>
              {data.missed_medicines.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Nothing missed today. Great job!
                </p>
              ) : (
                <div className="space-y-2">
                  {data.missed_medicines.map((m) => (
                    <ReminderRow
                      key={m.id}
                      medicine={m}
                      variant="missed"
                      onAction={load}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
