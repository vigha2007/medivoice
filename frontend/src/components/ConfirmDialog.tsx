/**
 * ConfirmDialog.tsx
 * -------------------
 * Small reusable confirmation dialog (used for delete actions).
 */

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  isDangerous = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isDangerous
                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300"
                : "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">
            {title}
          </h2>
        </div>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold text-white ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
