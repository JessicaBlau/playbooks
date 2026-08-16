import { loginUser } from '../api/auth';
import { CredentialsForm } from './CredentialsForm';

export function LoginForm() {
  return (
    <CredentialsForm
      title="Log In"
      idPrefix="login"
      submitLabel="Log In"
      submittingLabel="Logging in…"
      errorFallback="Login failed. Please try again."
      apiCall={loginUser}
    />
  );
}
