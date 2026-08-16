import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="app-nav">
      <Link to="/playbooks">Playbooks</Link>
      <Link to="/simulate">Simulate Event</Link>
      {user && (
        <span className="app-nav-account">
          <span>{user.email}</span>
          <button onClick={logout}>Log out</button>
        </span>
      )}
    </nav>
  );
}
