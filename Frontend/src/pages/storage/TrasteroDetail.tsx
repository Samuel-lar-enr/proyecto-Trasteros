import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrasteros } from '../../contexts/TrasterosContext';
import NavBar from '../../components/NavBar';

const TrasteroDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getTrasteroById, trasteros: allTrasteros, loading, error } = useTrasteros();
    const [activeTab, setActiveTab] = useState<'info' | 'billing'>('info');
    
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
            setActiveTab('info');
        }
    };

    const handleNext = () => {
        if (currentIndex < availableTrasteros.length - 1) {
            navigate(`/trasteros/${availableTrasteros[currentIndex + 1].id}`);
            setActiveTab('info');
        }
    };

    return (
        <div>
            <NavBar />
            <div className="container">
                <div className="detail-header">
                    <h1>Trastero {trastero.number}</h1>
                    <div className="tabs-container">
                        <button 
                            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            Información
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
                            onClick={() => setActiveTab('billing')}
                        >
                            Trasteros Facturación
                        </button>
                    </div>
                </div>

                {activeTab === 'info' ? (
                    <div className="tab-content">
                        <div className="detail-card">
                            <p><strong>Número:</strong> {trastero.number}</p>
                            <p><strong>Metros cuadrados:</strong> {trastero.m2}m²</p>
                            <p><strong>Metros cúbicos:</strong> {trastero.m3}m³</p>
                            <p><strong>Precio:</strong> {trastero.price}€ / mes (IVA Incluido)</p>
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
                ) : (
                    <div className="tab-content">
                        <div className="billing-summary-card">
                            <h3>Gestión de Facturación</h3>
                            <p>Accede al historial completo de facturas, edita facturas pendientes y consulta los totales acumulados de este trastero.</p>
                            <button 
                                className="primary-btn action-btn"
                                onClick={() => navigate(`/trasteros/${trasteroId}/invoices`)}
                            >
                                Ver Historial de Facturación
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default TrasteroDetail;
// Refreshed to fix potential HMR cache issue
