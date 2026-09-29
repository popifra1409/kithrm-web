import { apiClient } from './client';

export interface EmployeeSummary {
  matricule: string;
  full_name: string;
  photo: string | null;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  employee: EmployeeSummary | null;
}

export interface LoginPayload {
  matricule: string;
  password: string;
}

export interface ActivatePayload {
  matricule: string;
  temporary_password: string;
  password: string;
  password_confirmation: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function activate(payload: ActivatePayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/activate', payload);
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
  return data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post('/auth/password', payload);
}

export type AccountDeletionReason = 'resignation' | 'death' | 'retirement' | 'other';

export interface DeleteAccountPayload {
  password: string;
  reason: AccountDeletionReason;
  notes?: string;
}

export async function deleteAccount(payload: DeleteAccountPayload): Promise<void> {
  await apiClient.delete('/auth/account', { data: payload });
}