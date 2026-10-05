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

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ActivationCaptcha {
  id: string;
  question: string;
}

export interface ActivationStartResponse {
  message: string;
  verification_token: string;
  expires_in: number;
  captcha: ActivationCaptcha;
}

export interface VerifyActivationPayload {
  verification_token: string;
  recruitment_date: string; // AAAA-MM-JJ
  captcha_id: string;
  captcha_answer: number;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

/** Activation, étape 1/2 : vérifie les identifiants, ne connecte PAS encore l'employé. */
export async function startActivation(payload: ActivatePayload): Promise<ActivationStartResponse> {
  const { data } = await apiClient.post<ActivationStartResponse>('/auth/activate', payload);
  return data;
}

/** Demande un nouveau petit calcul (chaque calcul n'est utilisable qu'une fois). */
export async function refreshActivationCaptcha(verificationToken: string): Promise<ActivationCaptcha> {
  const { data } = await apiClient.post<{ captcha: ActivationCaptcha }>('/auth/activate/captcha', {
    verification_token: verificationToken,
  });
  return data.captcha;
}

/** Activation, étape 2/2 : date de recrutement + calcul. Active le compte et connecte. */
export async function verifyActivation(payload: VerifyActivationPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/activate/verify', payload);
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
  await apiClient.put('/auth/password', payload);
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