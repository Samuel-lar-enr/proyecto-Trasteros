import { useParams, useNavigate } from 'react-router-dom';
import { getTrasteroById, getTrasteros } from '../services/trasteroService';
import NavBar from '../components/NavBar';

const TrasteroDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const trasteroId = parseInt(id || '0');
    const trastero = getTrasteroById(trasteroId);
    const allTrasteros = getTrasteros();
    const currentIndex = allTrasteros.findIndex(t => t.id === trasteroId);

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
            navigate(`/trasteros/${allTrasteros[currentIndex - 1].id}`);
        }
    };

    const handleNext = () => {
        if (currentIndex < allTrasteros.length - 1) {
            navigate(`/trasteros/${allTrasteros[currentIndex + 1].id}`);
        }
    };

    return (
        <div>
            <NavBar />
            <div className="container">
                <h1>Detalle del Trastero</h1>
                <div className="detail-card">
                    <p><strong>Número:</strong> {trastero.numero}</p>
                    <p><strong>M2:</strong> {trastero.m2}</p>
                    <p><strong>Nombre del Cliente:</strong> {trastero.clienteNombre}</p>
                    <p><strong>Precio:</strong> {trastero.precio}€</p>
                    <p><strong>Estado:</strong> {trastero.estado}</p>
                    {trastero.descripcion && <p><strong>Descripción:</strong> {trastero.descripcion}</p>}
                    {trastero.ubicacion && <p><strong>Ubicación:</strong> {trastero.ubicacion}</p>}
                    {trastero.fechaCreacion && <p><strong>Fecha de Creación:</strong> {trastero.fechaCreacion}</p>}
                </div>
                <div className="navigation-buttons">
                    <button onClick={handlePrevious} disabled={currentIndex === 0} className="nav-btn">Anterior</button>
                    <button onClick={() => navigate('/trasteros')} className="nav-btn">Volver</button>
                    <button onClick={handleNext} disabled={currentIndex === allTrasteros.length - 1} className="nav-btn">Siguiente</button>
                </div>
            </div>
        </div>
    );
};

export default TrasteroDetail;