/**
 * authService.ts
 * ---------------
 * Wraps the backend's /api/auth/* endpoints for use by React components.
 */

import api from "./api";
import type { AuthResponse, User } from "../types";

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function logoutUser(): Promise<void> {
  await api.post("/auth/logout");
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await api.get<{ success: boolean; user: User }>("/auth/me");
  return response.data.user;
}
