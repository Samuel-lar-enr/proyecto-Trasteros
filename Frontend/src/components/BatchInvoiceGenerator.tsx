import React, { useState } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';

const BatchInvoiceGenerator = () => {
  const { batchGenerate, loading: generating, error: invoiceError } = useInvoices();
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [series, setSeries] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    try {
      const result = await batchGenerate({ month, year, series });
      setSuccessMessage(`¡Éxito! Se han generado ${result.createdCount} facturas.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setShowBatchForm(false);
    } catch (err) {
      console.error('Error in batch generation:', err);
    }
  };

  return (
    <div className="batch-generator-wrapper">
      <button 
        className={`warning-btn ${showBatchForm ? 'active' : ''}`}
        onClick={() => setShowBatchForm(!showBatchForm)}
      >
        {showBatchForm ? 'Cancelar Generación' : 'Generar Facturas (Lote)'}
      </button>

      {showBatchForm && (
        <div className="batch-form-container">
          <h3>Configuración de Facturación Mensual</h3>
          <form onSubmit={handleBatchGenerate} className="batch-inline-form">
            <div className="form-group">
              <label>Mes</label>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                {months.map((name, i) => (
                  <option key={i+1} value={i+1}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Año</label>
              <input 
                type="number" 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2020"
                max="2100"
              />
            </div>
            <div className="form-group">
              <label>Serie</label>
              <input 
                type="text" 
                value={series} 
                onChange={(e) => setSeries(e.target.value)}
                placeholder="Ej: A-2024"
              />
            </div>
            <div className="form-submit">
              <button type="submit" className="primary-btn" disabled={generating}>
                {generating ? 'Procesando...' : 'Iniciar Generación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {successMessage && <div className="success-banner">{successMessage}</div>}
      {invoiceError && <div className="error-banner">{invoiceError}</div>}
    </div>
  );
};

export default BatchInvoiceGenerator;
