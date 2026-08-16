import type { User } from '../types/domain';

// Single source of truth for the auth localStorage keys and the
// session-expiry signal. Previously the key strings ('token'/'user') were
// duplicated between api/client.ts and context/AuthContext.tsx, and the
// transport layer (client.ts) directly manipulated storage and forced a
// full-page reload on 401 — a concern that belongs to the auth layer, not
// the HTTP layer.

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Lets api/client.ts (which has no React/router access, by design) signal
// "the session is no longer valid" without owning navigation or React
// state itself. AuthContext listens and calls its own logout(), which
// updates React state — ProtectedRoute then redirects via the router's
// normal re-render, no full-page reload required.
const UNAUTHORIZED_EVENT = 'checkpoint:unauthorized';

export function notifyUnauthorized(): void {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export function onUnauthorized(handler: () => void): () => void {
  window.addEventListener(UNAUTHORIZED_EVENT, handler);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
}
