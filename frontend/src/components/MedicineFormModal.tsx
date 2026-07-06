/**
 * MedicineFormModal.tsx
 * -----------------------
 * Modal form used for both adding a new medicine and editing an
 * existing one. Parent decides which mode by passing `initialData`.
 */

import { useState, FormEvent, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { Medicine } from "../types/dashboard";
import type { MedicineFormInput } from "../services/medicineService";

interface MedicineFormModalProps {
  initialData?: Medicine | null;
  onClose: () => void;
  onSubmit: (input: MedicineFormInput) => Promise<void>;
}

const EMPTY_FORM: MedicineFormInput = {
  medicine_name: "",
  dosage: "",
  purpose: "",
  start_date: "",
  end_date: "",
  reminder_time: "",
  frequency: "Daily",
  notes: "",
};

export default function MedicineFormModal({
  initialData,
  onClose,
  onSubmit,
}: MedicineFormModalProps) {
  const [form, setForm] = useState<MedicineFormInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        medicine_name: initialData.medicine_name,
        dosage: initialData.dosage || "",
        purpose: initialData.purpose || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        reminder_time: initialData.reminder_time || "",
        frequency: initialData.frequency as MedicineFormInput["frequency"],
        notes: initialData.notes || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [initialData]);

  function update<K extends keyof MedicineFormInput>(
    key: K,
    value: MedicineFormInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.medicine_name.trim()) {
      setError("Medicine name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Send empty optional fields as undefined so the backend keeps them null
      const payload: MedicineFormInput = {
        ...form,
        dosage: form.dosage || undefined,
        purpose: form.purpose || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        reminder_time: form.reminder_time || undefined,
        notes: form.notes || undefined,
      };
      await onSubmit(payload);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {initialData ? "Edit Medicine" : "Add Medicine"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Medicine Name *
            </label>
            <input
              type="text"
              required
              value={form.medicine_name}
              onChange={(e) => update("medicine_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600"
              placeholder="e.g. Paracetamol"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Dosage
              </label>
              <input
                type="text"
                value={form.dosage}
                onChange={(e) => update("dosage", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600"
                placeholder="e.g. 500mg"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Reminder Time
              </label>
              <input
                type="time"
                value={form.reminder_time}
                onChange={(e) => update("reminder_time", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Purpose
            </label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => update("purpose", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600"
              placeholder="e.g. Fever, Infection"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Start Date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => update("start_date", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                End Date
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => update("end_date", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Frequency
            </label>
            <select
              value={form.frequency}
              onChange={(e) =>
                update(
                  "frequency",
                  e.target.value as MedicineFormInput["frequency"]
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Add Medicine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
