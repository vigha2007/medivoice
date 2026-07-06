/**
 * reportService.ts
 * -------------------
 * Wraps the /api/reports endpoint.
 */

import api from "./api";

export interface DailyBreakdownEntry {
  date: string;
  taken: number;
  missed: number;
  skipped: number;
}

export interface PerMedicineEntry {
  medicine_id: number;
  medicine_name: string;
  taken: number;
  missed: number;
  skipped: number;
  adherence_percent: number;
}

export interface ReportResponse {
  success: boolean;
  period: "daily" | "weekly" | "monthly";
  start_date: string;
  end_date: string;
  summary: {
    total_taken: number;
    total_missed: number;
    total_skipped: number;
    adherence_percent: number;
  };
  daily_breakdown: DailyBreakdownEntry[];
  per_medicine: PerMedicineEntry[];
}

export async function fetchReport(
  period: "daily" | "weekly" | "monthly",
  date?: string
): Promise<ReportResponse> {
  const response = await api.get<ReportResponse>("/reports", {
    params: { period, ...(date ? { date } : {}) },
  });
  return response.data;
}
