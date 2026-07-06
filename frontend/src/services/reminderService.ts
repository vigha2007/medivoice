/**
 * reminderService.ts
 * --------------------
 * Wraps the /api/reminders/* endpoints used by the reminder popup.
 */

import api from "./api";
import type { Medicine } from "../types/dashboard";

export async function fetchDueReminders(): Promise<Medicine[]> {
  const response = await api.get<{ due_reminders: Medicine[] }>(
    "/reminders/due"
  );
  return response.data.due_reminders;
}

export async function takeReminder(medicineId: number): Promise<void> {
  await api.post(`/reminders/${medicineId}/take`);
}

export async function skipReminder(medicineId: number): Promise<void> {
  await api.post(`/reminders/${medicineId}/skip`);
}

export async function snoozeReminder(
  medicineId: number,
  minutes: 5 | 10
): Promise<void> {
  await api.post(`/reminders/${medicineId}/snooze`, { minutes });
}
