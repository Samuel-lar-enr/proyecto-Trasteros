import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { useTrasteros } from '../contexts/TrasterosContext';
import NavBar from '../components/NavBar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trasteros } = useTrasteros();

  // Estadísticas
  const totalTrasteros = trasteros.length;
  const disponibles = trasteros.filter(t => t.status === 'FREE').length;
  const ocupados = trasteros.filter(t => t.status === 'OCCUPIED').length;
  const reservados = trasteros.filter(t => t.status === 'RESERVED').length;
  const noDisponibles = trasteros.filter(t => t.status === 'NOT_AVAILABLE').length;

  return (
    <div>
      <NavBar />
      <div className="container">
        <div className="admin-dashboard">
          <div className="welcome-section">
            <h1>Panel de Administración</h1>
            <p className="subtitle">Bienvenido, {user?.name ?? user?.email}</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total de Trasteros</h3>
              <p className="stat-number">{totalTrasteros}</p>
            </div>

            <div className="stat-card available">
              <h3>Disponibles</h3>
              <p className="stat-number">{disponibles}</p>
            </div>

            <div className="stat-card occupied">
              <h3>Ocupados</h3>
              <p className="stat-number">{ocupados}</p>
            </div>

            <div className="stat-card reserved">
              <h3>Reservados</h3>
              <p className="stat-number">{reservados}</p>
            </div>

            <div className="stat-card not-available">
              <h3>No Disponibles</h3>
              <p className="stat-number">{noDisponibles}</p>
            </div>
          </div>

          <div className="actions-section">
            <h2>Acciones</h2>
            <div className="action-buttons">
              <button 
                className="primary-btn" 
                onClick={() => navigate('/trasteros/create')}
              >
                Añadir Nuevo Trastero
              </button>
              <button 
                className="secondary-btn" 
                onClick={() => navigate('/trasteros')}
              >
                Ver todos los Trasteros
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
