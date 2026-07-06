/**
 * StatCard.tsx
 * -------------
 * Small reusable card used on the dashboard to show a single metric.
 */

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  colorClass: string; // e.g. "bg-blue-100 text-blue-600"
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
