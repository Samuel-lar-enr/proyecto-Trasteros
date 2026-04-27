import { useParams, useNavigate } from 'react-router-dom';
import { useTrasteros } from '../contexts/TrasterosContext';
import NavBar from '../components/NavBar';

const TrasteroDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getTrasteroById, trasteros: allTrasteros, loading, error } = useTrasteros();
    const trasteroId = parseInt(id || '0');
    const trastero = getTrasteroById(trasteroId);
    const currentIndex = allTrasteros.filter(t => t.status === 'FREE').findIndex(t => t.id === trasteroId);
    const availableTrasteros = allTrasteros.filter(t => t.status === 'FREE');

    const getStatusClass = (status: string) => {
    switch (status) {
      case 'FREE': return 'free';
      case 'OCCUPIED': return 'occupied';
      case 'RESERVED': return 'reserved';
      case 'NOT_AVAILABLE': return 'not-available';
      default: return '';
    }}

    if (loading) {
        return (
            <div>
                <NavBar />
                <div className="container">
                    <h1>Cargando...</h1>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <NavBar />
                <div className="container">
                    <h1>Error: {error}</h1>
                </div>
            </div>
        );
    }

    if (!trastero) {
        return (
            <div>
                <NavBar />
                <div className="container">
                    <h1>Trastero no encontrado</h1>
                </div>
            </div>
        );
    }

    const handlePrevious = () => {
        if (currentIndex > 0) {
            navigate(`/trasteros/${availableTrasteros[currentIndex - 1].id}`);
        }
    };

    const handleNext = () => {
        if (currentIndex < availableTrasteros.length - 1) {
            navigate(`/trasteros/${availableTrasteros[currentIndex + 1].id}`);
        }
    };

    return (
        <div>
            <NavBar />
            <div className="container">
                <h1>Detalle del Trastero</h1>
                <div className="detail-card">
                    <p><strong>Número:</strong> {trastero.number}</p>
                    <p><strong>Metros cuadrados:</strong> {trastero.m2}m²</p>
                    <p><strong>Metros cúbicos:</strong> {trastero.m3}m³</p>
                    <p><strong>Precio:</strong> {trastero.price}€ / mes</p>
                    <p><strong>Estado:</strong> <span className={`status-badge ${getStatusClass(trastero.status)}`}>{trastero.status}</span></p>
                    {trastero.location && <p><strong>Ubicación:</strong> {trastero.location}</p>}
                    {trastero.observations && <p><strong>Observaciones:</strong> {trastero.observations}</p>}
                </div>
                <div className="navigation-buttons">
                    <button onClick={handlePrevious} disabled={currentIndex === 0} className="nav-btn">Anterior</button>
                    <button onClick={() => navigate('/trasteros')} className="nav-btn">Volver</button>
                    <button onClick={handleNext} disabled={currentIndex === availableTrasteros.length - 1} className="nav-btn">Siguiente</button>
                </div>
            </div>
        </div>
    );
};

export default TrasteroDetail;