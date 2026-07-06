// Types for the Module 2 dashboard endpoint.

export interface Medicine {
  id: number;
  user_id: number;
  medicine_name: string;
  dosage: string | null;
  purpose: string | null;
  start_date: string | null;
  end_date: string | null;
  reminder_time: string | null;
  frequency: string;
  notes: string | null;
  status: string;
  snoozed_until: string | null;
}

export interface DashboardStats {
  total_medicines: number;
  today_medicines_count: number;
  upcoming_reminders_count: number;
  missed_medicines_count: number;
  taken_today_count: number;
  adherence_percent: number;
}

export interface DashboardResponse {
  success: boolean;
  stats: DashboardStats;
  today_medicines: Medicine[];
  upcoming_reminders: Medicine[];
  missed_medicines: Medicine[];
  date: string;
}
