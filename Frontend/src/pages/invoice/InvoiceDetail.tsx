import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoices } from '../../contexts/InvoiceContext';
import NavBar from '../../components/NavBar';
import type { Invoice } from '../../types/apiTypes';

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, refreshInvoices, updateStatus } = useInvoices();
  const invoiceId = parseInt(id || '0');
  
  const [invoice, setInvoice] = useState<Invoice | undefined>(
    invoices.find(inv => inv.id === invoiceId)
  );

  useEffect(() => {
    if (!invoice && invoiceId) {
      // If not in context (e.g. direct link), we might need to fetch all or specific
      // For now, refreshing invoices will update the context
      refreshInvoices();
    }
  }, [invoiceId]);

  useEffect(() => {
    setInvoice(invoices.find(inv => inv.id === invoiceId));
  }, [invoices, invoiceId]);

  if (!invoice) {
    return (
      <div>
        <NavBar />
        <div className="container">
          <h1>Cargando factura...</h1>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus(invoice.id, newStatus);
    } catch (err) {
      alert('Error al actualizar el estado');
    }
  };

  return (
    <div>
      <NavBar />
      <div className="container">
        <div className="header-with-back">
          <button className="back-btn" onClick={() => navigate(-1)}>
            &larr; Volver
          </button>
          <h1>Factura {invoice.series}{invoice.number}</h1>
        </div>

        <div className="invoice-detail-grid">
          <div className="invoice-main-card">
            <div className="detail-section">
              <h3>Información General</h3>
              <div className="detail-row">
                <span>Fecha:</span>
                <span>{new Date(invoice.date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span>Estado:</span>
                <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Cliente</h3>
              <p><strong>{invoice.user?.name} {invoice.user?.surname}</strong></p>
              <p>{invoice.user?.email}</p>
              <p>{invoice.user?.dniNif || invoice.user?.nifCif}</p>
            </div>

            <div className="detail-section">
              <h3>Concepto</h3>
              <p>Alquiler Trastero: <strong>{invoice.storageUnit?.number}</strong></p>
              <p>Ubicación: {invoice.storageUnit?.location}</p>
            </div>
          </div>

          <div className="invoice-summary-card">
            <h3>Resumen Económico</h3>
            <div className="summary-row">
              <span>Base Imponible:</span>
              <span>{Number(invoice.taxBase).toFixed(2)}€</span>
            </div>
            <div className="summary-row">
              <span>IVA (21%):</span>
              <span>{Number(invoice.vatAmount).toFixed(2)}€</span>
            </div>
            <div className="summary-row total">
              <span>Total Factura:</span>
              <span>{Number(invoice.total).toFixed(2)}€</span>
            </div>

            <div className="invoice-actions">
              <h4>Acciones</h4>
              {/* 
              {invoice.status === 'PENDING' && (
                <>
                  <button className="primary-btn" onClick={() => handleStatusChange('PAID')}>
                    Marcar como Pagada
                  </button>
                </>
              )}
              {invoice.status === 'PAID' && (
                <button className="danger-btn" onClick={() => handleStatusChange('RETURNED')}>
                  Marcar como Devuelta
                </button>
              )}
              */}
              <button className="outline-btn" onClick={() => window.print()}>
                Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InvoiceDetail;
