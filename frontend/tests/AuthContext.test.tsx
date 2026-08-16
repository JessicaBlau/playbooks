import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { apiRequest } from '../src/api/client';

function Consumer() {
  const { token, user } = useAuth();
  return (
    <div data-testid="auth-state">
      {token ?? 'no-token'}|{user?.email ?? 'no-user'}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to a null user (without crashing) when localStorage holds corrupted JSON', () => {
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', '{not valid json');

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // Must not have thrown during the useState initializer; the malformed
    // key falls back to null instead of taking down the whole app.
    expect(screen.getByTestId('auth-state')).toHaveTextContent('some-token|no-user');
    // The corrupt key is cleared, not left behind to fail again next render.
    expect(localStorage.getItem('user')).toBeNull();
  });

  describe('401 response integration (api/client.ts -> authStorage -> AuthContext)', () => {
    it('clears token/user (React state and localStorage) without a full page reload when a request 401s', async () => {
      localStorage.setItem('token', 'stale-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'stale@example.com' }));

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-state')).toHaveTextContent('stale-token|stale@example.com');

      const initialHref = window.location.href;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ error: 'Token expired' }),
      } as Response);

      // Exercise the real production path: apiRequest is what every api/*
      // module calls under the hood, so this drives the actual 401 branch
      // in client.ts (clearSession + notifyUnauthorized), not a simulation
      // of it. Wrapped in act() because notifyUnauthorized() synchronously
      // triggers AuthProvider's logout() state update outside of any
      // React-originated event.
      await act(async () => {
        await expect(apiRequest('/playbooks', { auth: true })).rejects.toThrow('Token expired');
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('no-token|no-user');
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      // The architectural point of the fix: no hard navigation, just a
      // normal React state update/re-render.
      expect(window.location.href).toBe(initialHref);

      fetchSpy.mockRestore();
    });

    it('does not clear session state on a 401 for an unauthenticated (auth: false) request', async () => {
      localStorage.setItem('token', 'stale-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'stale@example.com' }));

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ error: 'Invalid email or password' }),
      } as Response);

      // e.g. a failed login attempt — this must not log out an already
      // logged-in user in another tab/session; client.ts only reacts to
      // 401s on `auth: true` requests.
      await expect(apiRequest('/auth/login', { auth: false })).rejects.toThrow();

      expect(screen.getByTestId('auth-state')).toHaveTextContent('stale-token|stale@example.com');
      expect(localStorage.getItem('token')).toBe('stale-token');
    });
  });
});
