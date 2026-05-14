import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoices } from '../../contexts/InvoiceContext';
import { useTrasteros } from '../../contexts/TrasterosContext';
import NavBar from '../../components/NavBar';

const StorageUnitInvoices = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, loading: loadingInvoices, refreshInvoices, error: invoiceError, deleteInvoice } = useInvoices();
  const { getTrasteroById, loading: loadingTrastero } = useTrasteros();
  
  const trasteroId = parseInt(id || '0');
  const trastero = getTrasteroById(trasteroId);

  const [monthFilter, setMonthFilter] = useState<number>(0); // 0 means "All"
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (trasteroId) {
      refreshInvoices({ storageUnitId: trasteroId });
    }
  }, [trasteroId]);

  // Dynamically generate years from invoices + current year
  const years = useMemo(() => {
    const invoiceYears = invoices.map(inv => new Date(inv.date).getFullYear());
    const currentYear = new Date().getFullYear();
    const uniqueYears = Array.from(new Set([...invoiceYears, currentYear]));
    return [0, ...uniqueYears.sort((a, b) => b - a)]; // 0 for All, then descending
  }, [invoices]);

  const handleCounterInvoice = (id: number) => {
    if (confirm('¿Estás seguro de que quieres generar una contrafactura para anular esta factura? Se creará una nueva factura con importes negativos.')) {
      deleteInvoice(id);
      refreshInvoices({ storageUnitId: trasteroId });
    }
  };

  if (loadingTrastero || (loadingInvoices && invoices.length === 0)) {
    return (
      <div>
        <NavBar />
        <div className="container">
          <div className="spinner"></div>
          <h1 style={{ textAlign: 'center' }}>Cargando facturas...</h1>
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
          <button className="nav-btn" onClick={() => navigate('/trasteros')}>Volver</button>
        </div>
      </div>
    );
  }

  // Triple filter: by trasteroId, date filters AND status
  const visibleInvoices = invoices.filter(inv => {
    const isOurTrastero = inv.storageUnitId === trasteroId;
    if (!isOurTrastero) return false;

    const invDate = new Date(inv.date);
    const matchesYear = yearFilter === 0 || invDate.getFullYear() === yearFilter;
    const matchesMonth = monthFilter === 0 || (invDate.getMonth() + 1) === monthFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

    return matchesYear && matchesMonth && matchesStatus;
  });

  // Calculate totals using visible invoices, excluding those that are PENDING
  const countedInvoices = visibleInvoices.filter(inv => inv.status !== 'PENDING');
  
  const totalTaxBase = countedInvoices.reduce((acc, inv) => acc + Number(inv.taxBase), 0);
  const totalVat = countedInvoices.reduce((acc, inv) => acc + Number(inv.vatAmount), 0);
  const totalAmount = countedInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);

  // Statistics for the summary card
  const stats = {
    total: visibleInvoices.length,
    paid: visibleInvoices.filter(inv => inv.status === 'PAID').length,
    pending: visibleInvoices.filter(inv => inv.status === 'PENDING').length,
    returned: visibleInvoices.filter(inv => inv.status === 'RETURNED').length,
  };

  const months = [
    'Todos', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Pagada';
      case 'PENDING': return 'Pendiente';
      case 'RETURNED': return 'Devuelta';
      default: return status;
    }
  };

  return (
    <div>
      <NavBar />
      <div className="container">
        <div className="header-with-back">
          <button className="back-btn" onClick={() => navigate(`/trasteros/${trasteroId}`)}>
            &larr; Volver al Trastero
          </button>
          <h1>Facturación: Trastero {trastero.number}</h1>
        </div>

        {invoiceError && <div className="error-message">{invoiceError}</div>}

        <div className="filters-container" style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f3f4f6', padding: '15px', borderRadius: '8px' }}>
          <div className="filter-group">
            <label style={{ marginRight: '10px', fontWeight: '600' }}>Año:</label>
            <select value={yearFilter} onChange={(e) => setYearFilter(parseInt(e.target.value))}>
              {years.map(y => (
                <option key={y} value={y}>{y === 0 ? 'Todos' : y}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label style={{ marginRight: '10px', fontWeight: '600' }}>Mes:</label>
            <select value={monthFilter} onChange={(e) => setMonthFilter(parseInt(e.target.value))}>
              {months.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label style={{ marginRight: '10px', fontWeight: '600' }}>Estado:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Todos</option>
              <option value="PAID">Pagadas</option>
              <option value="PENDING">Pendientes</option>
              <option value="RETURNED">Devueltas</option>
            </select>
          </div>
        </div>

        <div className="invoice-list-container">
          {visibleInvoices.length === 0 ? (
            <div className="no-data">No hay facturas que coincidan con los filtros para este trastero.</div>
          ) : (
            <>
              <div className="invoice-cards-grid">
                {visibleInvoices.map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className={`invoice-card ${invoice.status.toLowerCase()}`}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <div className="invoice-card-header">
                      <span className="invoice-number">{invoice.series}{invoice.number}</span>
                      <span className={`status-tag ${invoice.status.toLowerCase()}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    <div className="invoice-card-body">
                      <p><strong>Fecha:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
                      <p><strong>Cliente:</strong> {invoice.user?.name} {invoice.user?.surname}</p>
                      <div className="invoice-amounts">
                        <div><span>Base:</span> {Number(invoice.taxBase).toFixed(2)}€</div>
                        <div><span>IVA:</span> {Number(invoice.vatAmount).toFixed(2)}€</div>
                        <div className="total"><span>Total:</span> {Number(invoice.total).toFixed(2)}€</div>
                      </div>
                    </div>
                    <div className="invoice-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="counter-invoice-btn" onClick={() => handleCounterInvoice(invoice.id)}>
                        Anular (Contrafactura)
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="invoice-totals-section">
                <div className="totals-header">
                  <h3>Resumen de Facturación</h3>
                  <p className="totals-note">Los importes económicos solo incluyen facturas Pagadas o Devueltas.</p>
                </div>
                
                <div className="totals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
                  <div className="totals-column counts">
                    <h4>Volumen</h4>
                    <div className="total-row">
                      <span>Total Facturas:</span>
                      <strong>{stats.total}</strong>
                    </div>
                    <div className="total-row">
                      <span>Pagadas:</span>
                      <strong style={{ color: '#10b981' }}>{stats.paid}</strong>
                    </div>
                    <div className="total-row">
                      <span>Pendientes:</span>
                      <strong style={{ color: '#f59e0b' }}>{stats.pending}</strong>
                    </div>
                    <div className="total-row">
                      <span>Devueltas:</span>
                      <strong style={{ color: '#ef4444' }}>{stats.returned}</strong>
                    </div>
                  </div>

                  <div className="totals-column amounts">
                    <h4>Importes</h4>
                    <div className="total-row">
                      <span>Total Base Imponible:</span>
                      <strong>{totalTaxBase.toFixed(2)}€</strong>
                    </div>
                    <div className="total-row">
                      <span>Total IVA:</span>
                      <strong>{totalVat.toFixed(2)}€</strong>
                    </div>
                    <div className="total-row grand-total">
                      <span>Total Acumulado:</span>
                      <strong>{totalAmount.toFixed(2)}€</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default StorageUnitInvoices;
