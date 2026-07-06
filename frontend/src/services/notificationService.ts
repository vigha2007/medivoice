/**
 * notificationService.ts
 * -------------------------
 * Wraps the /api/notifications/preferences endpoints.
 */

import api from "./api";

export interface NotificationPreferences {
  browser_enabled: boolean;
  voice_enabled: boolean;
  alarm_enabled: boolean;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await api.get<{ preferences: NotificationPreferences }>(
    "/notifications/preferences"
  );
  return response.data.preferences;
}

export async function updateNotificationPreferences(
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await api.put<{ preferences: NotificationPreferences }>(
    "/notifications/preferences",
    updates
  );
  return response.data.preferences;
}
