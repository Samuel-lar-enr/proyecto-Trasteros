import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../../contexts/InvoiceContext';
import NavBar from '../../components/NavBar';
import BatchInvoiceGenerator from '../../components/BatchInvoiceGenerator';

const InvoiceManagement = () => {
  const navigate = useNavigate();
  const { invoices, loading, error, refreshInvoices, deleteInvoice } = useInvoices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'ALL'>('ALL');
  const [monthFilter, setMonthFilter] = useState<number>(0); // 0 means "All"
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    refreshInvoices({});
  }, []);

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
      deleteInvoice(id);
      refreshInvoices({});
    }
  };

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(inv => {
      const search = searchTerm.toLowerCase();
      const invoiceNum = `${inv.series || ''}${inv.number}`.toLowerCase();
      const userName = `${inv.user?.name || ''} ${inv.user?.surname || ''}`.toLowerCase();
      const trasteroNum = inv.storageUnit?.number?.toLowerCase() || '';

      const matchesSearch = 
        invoiceNum.includes(search) || 
        userName.includes(search) || 
        trasteroNum.includes(search);
      
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

      const invDate = new Date(inv.date);
      const matchesYear = yearFilter === 0 || invDate.getFullYear() === yearFilter;
      const matchesMonth = monthFilter === 0 || (invDate.getMonth() + 1) === monthFilter;

      return matchesSearch && matchesStatus && matchesYear && matchesMonth;
    });

    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'number':
          aVal = `${a.series}${a.number}`;
          bVal = `${b.series}${b.number}`;
          break;
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'client':
          aVal = `${a.user?.name} ${a.user?.surname}`;
          bVal = `${b.user?.name} ${b.user?.surname}`;
          break;
        case 'total':
          aVal = Number(a.total);
          bVal = Number(b.total);
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, searchTerm, statusFilter, monthFilter, yearFilter, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const months = [
    'Todos los meses', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Dynamically generate years from invoices + current year
  const years = useMemo(() => {
    const invoiceYears = invoices.map(inv => new Date(inv.date).getFullYear());
    const currentYear = new Date().getFullYear();
    const uniqueYears = Array.from(new Set([...invoiceYears, currentYear]));
    return [0, ...uniqueYears.sort((a, b) => b - a)]; // 0 for All, then descending years
  }, [invoices]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Pagada';
      case 'PENDING': return 'Pendiente';
      case 'RETURNED': return 'Devuelta';
      default: return status;
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setMonthFilter(0);
    setYearFilter(new Date().getFullYear());
    setSortColumn('date');
    setSortDirection('desc');
  };

  return (
    <div>
      <NavBar />
      <div className="container">
        <div className="header-actions">
          <h1>Gestión Global de Facturas</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
              &larr; Volver al Panel
            </button>
          </div>
        </div>

        <div className="management-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: '1rem' }}>Generación Rápida</h3>
          <BatchInvoiceGenerator />
          <h3 style={{ marginTop: '1rem', marginBottom: '1rem' }}>Generación Individual</h3>
          <button className="create-btn w-full text-center flex justify-center " onClick={() => navigate('/invoices/create')}>
              + Nueva Factura
          </button>
        </div>

        <div className="management-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Historial Completo</h3>
            
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              <div className="search-container" style={{ margin: 0, minWidth: '300px' }}>
                <input
                  type="text"
                  placeholder="Buscar por factura, cliente o trastero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  style={{ width: '100%' }}
                />
              </div>

              <select 
                value={yearFilter} 
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
                className="filter-select"
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #d1d5db', padding: '0 10px', minWidth: '100px' }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y === 0 ? 'Todos los años' : y}</option>
                ))}
              </select>

              <select 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(parseInt(e.target.value))}
                className="filter-select"
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #d1d5db', padding: '0 10px', minWidth: '160px' }}
              >
                {months.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
                style={{ height: '42px', borderRadius: '8px', border: '1px solid #d1d5db', padding: '0 10px', minWidth: '150px' }}
              >
                <option value="ALL">Todos los estados</option>
                <option value="PAID">Pagadas</option>
                <option value="PENDING">Pendientes</option>
                <option value="RETURNED">Devueltas</option>
              </select>

              {(searchTerm || statusFilter !== 'ALL' || monthFilter !== 0 || yearFilter !== new Date().getFullYear()) && (
                <button className="reset-btn" onClick={resetFilters}>Limpiar</button>
              )}
            </div>
          </div>

          {loading && invoices.length === 0 ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>Cargando facturas...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('number')} style={{ cursor: 'pointer' }}>
                      Número {sortColumn === 'number' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                      Fecha {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('client')} style={{ cursor: 'pointer' }}>
                      Cliente {sortColumn === 'client' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Trastero</th>
                    <th onClick={() => handleSort('total')} style={{ cursor: 'pointer' }}>
                      Total {sortColumn === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                      Estado {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="no-data">No se han encontrado facturas con estos criterios.</td>
                    </tr>
                  ) : (
                    filteredAndSortedInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td><strong>{invoice.series}{invoice.number}</strong></td>
                        <td>{new Date(invoice.date).toLocaleDateString()}</td>
                        <td>{invoice.user?.name} {invoice.user?.surname}</td>
                        <td>#{invoice.storageUnit?.number}</td>
                        <td>{Number(invoice.total).toFixed(2)}€</td>
                        <td>
                          <span className={`status-tag ${invoice.status.toLowerCase()}`}>
                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="view-btn"
                              onClick={() => navigate(`/invoices/${invoice.id}`)}
                              title="Ver detalle"
                            >
                              👁️
                            </button>
                            {invoice.status === 'PENDING' && (
                              <button 
                                className="delete-btn" 
                                onClick={() => handleDelete(invoice.id)}
                                title="Eliminar factura"
                                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;
