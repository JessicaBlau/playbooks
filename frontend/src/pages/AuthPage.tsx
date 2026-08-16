import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';

export function AuthPage() {
  const { token } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (token) {
    return <Navigate to="/playbooks" replace />;
  }

  return (
    <div>
      <h1>Security Automation Playbook Builder</h1>
      {mode === 'login' ? <LoginForm /> : <RegisterForm />}
      <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
