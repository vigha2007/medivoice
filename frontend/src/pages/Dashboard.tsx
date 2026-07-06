/**
 * Dashboard.tsx
 * --------------
 * Module 2: Dashboard
 *
 * Shows aggregated stats (total medicines, today's medicines, upcoming
 * reminders, missed medicines, reminder status), an adherence donut
 * chart, and tables of today's / upcoming / missed medicines.
 */

import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Pill,
  CalendarCheck,
  AlarmClock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import MedicineTable from "../components/MedicineTable";
import { fetchDashboardStats } from "../services/dashboardService";
import type { DashboardResponse } from "../types/dashboard";
import { useAuth } from "../hooks/useAuth";
import { MEDIVOICE_EVENTS, onEvent } from "../utils/eventBus";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    function load() {
      fetchDashboardStats()
        .then((res) => {
          if (isMounted) setData(res);
        })
        .catch(() => {
          if (isMounted) setError("Unable to load dashboard data.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    load();
    const unsubscribe = onEvent(MEDIVOICE_EVENTS.REFRESH_MEDICINES, load);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Good day, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here's your medicine overview for {data?.date ?? "today"}.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading dashboard...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Medicines"
                value={data.stats.total_medicines}
                icon={Pill}
                colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
              />
              <StatCard
                label="Today's Medicines"
                value={data.stats.today_medicines_count}
                icon={CalendarCheck}
                colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
              />
              <StatCard
                label="Upcoming Reminders"
                value={data.stats.upcoming_reminders_count}
                icon={AlarmClock}
                colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
              />
              <StatCard
                label="Missed Medicines"
                value={data.stats.missed_medicines_count}
                icon={AlertTriangle}
                colorClass="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Reminder status chart */}
              <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Reminder Status Today
                </h2>
                {data.stats.today_medicines_count === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No medicines scheduled today.
                  </p>
                ) : (
                  <>
                    <Doughnut
                      data={{
                        labels: ["Taken", "Upcoming", "Missed"],
                        datasets: [
                          {
                            data: [
                              data.stats.taken_today_count,
                              data.stats.upcoming_reminders_count,
                              data.stats.missed_medicines_count,
                            ],
                            backgroundColor: [
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                            ],
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        plugins: {
                          legend: { position: "bottom", labels: { boxWidth: 10 } },
                        },
                      }}
                    />
                    <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      Adherence today:{" "}
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        {data.stats.adherence_percent}%
                      </span>
                    </p>
                  </>
                )}
              </div>

              {/* Today's medicines table */}
              <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
                <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Today's Medicines
                </h2>
                <MedicineTable
                  medicines={data.today_medicines}
                  emptyLabel="No medicines scheduled for today."
                />
              </div>

              {/* Upcoming reminders table */}
              <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
                <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Upcoming Reminders
                </h2>
                <MedicineTable
                  medicines={data.upcoming_reminders}
                  emptyLabel="No upcoming reminders."
                />
              </div>

              {/* Missed medicines table */}
              <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Missed Medicines
                </h2>
                <MedicineTable
                  medicines={data.missed_medicines}
                  emptyLabel="Nothing missed. Great job!"
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
