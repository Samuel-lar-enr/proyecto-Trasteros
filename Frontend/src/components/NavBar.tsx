import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {isAdmin && (
          <Link to="/admin-dashboard" className="navbar-link admin-link">
            Panel Admin
          </Link>
        )}
        <Link to="/trasteros" className="navbar-link">Trasteros</Link>
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
};

export default NavBar;