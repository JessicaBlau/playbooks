import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CredentialsForm } from '../src/components/CredentialsForm';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ApiError } from '../src/api/client';

// LoginForm and RegisterForm are thin wrappers around CredentialsForm that
// differ only in copy/id-prefix/apiCall (see CredentialsForm.tsx and the two
// wrapper files) — testing CredentialsForm directly here exercises the same
// submit/error logic both pages rely on, including the two element-id
// prefixes ('login-*' / 'register-*') the wrappers configure via `idPrefix`.

function Consumer() {
  const { token, user } = useAuth();
  return (
    <div data-testid="auth-state">
      {token ?? 'no-token'}|{user?.email ?? 'no-user'}
    </div>
  );
}

function renderForm(props: Partial<ComponentProps<typeof CredentialsForm>> = {}) {
  const apiCall = props.apiCall ?? vi.fn();
  return {
    apiCall,
    ...render(
      <AuthProvider>
        <CredentialsForm
          title="Log In"
          idPrefix="login"
          submitLabel="Log In"
          submittingLabel="Logging in…"
          errorFallback="Login failed. Please try again."
          apiCall={apiCall}
          {...props}
        />
        <Consumer />
      </AuthProvider>
    ),
  };
}

describe('CredentialsForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('surfaces an ApiError message via the rendered ErrorBanner on a failed submission', async () => {
    const user = userEvent.setup();
    const apiCall = vi.fn().mockRejectedValue(new ApiError(401, 'Invalid email or password'));
    renderForm({ apiCall });

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    // A failed login must not update auth state.
    expect(screen.getByTestId('auth-state')).toHaveTextContent('no-token|no-user');
  });

  it('falls back to errorFallback text when the rejection is not an ApiError', async () => {
    const user = userEvent.setup();
    const apiCall = vi.fn().mockRejectedValue(new Error('network exploded'));
    renderForm({ apiCall, errorFallback: 'Login failed. Please try again.' });

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Login failed. Please try again.');
  });

  it('logs in and clears any prior error on a successful submission', async () => {
    const user = userEvent.setup();
    const apiCall = vi.fn().mockResolvedValue({
      token: 'new-token',
      user: { id: '1', email: 'user@example.com' },
    });
    renderForm({ apiCall });

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByTestId('auth-state')).toHaveTextContent('new-token|user@example.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('uses idPrefix to derive element ids (login-email/login-password)', () => {
    renderForm();
    expect(document.getElementById('login-email')).not.toBeNull();
    expect(document.getElementById('login-password')).not.toBeNull();
  });
});
