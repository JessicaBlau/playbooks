import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
      <Link to="/playbooks">Playbooks</Link>
      <Link to="/simulate">Simulate Event</Link>
      {user && (
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span>{user.email}</span>
          <button onClick={logout}>Log out</button>
        </span>
      )}
    </nav>
  );
}
