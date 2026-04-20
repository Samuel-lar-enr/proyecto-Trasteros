import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrasteros } from '../services/trasteroService';
import type { Trastero } from '../types/trasteroTypes';
import NavBar from '../components/NavBar';

const TrasterosList = () => {
  const navigate = useNavigate();
  const trasteros = getTrasteros();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Trastero>('numero');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedTrasteros = useMemo(() => {
    const filtered = trasteros.filter(t =>
      t.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
  }, [trasteros, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: keyof Trastero) => {
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

  return (
    <div>
      <NavBar />
      <div className="container">
        <h1>Trasteros</h1>
        <input
          type="text"
          placeholder="Buscar por Número o Cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {filteredAndSortedTrasteros.length > 0 ? (
          <table className="trasteros-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('numero')}>Número {sortColumn === 'numero' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('m2')}>M2 {sortColumn === 'm2' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('clienteNombre')}>Nombre del Cliente {sortColumn === 'clienteNombre' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('precio')}>Precio {sortColumn === 'precio' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('estado')}>Estado {sortColumn === 'estado' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTrasteros.map(t => (
                <tr key={t.id} onClick={() => handleRowClick(t.id)} className="clickable-row">
                  <td>{t.numero}</td>
                  <td>{t.m2}</td>
                  <td>{t.clienteNombre}</td>
                  <td>{t.precio}€</td>
                  <td>{t.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-results-message">No se han encontrado resultados para su búsqueda</p>
        )}
      </div>
    </div>
  );
};

export default TrasterosList;