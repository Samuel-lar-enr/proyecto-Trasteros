import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StorageUnit } from '../types/apiTypes';
import { storageService } from '../services/api';

interface TrasterosContextType {
  trasteros: StorageUnit[];
  loading: boolean;
  error: string | null;
  refreshTrasteros: () => Promise<void>;
  getTrasteroById: (id: number) => StorageUnit | undefined;
}

const TrasterosContext = createContext<TrasterosContextType | undefined>(undefined);

export const TrasterosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trasteros, setTrasteros] = useState<StorageUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrasteros = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageService.getAll();
      // Verificamos si la respuesta tiene la estructura esperada
      if (response && response.storageUnits) {
        setTrasteros(response.storageUnits);
      } else if (Array.isArray(response)) {
        // Por si acaso la API devuelve directamente el array
        setTrasteros(response);
      }
    } catch (err) {
      setError('Error al cargar los trasteros desde la base de datos');
      console.error('Error fetching trasteros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrasteros();
  }, []);

  const refreshTrasteros = async () => {
    await fetchTrasteros();
  };

  const findTrasteroById = (id: number) => {
    return trasteros.find(t => t.id === id);
  };

  return (
    <TrasterosContext.Provider value={{ 
      trasteros, 
      loading, 
      error, 
      refreshTrasteros, 
      getTrasteroById: findTrasteroById 
    }}>
      {children}
    </TrasterosContext.Provider>
  );
};

export const useTrasteros = () => {
  const context = useContext(TrasterosContext);
  if (context === undefined) {
    throw new Error('useTrasteros must be used within a TrasterosProvider');
  }
  return context;
};
