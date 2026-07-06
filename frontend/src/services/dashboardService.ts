/**
 * dashboardService.ts
 * ---------------------
 * Wraps the /api/dashboard/* endpoints.
 */

import api from "./api";
import type { DashboardResponse } from "../types/dashboard";

export async function fetchDashboardStats(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>("/dashboard/stats");
  return response.data;
}
