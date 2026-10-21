import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  login as apiLogin,
  verifyActivation as apiVerifyActivation,
  fetchMe,
  logout as apiLogout,
} from '../api/auth';
import type { AuthUser, LoginPayload, VerifyActivationPayload } from '../api/auth';
import { isUnauthorizedError, TOKEN_STORAGE_KEY } from '../api/client';

const USER_STORAGE_KEY = 'kithrm_auth_user';

function rememberUser(user: AuthUser | null) {
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE_KEY);
}

/** Identité de la dernière connexion réussie, pour ne pas déconnecter une agent hors ligne. */
function cachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.id === 'number' ? (parsed as AuthUser) : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  /** Étape 2/2 de l'activation : si elle réussit, l'employé est connecté. */
  completeActivation: (payload: VerifyActivationPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await fetchMe();
        setUser(me);
        rememberUser(me);
      } catch (error) {
        // Une coupure réseau ne doit pas effacer la session : sans cela, la
        // moindre micro-coupure renvoyait l'agent à l'écran de connexion.
        if (isUnauthorizedError(error)) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          rememberUser(null);
        } else {
          setUser(cachedUser());
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(payload: LoginPayload) {
    const { token, user: loggedInUser } = await apiLogin(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(loggedInUser);
    rememberUser(loggedInUser);
  }

  async function completeActivation(payload: VerifyActivationPayload) {
    const { token, user: activatedUser } = await apiVerifyActivation(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(activatedUser);
    rememberUser(activatedUser);
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // même si l'appel échoue, on déconnecte localement
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      rememberUser(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, completeActivation, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
