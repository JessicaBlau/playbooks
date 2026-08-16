import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types/domain';
import {
  clearSession,
  getStoredUser,
  getToken,
  onUnauthorized,
  setSession,
} from '../api/authStorage';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  function login(newToken: string, newUser: User) {
    setSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    clearSession();
    setToken(null);
    setUser(null);
  }

  // api/client.ts has no access to this context (it's a plain HTTP layer,
  // not a React module) — it signals an expired/invalid session via this
  // event instead of reaching into storage/navigation itself. Calling the
  // real logout() here keeps React state in sync, so NavBar/ProtectedRoute
  // update immediately rather than showing a stale logged-in view.
  useEffect(() => onUnauthorized(logout), []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
