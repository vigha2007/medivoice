/**
 * useNotificationPreferences.tsx
 * ---------------------------------
 * React context exposing the user's notification preferences (browser
 * popups, spoken voice reminders, alarm sound) so both the reminder
 * popup/watcher and the Notifications settings page stay in sync.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from "../services/notificationService";
import { useAuth } from "./useAuth";

interface NotificationPreferencesContextValue {
  preferences: NotificationPreferences;
  isLoading: boolean;
  updatePreference: (
    key: keyof NotificationPreferences,
    value: boolean
  ) => Promise<void>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  browser_enabled: true,
  voice_enabled: true,
  alarm_enabled: true,
};

const NotificationPreferencesContext = createContext<
  NotificationPreferencesContextValue | undefined
>(undefined);

export function NotificationPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetchNotificationPreferences()
      .then(setPreferences)
      .catch(() => {
        // Fall back to defaults if the request fails (e.g. offline)
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const updatePreference = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      const previous = preferences;
      setPreferences((prev) => ({ ...prev, [key]: value }));
      try {
        const updated = await updateNotificationPreferences({ [key]: value });
        setPreferences(updated);
      } catch {
        setPreferences(previous); // revert on failure
      }
    },
    [preferences]
  );

  return (
    <NotificationPreferencesContext.Provider
      value={{ preferences, isLoading, updatePreference }}
    >
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences(): NotificationPreferencesContextValue {
  const ctx = useContext(NotificationPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useNotificationPreferences must be used within a NotificationPreferencesProvider"
    );
  }
  return ctx;
}
