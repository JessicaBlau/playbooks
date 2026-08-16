import { registerUser } from '../api/auth';
import { CredentialsForm } from './CredentialsForm';

export function RegisterForm() {
  return (
    <CredentialsForm
      title="Register"
      idPrefix="register"
      submitLabel="Register"
      submittingLabel="Creating account…"
      errorFallback="Registration failed. Please try again."
      passwordMinLength={8}
      apiCall={registerUser}
    />
  );
}
