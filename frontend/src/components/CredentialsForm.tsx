import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import type { AuthResponse } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from './ErrorBanner';

interface CredentialsFormProps {
  title: string;
  idPrefix: string;
  submitLabel: string;
  submittingLabel: string;
  errorFallback: string;
  passwordMinLength?: number;
  apiCall: (email: string, password: string) => Promise<AuthResponse>;
}

// Shared by LoginForm and RegisterForm, which differ only in copy, the
// element id prefix, the API call, and whether a minLength applies to the
// password field — everything else (state, submit handling, error display,
// markup) was previously duplicated between the two.
export function CredentialsForm({
  title,
  idPrefix,
  submitLabel,
  submittingLabel,
  errorFallback,
  passwordMinLength,
  apiCall,
}: CredentialsFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiCall(email, password);
      login(result.token, result.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : errorFallback);
    } finally {
      setSubmitting(false);
    }
  }

  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;

  return (
    <form onSubmit={handleSubmit}>
      <h2>{title}</h2>
      <ErrorBanner message={error} />
      <div>
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor={passwordId}>Password</label>
        <input
          id={passwordId}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={passwordMinLength}
        />
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
