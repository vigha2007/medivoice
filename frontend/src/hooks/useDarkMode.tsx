/**
 * useDarkMode.tsx
 * ----------------
 * Small hook to toggle and persist the dark-mode preference.
 * Applies/removes the `dark` class on <html> which Tailwind's
 * darkMode: "class" strategy relies on.
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "medivoice_theme";

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem(STORAGE_KEY, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(STORAGE_KEY, "light");
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((prev) => !prev) };
}
