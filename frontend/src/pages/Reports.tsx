/**
 * Reports.tsx
 * ------------
 * Module 7: Reports & Charts
 *
 * Lets the user switch between Daily / Weekly / Monthly adherence
 * reports, shows summary stat cards, a bar chart of taken vs missed
 * per day, and a per-medicine adherence breakdown.
 */

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Loader2, CheckCircle2, AlertTriangle, MinusCircle, Percent } from "lucide-react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { fetchReport, ReportResponse } from "../services/reportService";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Period = "daily" | "weekly" | "monthly";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function Reports() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchReport(period)
      .then(setReport)
      .catch(() => setError("Unable to load report."))
      .finally(() => setIsLoading(false));
  }, [period]);

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Reports
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track your medicine adherence over time.
            </p>
          </div>
          <div className="flex rounded-lg border border-blue-100 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  period === p
                    ? "bg-primary-600 text-white"
                    : "text-slate-500 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading report...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {report && (
          <>
            <p className="mb-4 text-sm text-slate-400">
              {report.start_date} → {report.end_date}
            </p>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Taken"
                value={report.summary.total_taken}
                icon={CheckCircle2}
                colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
              />
              <StatCard
                label="Missed"
                value={report.summary.total_missed}
                icon={AlertTriangle}
                colorClass="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
              />
              <StatCard
                label="Skipped"
                value={report.summary.total_skipped}
                icon={MinusCircle}
                colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
              />
              <StatCard
                label="Adherence"
                value={`${report.summary.adherence_percent}%`}
                icon={Percent}
                colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Taken vs Missed
                </h2>
                {report.daily_breakdown.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No data for this period.
                  </p>
                ) : (
                  <Bar
                    data={{
                      labels: report.daily_breakdown.map((d) =>
                        new Date(d.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      ),
                      datasets: [
                        {
                          label: "Taken",
                          data: report.daily_breakdown.map((d) => d.taken),
                          backgroundColor: "#10b981",
                          borderRadius: 4,
                        },
                        {
                          label: "Missed",
                          data: report.daily_breakdown.map((d) => d.missed),
                          backgroundColor: "#ef4444",
                          borderRadius: 4,
                        },
                        {
                          label: "Skipped",
                          data: report.daily_breakdown.map((d) => d.skipped),
                          backgroundColor: "#f59e0b",
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
                      },
                      plugins: {
                        legend: { position: "bottom", labels: { boxWidth: 10 } },
                      },
                    }}
                  />
                )}
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Per Medicine
                </h2>
                {report.per_medicine.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No dose history yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {report.per_medicine.map((m) => (
                      <div key={m.medicine_id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {m.medicine_name}
                          </span>
                          <span className="text-slate-400">
                            {m.adherence_percent}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-blue-50 dark:bg-slate-700">
                          <div
                            className="h-2 rounded-full bg-primary-600"
                            style={{ width: `${m.adherence_percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
