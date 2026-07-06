/**
 * Medicines.tsx
 * --------------
 * Module 3: Medicine CRUD
 *
 * Lets the user add, edit, delete, and search medicines, mark doses as
 * taken/skipped, and view per-medicine dose history.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  History as HistoryIcon,
  Loader2,
  Pill,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import MedicineFormModal from "../components/MedicineFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import MedicineHistoryModal from "../components/MedicineHistoryModal";
import { MEDIVOICE_EVENTS, onEvent } from "../utils/eventBus";
import type { Medicine } from "../types/dashboard";
import {
  listMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  markMedicineTaken,
  MedicineFormInput,
} from "../services/medicineService";

export default function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);
  const [historyMedicine, setHistoryMedicine] = useState<Medicine | null>(null);
  const [takingId, setTakingId] = useState<number | null>(null);

  const loadMedicines = useCallback((searchTerm = "") => {
    setIsLoading(true);
    listMedicines(searchTerm)
      .then(setMedicines)
      .catch(() => setError("Unable to load medicines."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  // Refresh when the voice assistant adds/deletes/marks a medicine
  useEffect(() => {
    return onEvent(MEDIVOICE_EVENTS.REFRESH_MEDICINES, () => loadMedicines(search));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMedicines]);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => loadMedicines(search), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleCreateOrUpdate(input: MedicineFormInput) {
    if (editingMedicine) {
      const updated = await updateMedicine(editingMedicine.id, input);
      setMedicines((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      showToast("Medicine updated successfully.");
    } else {
      const created = await createMedicine(input);
      setMedicines((prev) => [created, ...prev]);
      showToast("Medicine added successfully.");
    }
    setShowForm(false);
    setEditingMedicine(null);
  }

  async function handleDelete() {
    if (!deletingMedicine) return;
    try {
      await deleteMedicine(deletingMedicine.id);
      setMedicines((prev) => prev.filter((m) => m.id !== deletingMedicine.id));
      showToast("Medicine deleted.");
    } catch {
      showToast("Failed to delete medicine.");
    } finally {
      setDeletingMedicine(null);
    }
  }

  async function handleMarkTaken(medicine: Medicine) {
    setTakingId(medicine.id);
    try {
      await markMedicineTaken(medicine.id);
      showToast(`${medicine.medicine_name} marked as taken.`);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Unable to mark as taken."
      );
    } finally {
      setTakingId(null);
    }
  }

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Medicines
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage all your medicines in one place.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingMedicine(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </button>
        </div>

        <div className="mb-5 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicines by name or purpose..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading medicines...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && medicines.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-800">
            <Pill className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500 dark:text-slate-400">
              {search
                ? "No medicines match your search."
                : "No medicines added yet."}
            </p>
          </div>
        )}

        {!isLoading && medicines.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medicines.map((m) => (
              <div
                key={m.id}
                className="flex flex-col rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {m.medicine_name}
                    </h3>
                    {m.dosage && (
                      <p className="text-xs text-slate-400">{m.dosage}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                {m.purpose && (
                  <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                    {m.purpose}
                  </p>
                )}

                <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  {m.reminder_time && <span>⏰ {m.reminder_time}</span>}
                  <span>🔁 {m.frequency}</span>
                  {m.start_date && <span>From {m.start_date}</span>}
                  {m.end_date && <span>To {m.end_date}</span>}
                </div>

                <div className="mt-auto flex flex-wrap gap-2">
                  <button
                    onClick={() => handleMarkTaken(m)}
                    disabled={takingId === m.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    {takingId === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Mark Taken
                  </button>
                  <button
                    onClick={() => setHistoryMedicine(m)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-blue-100 dark:bg-slate-700 dark:text-primary-300"
                  >
                    <HistoryIcon className="h-3.5 w-3.5" />
                    History
                  </button>
                  <button
                    onClick={() => {
                      setEditingMedicine(m);
                      setShowForm(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingMedicine(m)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <MedicineFormModal
          initialData={editingMedicine}
          onClose={() => {
            setShowForm(false);
            setEditingMedicine(null);
          }}
          onSubmit={handleCreateOrUpdate}
        />
      )}

      {deletingMedicine && (
        <ConfirmDialog
          title="Delete Medicine"
          message={`Are you sure you want to delete "${deletingMedicine.medicine_name}"? This will also remove its history.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeletingMedicine(null)}
        />
      )}

      {historyMedicine && (
        <MedicineHistoryModal
          medicine={historyMedicine}
          onClose={() => setHistoryMedicine(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-slate-700">
          {toast}
        </div>
      )}
    </div>
  );
}
