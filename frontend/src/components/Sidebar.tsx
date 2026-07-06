/**
 * Sidebar.tsx
 * ------------
 * Persistent left-hand navigation used by all authenticated pages.
 * Highlights the active route and exposes a dark-mode toggle + logout.
 */

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  Bell,
  BellRing,
  Mic,
  BarChart3,
  Settings,
  Stethoscope,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDarkMode } from "../hooks/useDarkMode";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/voice-assistant", label: "Voice Assistant", icon: Mic },
  { to: "/notifications", label: "Notifications", icon: BellRing },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-blue-100 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 border-b border-blue-100 px-6 py-5 dark:border-slate-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <Stethoscope className="h-5 w-5 text-primary-600 dark:text-primary-300" />
        </div>
        <span className="text-lg font-bold text-slate-800 dark:text-white">
          MediVoice
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-700"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-blue-100 px-4 py-4 dark:border-slate-700">
        <button
          onClick={toggle}
          className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>

        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-200">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {user?.name}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-950"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
