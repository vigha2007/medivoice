/**
 * MedicineHistoryModal.tsx
 * ---------------------------
 * Shows the dose history (taken/missed/skipped) for a single medicine.
 */

import { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { fetchMedicineHistory, HistoryEntry } from "../services/medicineService";
import type { Medicine } from "../types/dashboard";

function StatusIcon({ status }: { status: string }) {
  if (status === "taken")
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "missed") return <XCircle className="h-4 w-4 text-red-500" />;
  return <MinusCircle className="h-4 w-4 text-amber-500" />;
}

export default function MedicineHistoryModal({
  medicine,
  onClose,
}: {
  medicine: Medicine;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchMedicineHistory(medicine.id)
      .then((res) => {
        if (isMounted) setHistory(res.history);
      })
      .catch(() => {
        if (isMounted) setError("Unable to load history.");
      });
    return () => {
      isMounted = false;
    };
  }, [medicine.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {medicine.medicine_name} — History
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {!history && !error && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history...
          </div>
        )}

        {history && history.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            No history recorded yet.
          </p>
        )}

        {history && history.length > 0 && (
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-blue-50 px-3 py-2 text-sm dark:border-slate-700"
              >
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <StatusIcon status={h.status} />
                  {new Date(h.taken_time).toLocaleString()}
                </span>
                <span className="capitalize text-slate-400">{h.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
