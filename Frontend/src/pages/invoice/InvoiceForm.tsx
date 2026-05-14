import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../../contexts/InvoiceContext';
import { useContracts } from '../../contexts/ContractContext';
import NavBar from '../../components/NavBar';
import type { User, StorageUnit, CreateInvoiceRequest, Contract } from '../../types/apiTypes';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { createInvoice, seriesList, getNextNumber, loading: invoiceLoading } = useInvoices();
  const { contracts: activeContracts, loading: contractsLoading } = useContracts();
  
  const [isFetchingNumber, setIsFetchingNumber] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateInvoiceRequest>>({
    number: '',
    series: '',
    userId: 0,
    storageUnitId: 0,
    taxBase: 0,
    vatAmount: 0,
    total: 0,
    status: 'PENDING',
    date: new Date().toISOString().split('T')[0]
  });

  // Get unique clients from active contracts (already filtered by isActive: true in ContractContext usually, but we filter here too if needed)
  const clients = useMemo(() => {
    const active = activeContracts.filter(c => c.isActive);
    const uniqueUsersMap = new Map<number, User>();
    active.forEach(c => {
      if (c.user && !uniqueUsersMap.has(c.userId)) {
        uniqueUsersMap.set(c.userId, c.user);
      }
    });
    return Array.from(uniqueUsersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeContracts]);

  // Get trasteros for the selected client
  const clientTrasteros = useMemo(() => {
    if (!formData.userId) return [];
    return activeContracts
      .filter(c => c.isActive && c.userId === formData.userId)
      .map(c => c.storageUnit)
      .filter((u): u is StorageUnit => !!u);
  }, [formData.userId, activeContracts]);

  // Fetch next number when series or date changes
  useEffect(() => {
    const fetchNextNumber = async () => {
      setIsFetchingNumber(true);
      try {
        const year = formData.date ? new Date(formData.date).getFullYear() : new Date().getFullYear();
        const nextNum = await getNextNumber(formData.series || '', year);
        setFormData(prev => ({ ...prev, number: nextNum }));
      } catch (err) {
        console.error('Error fetching next number:', err);
      } finally {
        setIsFetchingNumber(false);
      }
    };

    const debounceTimer = setTimeout(fetchNextNumber, 300);
    return () => clearTimeout(debounceTimer);
  }, [formData.series, formData.date, getNextNumber]);

  const updatePrices = (data: any, priceValue: string | number) => {
    const price = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
    data.total = price;
    const taxBase = price / 1.21;
    data.taxBase = parseFloat(taxBase.toFixed(2));
    data.vatAmount = parseFloat((price - taxBase).toFixed(2));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'userId') {
        const userId = parseInt(value);
        newData.userId = userId;
        
        // Find contracts for this user
        const userContracts = activeContracts.filter(c => c.userId === userId);
        
        if (userContracts.length === 1) {
          // Auto-select trastero if only one
          const unit = userContracts[0].storageUnit;
          if (unit) {
            newData.storageUnitId = unit.id;
            updatePrices(newData, userContracts[0].currentPrice);
          }
        } else {
          // Reset trastero and prices if multiple or none
          newData.storageUnitId = 0;
          newData.taxBase = 0;
          newData.vatAmount = 0;
          newData.total = 0;
        }
      } else if (name === 'storageUnitId') {
        const unitId = parseInt(value);
        newData.storageUnitId = unitId;
        
        // Find contract for this unit and user to get currentPrice
        const contract = activeContracts.find(c => c.userId === prev.userId && c.storageUnitId === unitId);
        if (contract) {
          updatePrices(newData, contract.currentPrice);
        }
      } else if (name === 'taxBase') {
        const taxBase = parseFloat(value) || 0;
        const vatAmount = taxBase * 0.21;
        newData.vatAmount = parseFloat(vatAmount.toFixed(2));
        newData.total = parseFloat((taxBase + vatAmount).toFixed(2));
      } else if (name === 'total') {
        const total = parseFloat(value) || 0;
        const taxBase = total / 1.21;
        newData.taxBase = parseFloat(taxBase.toFixed(2));
        newData.vatAmount = parseFloat((total - taxBase).toFixed(2));
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.userId || !formData.storageUnitId || !formData.number) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    try {
      const submissionData = {
        ...formData,
        date: formData.date ? new Date(formData.date).toISOString() : undefined
      } as CreateInvoiceRequest;

      await createInvoice(submissionData);
      navigate('/invoices/manage');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la factura.');
    }
  };

  if (contractsLoading) {
    return (
      <div>
        <NavBar />
        <div className="container">
          <div className="spinner"></div>
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="container">
        <div className="header-actions">
          <h1>Nueva Factura Individual</h1>
          <button className="back-btn" onClick={() => navigate('/invoices/manage')}>
            &larr; Volver
          </button>
        </div>

        <div className="management-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {error && <p className="error-text" style={{ marginBottom: '1rem' }}>{error}</p>}
          
          <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label htmlFor="userId" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Cliente (con contrato activo) *</label>
              <select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="0">Seleccionar cliente...</option>
                {clients.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.surname} ({user.dniNif || user.nifCif || user.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label htmlFor="storageUnitId" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Trastero *</label>
              <select
                id="storageUnitId"
                name="storageUnitId"
                value={formData.storageUnitId}
                onChange={handleChange}
                required
                disabled={!formData.userId}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: !formData.userId ? '#f3f4f6' : 'white' }}
              >
                <option value="0">{!formData.userId ? 'Selecciona primero un cliente' : 'Seleccionar trastero...'}</option>
                {clientTrasteros.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    #{unit.number} - {unit.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="series" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Serie</label>
              <input
                type="text"
                id="series"
                name="series"
                list="series-list"
                value={formData.series}
                onChange={handleChange}
                placeholder="A"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
              <datalist id="series-list">
                {seriesList.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="number" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Número * {isFetchingNumber && <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>(calculando...)</span>}
              </label>
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                required
                placeholder="2024-0001"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: isFetchingNumber ? '#f9fafb' : 'white' }}
              />
            </div>

            <div>
              <label htmlFor="date" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Fecha</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Estado</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagada</option>
                <option value="RETURNED">Devuelta</option>
              </select>
            </div>

            <div>
              <label htmlFor="taxBase" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Base Imponible (€)</label>
              <input
                type="number"
                step="0.01"
                id="taxBase"
                name="taxBase"
                value={formData.taxBase}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label htmlFor="total" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Total (IVA incl.) (€)</label>
              <input
                type="number"
                step="0.01"
                id="total"
                name="total"
                value={formData.total}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={invoiceLoading}
              >
                {invoiceLoading ? 'Creando...' : 'Crear Factura'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
