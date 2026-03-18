import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="dashboard-layout">
      <section className="dashboard-card">
        <p className="eyebrow">Dashboard</p>
        <h1>Bienvenido, {user?.name ?? user?.email ?? 'usuario'}</h1>
        <p className="subtitle">Login correcto. Esta es la pantalla de dashboard inicial.</p>

        <button className="primary-btn" type="button" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </section>
    </main>
  );
};

export default DashboardPage;
