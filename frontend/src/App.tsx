import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavBar } from './components/NavBar';
import { AuthPage } from './pages/AuthPage';
import { CreatePlaybookPage } from './pages/CreatePlaybookPage';
import { SimulateEventPage } from './pages/SimulateEventPage';

function Layout({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return (
    <>
      {token && <NavBar />}
      <main className="app-shell">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route
              path="/playbooks"
              element={
                <ProtectedRoute>
                  <CreatePlaybookPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulate"
              element={
                <ProtectedRoute>
                  <SimulateEventPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
