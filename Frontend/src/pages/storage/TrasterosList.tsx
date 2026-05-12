import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrasteros } from '../../contexts/TrasterosContext';
import { useAuth } from '../../contexts/authContext';
import { contractService } from '../../services/api';
import type { StorageUnit } from '../../types/apiTypes';
import NavBar from '../../components/NavBar';

const TrasterosList = () => {
  const navigate = useNavigate();
  const { trasteros, loading, error, refreshTrasteros } = useTrasteros();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof StorageUnit>('number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // For normal users, we force 'FREE' status
  const [statusFilter, setStatusFilter] = useState<string | 'ALL'>(isAdmin ? 'ALL' : 'FREE');

  const availableFilters = [
    { key: 'number', label: 'Número' },
    { key: 'location', label: 'Ubicación' },
    { key: 'price', label: 'Precio' },
    { key: 'm2', label: 'M2' },
    { key: 'm3', label: 'M3' }
  ];

  const toggleFilter = (filterKey: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterKey) 
        ? prev.filter(f => f !== filterKey)
        : [...prev, filterKey]
    );
  };

  const filteredAndSortedTrasteros = useMemo(() => {
    let filtered = trasteros.filter(t => {
      // Security enforcement: Normal users ONLY see FREE trasteros
      if (!isAdmin && t.status !== 'FREE') return false;

      // Si no hay filtros seleccionados, buscar en todos los campos
      if (selectedFilters.length === 0) {
        return (
          t.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.price.toString().includes(searchTerm.toLowerCase()) ||
          t.m2.toString().includes(searchTerm.toLowerCase()) ||
          t.m3.toString().includes(searchTerm.toLowerCase())
        );
      }

      // Si hay filtros seleccionados, buscar solo en esos campos
      return selectedFilters.some(filterKey => {
        switch (filterKey) {
          case 'number':
            return t.number.toLowerCase().includes(searchTerm.toLowerCase());
          case 'location':
            return t.location.toLowerCase().includes(searchTerm.toLowerCase());
          case 'price':
            return t.price.toString().includes(searchTerm.toLowerCase());
          case 'm2':
            return t.m2.toString().includes(searchTerm.toLowerCase());
          case 'm3':
            return t.m3.toString().includes(searchTerm.toLowerCase());
          default:
            return false;
        }
      });
    });

    // Filtrar por estado si no es "ALL" (Admin only, normal users forced to FREE)
    const effectiveStatus = isAdmin ? statusFilter : 'FREE';
    if (effectiveStatus !== 'ALL') {
      filtered = filtered.filter(t => t.status === effectiveStatus);
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
  }, [trasteros, searchTerm, selectedFilters, sortColumn, sortDirection, statusFilter, isAdmin]);

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

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedFilters([]);
    setStatusFilter(isAdmin ? 'ALL' : 'FREE');
    setSortColumn('number');
    setSortDirection('asc');
  };
  
  const handleTerminateContract = async (contractId: number, trasteroNumber: string) => {
    const confirm = window.confirm(`¿Estás seguro de que deseas terminar el contrato del trastero ${trasteroNumber}? El trastero volverá a estar LIBRE.`);
    if (confirm) {
      try {
        await contractService.terminate(contractId);
        await refreshTrasteros();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error al terminar el contrato');
      }
    }
  };

  return (
    <div>
      <NavBar />
      <div className="container">
        <h1>{isAdmin ? 'Gestión de Trasteros' : 'Trasteros Disponibles'}</h1>
        {loading && <p>Cargando trasteros...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <>
            <div className="search-section">
              <div className="search-container">
                {isAdmin && (
                  <div className="filter-dropdown">
                    <button 
                      className="filter-btn"
                      onClick={() => setSelectedFilters(selectedFilters.length === 0 ? availableFilters.map(f => f.key) : [])}
                    >
                      Filtros {selectedFilters.length > 0 && `(${selectedFilters.length})`}
                    </button>
                    <div className="filter-options">
                      {availableFilters.map(filter => (
                        <label key={filter.key} className="filter-option">
                          <input
                            type="checkbox"
                            checked={selectedFilters.includes(filter.key)}
                            onChange={() => toggleFilter(filter.key)}
                          />
                          <span>{filter.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  placeholder={isAdmin ? "Buscar por número, ubicación..." : "Buscar trastero libre..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="filter-container" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor="statusFilter" className="filter-label" style={{ fontWeight: '600', color: '#374151' }}>
                    Mostrar:
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">Todos los trasteros</option>
                    <option value="FREE">Solo libres</option>
                    <option value="OCCUPIED">Solo ocupados</option>
                    <option value="RESERVED">Solo reservados</option>
                    <option value="NOT_AVAILABLE">No disponibles</option>
                  </select>
                </div>

                {(searchTerm || selectedFilters.length > 0 || statusFilter !== 'ALL' || sortColumn !== 'number' || sortDirection !== 'asc') && (
                  <button 
                    className="reset-btn"
                    onClick={resetFilters}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}

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
                    {user?.role === 'ADMIN' && <th>Acciones</th>}
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
                      {user?.role === 'ADMIN' && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="edit-btn"
                            onClick={() => navigate(`/trasteros/${t.id}/edit`)}
                            title="Editar trastero"
                          >
                            ✏️
                          </button>
                          <button
                            className="billing-btn"
                            onClick={() => navigate(`/trasteros/${t.id}/invoices`)}
                            title="Ver facturación"
                          >
                            📄
                          </button>
                          {t.status === 'OCCUPIED' && t.contracts && t.contracts.length > 0 && (
                            <button
                              className="terminate-btn"
                              onClick={() => handleTerminateContract(t.contracts![0].id, t.number)}
                              title="Terminar contrato"
                            >
                              🛑
                            </button>
                          )}
                        </td>
                      )}
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
