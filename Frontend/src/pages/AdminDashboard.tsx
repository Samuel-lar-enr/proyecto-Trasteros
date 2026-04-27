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

      <style>{`
        .admin-dashboard {
          padding: 2rem 0;
        }

        .welcome-section {
          margin-bottom: 3rem;
        }

        .welcome-section h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .stat-card h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          opacity: 0.9;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 0;
        }

        .stat-card.available {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }

        .stat-card.occupied {
          background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
        }

        .stat-card.reserved {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-card.not-available {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .actions-section {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 12px;
        }

        .actions-section h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .primary-btn, .secondary-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .primary-btn {
          background: #667eea;
          color: white;
        }

        .primary-btn:hover {
          background: #5568d3;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .secondary-btn {
          background: #e0e0e0;
          color: #333;
        }

        .secondary-btn:hover {
          background: #d0d0d0;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
