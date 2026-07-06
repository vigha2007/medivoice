/**
 * ReminderWatcher.tsx
 * ---------------------
 * Mounted once near the root of the authenticated app. Polls
 * GET /api/reminders/due every 20 seconds and shows a ReminderPopup
 * (alarm + voice + actions) for each due medicine, one at a time.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import ReminderPopup from "./ReminderPopup";
import type { Medicine } from "../types/dashboard";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import {
  fetchDueReminders,
  takeReminder,
  skipReminder,
  snoozeReminder,
} from "../services/reminderService";

const POLL_INTERVAL_MS = 20000;

export default function ReminderWatcher() {
  const [queue, setQueue] = useState<Medicine[]>([]);
  const shownIdsRef = useRef<Set<number>>(new Set());
  const { preferences } = useNotificationPreferences();
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  const poll = useCallback(async () => {
    try {
      const due = await fetchDueReminders();
      setQueue((prevQueue) => {
        const currentIds = new Set(prevQueue.map((m) => m.id));
        const newOnes = due.filter(
          (m) => !currentIds.has(m.id) && !shownIdsRef.current.has(m.id)
        );

        if (newOnes.length > 0) {
          // Fire a browser notification alongside the in-app popup, if
          // both the OS permission and the user's preference allow it.
          newOnes.forEach((m) => {
            shownIdsRef.current.add(m.id);
            if (
              preferencesRef.current.browser_enabled &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("MediVoice Reminder", {
                body: `It's time to take your ${m.medicine_name}.`,
                icon: "/favicon.svg",
              });
            }
          });
          return [...prevQueue, ...newOnes];
        }
        return prevQueue;
      });
    } catch {
      // Silently ignore poll failures (e.g. token expiry is handled globally)
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  function removeFromQueue(id: number) {
    setQueue((prev) => prev.filter((m) => m.id !== id));
    // Allow it to be re-shown on a future day / future due cycle
    setTimeout(() => shownIdsRef.current.delete(id), POLL_INTERVAL_MS * 2);
  }

  const current = queue[0];
  if (!current) return null;

  return (
    <ReminderPopup
      medicine={current}
      onTake={async () => {
        await takeReminder(current.id);
        removeFromQueue(current.id);
      }}
      onSkip={async () => {
        await skipReminder(current.id);
        removeFromQueue(current.id);
      }}
      onSnooze={async (minutes) => {
        await snoozeReminder(current.id, minutes);
        removeFromQueue(current.id);
      }}
    />
  );
}
