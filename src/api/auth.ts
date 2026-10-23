import { apiClient } from './client';

export interface EmployeeSummary {
  matricule: string;
  full_name: string;
  /** URL publique absolue de la photo (plusieurs tuiles l'utilisent comme src). */
  photo: string | null;
  job_title: string | null;
  department: string | null;
  service: string | null;
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

export const MAX_LOGIN_ATTEMPTS = 5;

/** Une tentative ratée de moins, et l'aide au choix devient visible. */
export const LOGIN_HELP_AFTER_ATTEMPTS = 3;

/** Durée de pause infligée au compte après le 5e échec. */
export const LOGIN_LOCK_MINUTES = 45;

export type LoginDenialReason = 'invalid_credentials' | 'not_activated' | 'locked';

export interface LoginDenial {
  reason: LoginDenialReason;
  attemptsLeft: number;
  retryAfterMinutes: number | null;
}

/**
 * Le serveur tient le compteur d'échecs : ses refus portent la raison de l'échec,
 * les tentatives restantes et la durée du blocage. Rien n'est deviné côté client.
 */
export function readLoginDenial(data?: Record<string, unknown>): LoginDenial | null {
  const reason = data?.reason;
  if (reason !== 'invalid_credentials' && reason !== 'not_activated' && reason !== 'locked') return null;

  return {
    reason,
    attemptsLeft: typeof data?.attempts_left === 'number' ? data.attempts_left : MAX_LOGIN_ATTEMPTS,
    retryAfterMinutes: typeof data?.retry_after_minutes === 'number' ? data.retry_after_minutes : null,
  };
}

export interface ActivationReviewPayload {
  verification_token: string;
  captcha_id: string;
  captcha_answer: number;
  /** Date (ou année, côté interface) que l'employé croit se rappeler, pour l'agent RH. */
  self_declared_date?: string;
}

export interface ActivationReviewResponse {
  message: string;
  reference: string;
  expires_at: string | null;
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

/**
 * Secours quand l'employé ne connaît pas sa date : enregistre une demande que le
 * Service RH valide après vérification d'identité. Retourne la référence à présenter.
 */
export async function requestActivationReview(
  payload: ActivationReviewPayload
): Promise<ActivationReviewResponse> {
  const { data } = await apiClient.post<ActivationReviewResponse>('/auth/activate/request', payload);
  return data;
}

export interface PasswordResetPayload {
  matricule: string;
  captcha_id: string;
  captcha_answer: number;
}

/** Mot de passe oublié, étape 1 : le petit calcul qui accompagne la demande. */
export async function fetchForgotPasswordCaptcha(matricule: string): Promise<ActivationCaptcha> {
  const { data } = await apiClient.post<{ captcha: ActivationCaptcha }>('/auth/forgot-password/captcha', {
    matricule,
  });
  return data.captcha;
}

/**
 * Mot de passe oublié, étape 2 : enregistre la demande. Aucun mot de passe n'est
 * modifié ici — l'agent du Service RH en génère un après avoir vérifié l'identité.
 */
export async function requestPasswordReset(payload: PasswordResetPayload): Promise<ActivationReviewResponse> {
  const { data } = await apiClient.post<ActivationReviewResponse>('/auth/forgot-password', payload);
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