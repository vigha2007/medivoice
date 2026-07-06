/**
 * App.tsx
 * --------
 * Top-level router. Public routes (login/register) and protected
 * routes (dashboard, and future modules) are declared here.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { NotificationPreferencesProvider } from "./hooks/useNotificationPreferences";
import ProtectedRoute from "./components/ProtectedRoute";
import ComingSoon from "./components/ComingSoon";
import ReminderWatcher from "./components/ReminderWatcher";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import Reminders from "./pages/Reminders";
import VoiceAssistant from "./pages/VoiceAssistant";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";

function AuthenticatedGlobals() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <ReminderWatcher />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationPreferencesProvider>
          <AuthenticatedGlobals />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicines"
              element={
                <ProtectedRoute>
                  <Medicines />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice-assistant"
              element={
                <ProtectedRoute>
                  <VoiceAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Settings" moduleLabel="Module 8: Settings" />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationPreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
