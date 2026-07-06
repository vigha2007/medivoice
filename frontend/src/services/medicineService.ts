/**
 * medicineService.ts
 * --------------------
 * Wraps the /api/medicines/* CRUD endpoints.
 */

import api from "./api";
import type { Medicine } from "../types/dashboard";

export interface MedicineFormInput {
  medicine_name: string;
  dosage?: string;
  purpose?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  reminder_time?: string; // HH:MM
  frequency: "Daily" | "Weekly" | "Monthly";
  notes?: string;
  status?: "active" | "completed" | "paused";
}

export interface HistoryEntry {
  id: number;
  medicine_id: number;
  taken_time: string;
  status: string;
}

export async function listMedicines(search = ""): Promise<Medicine[]> {
  const response = await api.get<{ medicines: Medicine[] }>("/medicines", {
    params: search ? { search } : {},
  });
  return response.data.medicines;
}

export async function createMedicine(
  input: MedicineFormInput
): Promise<Medicine> {
  const response = await api.post<{ medicine: Medicine }>("/medicines", input);
  return response.data.medicine;
}

export async function updateMedicine(
  id: number,
  input: Partial<MedicineFormInput>
): Promise<Medicine> {
  const response = await api.put<{ medicine: Medicine }>(
    `/medicines/${id}`,
    input
  );
  return response.data.medicine;
}

export async function deleteMedicine(id: number): Promise<void> {
  await api.delete(`/medicines/${id}`);
}

export async function markMedicineTaken(id: number): Promise<void> {
  await api.post(`/medicines/${id}/take`);
}

export async function markMedicineSkipped(id: number): Promise<void> {
  await api.post(`/medicines/${id}/skip`);
}

export async function fetchMedicineHistory(
  id: number
): Promise<{ medicine: Medicine; history: HistoryEntry[] }> {
  const response = await api.get<{ medicine: Medicine; history: HistoryEntry[] }>(
    `/medicines/${id}/history`
  );
  return response.data;
}
