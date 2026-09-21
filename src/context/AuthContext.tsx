import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  login as apiLogin,
  activate as apiActivate,
  fetchMe,
  logout as apiLogout,
} from '../api/auth';
import type { AuthUser, LoginPayload, ActivatePayload } from '../api/auth';
import { TOKEN_STORAGE_KEY } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  activate: (payload: ActivatePayload) => Promise<void>;
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
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(payload: LoginPayload) {
    const { token, user: loggedInUser } = await apiLogin(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(loggedInUser);
  }

  async function activate(payload: ActivatePayload) {
    const { token, user: activatedUser } = await apiActivate(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(activatedUser);
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // même si l'appel échoue, on déconnecte localement
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, activate, logout }}
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
