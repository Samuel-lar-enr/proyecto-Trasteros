import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Invoice, BatchGenerateInvoicesRequest } from '../types/apiTypes';
import { invoiceService } from '../services/api';

interface InvoiceContextType {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  refreshInvoices: (filters?: any) => Promise<void>;
  batchGenerate: (data: BatchGenerateInvoicesRequest) => Promise<{ message: string, createdCount: number, errors?: string[] }>;
  updateStatus: (id: number, status: string) => Promise<void>;
  deleteInvoice: (id: number) => Promise<void>;
  createInvoice: (data: any) => Promise<void>;
  seriesList: string[];
  fetchSeries: () => Promise<void>;
  getNextNumber: (series: string, year?: number) => Promise<string>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [seriesList, setSeriesList] = useState<string[]>([]);

  const fetchInvoices = async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoiceService.getAll(filters);
      if (response && response.invoices) {
        setInvoices(response.invoices);
      }
    } catch (err) {
      setError('Error al cargar las facturas');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeries = async () => {
    try {
      const response = await invoiceService.getSeries();
      setSeriesList(response.series);
    } catch (err) {
      console.error('Error fetching series:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSeries();
  }, []);

  const refreshInvoices = async (filters?: any) => {
    await fetchInvoices(filters);
    await fetchSeries();
  };

  const batchGenerate = async (data: BatchGenerateInvoicesRequest) => {
    setLoading(true);
    try {
      const response = await invoiceService.batchGenerate(data);
      await fetchInvoices(); // Refresh after generation
      await fetchSeries();   // New series might have been used
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al generar facturas en lote';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await invoiceService.updateStatus(id, status);
      // Update local state to avoid full refresh if preferred, 
      // but refreshInvoices is safer
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: status as any } : inv));
    } catch (err) {
      console.error('Error updating invoice status:', err);
      throw err;
    }
  };

  const deleteInvoice = async (id: number) => {
    try {
      const response = await invoiceService.delete(id);
      if (response && response.invoice) {
        setInvoices(prev => [response.invoice, ...prev]);
        await fetchSeries(); // The counter-invoice might have a different series
      }
    } catch (err) {
      console.error('Error in counter-invoice generation:', err);
      throw err;
    }
  };

  const createInvoice = async (data: any) => {
    setLoading(true);
    try {
      await invoiceService.create(data);
      await fetchInvoices();
      await fetchSeries();
    } catch (err) {
      console.error('Error creating invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getNextNumber = async (series: string, year?: number) => {
    try {
      const response = await invoiceService.getNextNumber(series, year);
      return response.nextNumber;
    } catch (err) {
      console.error('Error getting next number:', err);
      throw err;
    }
  };

  return (
    <InvoiceContext.Provider value={{ 
      invoices, 
      loading, 
      error, 
      refreshInvoices, 
      batchGenerate,
      updateStatus,
      deleteInvoice,
      createInvoice,
      seriesList,
      fetchSeries,
      getNextNumber
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};
