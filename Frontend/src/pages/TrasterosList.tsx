import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrasteros } from '../contexts/TrasterosContext';
import type { StorageUnit } from '../types/apiTypes';
import NavBar from '../components/NavBar';

const TrasterosList = () => {
  const navigate = useNavigate();
  const { trasteros, loading, error } = useTrasteros();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof StorageUnit>('number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [ShowFreeOnly, setShowFreeOnly] = useState(false);

  const filteredAndSortedTrasteros = useMemo(() => {
    let filtered = trasteros.filter(t =>
      t.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.price.toString().includes(searchTerm.toLowerCase())
    );

    if (ShowFreeOnly) {
      filtered = filtered.filter(t => t.status === 'FREE');
    }

    filtered.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [trasteros, searchTerm, sortColumn, sortDirection, ShowFreeOnly]);

  const handleSort = (column: keyof StorageUnit) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (id: number) => {
    navigate(`/trasteros/${id}`);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'FREE': return 'free';
      case 'OCCUPIED': return 'occupied';
      case 'RESERVED': return 'reserved';
      case 'NOT_AVAILABLE': return 'not-available';
      default: return '';
    }
  };


  return (
    <div>
      <NavBar />
      <div className="container">
        <h1>Trasteros</h1>
        {loading && <p>Cargando trasteros...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <>
            <input
              type="text"
              placeholder="Buscar por Número, Ubicación o Precio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div className="filter-container" style={{ marginBottom: 0 }}>
                <input
                  id="showFreeOnly"
                  type="checkbox"
                  checked={ShowFreeOnly}
                  onChange={(e) => setShowFreeOnly(e.target.checked)}
                  className={`filter-checkbox ${ShowFreeOnly ? 'border-green-500' : ''}`}
                />
                <label 
                  htmlFor="showFreeOnly" 
                  className={`filter-label ${ShowFreeOnly ? 'active' : ''}`}
                >
                  Mostrar solo trasteros libres
                </label>
              </div>

              {(searchTerm || ShowFreeOnly || sortColumn !== 'number' || sortDirection !== 'asc') && (
                <button 
                  className="reset-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setShowFreeOnly(false);
                    setSortColumn('number');
                    setSortDirection('asc');
                  }}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>
                  Limpiar filtros y orden
                </button>
              )}
            </div>

            {filteredAndSortedTrasteros.length > 0 ? (
              <table className="trasteros-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('number')}>Número {sortColumn === 'number' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('m2')}>M2 {sortColumn === 'm2' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('m3')}>M3 {sortColumn === 'm3' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('location')}>Ubicación {sortColumn === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('price')}>Precio {sortColumn === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('status')}>Estado {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTrasteros.map(t => (
                    <tr key={t.id} onClick={() => handleRowClick(t.id)} className="clickable-row">
                      <td>{t.number}</td>
                      <td>{t.m2}m²</td>
                      <td>{t.m3}m³</td>
                      <td>{t.location}</td>
                      <td>{t.price}€</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-results-message">No se han encontrado resultados para su búsqueda</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrasterosList;