// Shared type definitions used across the MediVoice frontend.

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  success: false;
  message: string;
}
