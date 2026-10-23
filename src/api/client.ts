import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';

export const TOKEN_STORAGE_KEY = 'kithrm_auth_token';

// Signalé à chaque réponse : `navigator.onLine` ignore les fausses connexions
// (Wi-Fi associé mais sans sortie, portail captif, DNS mort).
export const NETWORK_DOWN_EVENT = 'kithrm:network-down';
export const NETWORK_UP_EVENT = 'kithrm:network-up';

function announceReachability(reachable: boolean) {
  window.dispatchEvent(new Event(reachable ? NETWORK_UP_EVENT : NETWORK_DOWN_EVENT));
}

export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    announceReachability(true);
    return response;
  },
  (error) => {
    if (isNetworkError(error)) announceReachability(false);

    // Session expirée ou révoquée : on ne redirige que si la requête échouée
    // était authentifiée. Les 401 des écrans publics (mot de passe temporaire
    // erroné à l'activation, identifiants de connexion) ne doivent PAS renvoyer
    // l'utilisateur vers /login et lui faire perdre sa saisie.
    const wasAuthenticated = Boolean(error?.config?.headers?.Authorization);

    if (isUnauthorizedError(error) && wasAuthenticated) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
  /** Corps complet de la réponse : les écrans publics y lisent les champs métier (reason, attempts_left…). */
  data?: Record<string, unknown>;
}

export function extractApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;

    if (err.response?.data) {
      return {
        message: err.response.data.message ?? 'Une erreur est survenue.',
        status: err.response.status,
        errors: err.response.data.errors,
        data: err.response.data as Record<string, unknown>,
      };
    }

    if (err.code === 'ECONNABORTED') {
      return { message: 'La requête a expiré. Vérifiez votre connexion.' };
    }

    if (!err.response) {
      return { message: "Impossible de joindre le serveur. Vérifiez votre connexion internet." };
    }
  }

  return { message: 'Une erreur inattendue est survenue.' };
}