/**
 * api.ts
 * -------
 * Central Axios instance used by every service module.
 * Automatically attaches the JWT token (if present) to every request,
 * and redirects to /login on a 401 (expired/invalid token) response.
 */

import axios from "axios";

// In development, Vite's dev-server proxy forwards "/api" to the local
// Flask backend (see vite.config.ts). In production, the frontend and
// backend are deployed as separate Render services on different
// domains, so we point at the backend's absolute URL instead, supplied
// via a build-time env var (see .env.production / Render dashboard).
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request interceptor: attach JWT token ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medivoice_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: handle expired/invalid sessions ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("medivoice_token");
      localStorage.removeItem("medivoice_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
