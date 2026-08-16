import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { AuthProvider } from '../src/context/AuthContext';

function renderAtProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<div>Auth Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children when AuthContext has a token', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'a@example.com' }));

    renderAtProtectedRoute();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Auth Page')).not.toBeInTheDocument();
  });

  it('redirects to / when there is no token', () => {
    renderAtProtectedRoute();

    expect(screen.getByText('Auth Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
