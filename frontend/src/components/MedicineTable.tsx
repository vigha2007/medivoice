/**
 * MedicineTable.tsx
 * -------------------
 * Compact table used on the dashboard to list medicines within a
 * given section (today's, upcoming, missed).
 */

import { Clock } from "lucide-react";
import type { Medicine } from "../types/dashboard";

export default function MedicineTable({
  medicines,
  emptyLabel,
}: {
  medicines: Medicine[];
  emptyLabel: string;
}) {
  if (medicines.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-blue-100 text-slate-400 dark:border-slate-700">
            <th className="py-2 pr-4 font-medium">Medicine</th>
            <th className="py-2 pr-4 font-medium">Dosage</th>
            <th className="py-2 pr-4 font-medium">Time</th>
            <th className="py-2 pr-4 font-medium">Frequency</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((m) => (
            <tr
              key={m.id}
              className="border-b border-blue-50 last:border-0 dark:border-slate-700/50"
            >
              <td className="py-2.5 pr-4 font-medium text-slate-700 dark:text-slate-200">
                {m.medicine_name}
              </td>
              <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                {m.dosage || "—"}
              </td>
              <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {m.reminder_time || "—"}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                {m.frequency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
