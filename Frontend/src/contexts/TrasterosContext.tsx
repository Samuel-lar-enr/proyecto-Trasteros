import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StorageUnit, StorageType } from '../types/apiTypes';
import { storageService } from '../services/api';

interface TrasterosContextType {
  trasteros: StorageUnit[];
  types: StorageType[];
  loading: boolean;
  loadingTypes: boolean;
  error: string | null;
  refreshTrasteros: () => Promise<void>;
  refreshTypes: () => Promise<void>;
  getTrasteroById: (id: number) => StorageUnit | undefined;
}

const TrasterosContext = createContext<TrasterosContextType | undefined>(undefined);

export const TrasterosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trasteros, setTrasteros] = useState<StorageUnit[]>([]);
  const [types, setTypes] = useState<StorageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrasteros = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageService.getAll();
      if (response && response.storageUnits) {
        setTrasteros(response.storageUnits);
      } else if (Array.isArray(response)) {
        setTrasteros(response);
      }
    } catch (err) {
      setError('Error al cargar los trasteros desde la base de datos');
      console.error('Error fetching trasteros:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const response = await storageService.getAllTypes();
      if (response && response.storageTypes) {
        setTypes(response.storageTypes);
      }
    } catch (err) {
      console.error('Error fetching types:', err);
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    fetchTrasteros();
    fetchTypes();
  }, []);

  const refreshTrasteros = async () => {
    await fetchTrasteros();
  };

  const refreshTypes = async () => {
    await fetchTypes();
  };

  const findTrasteroById = (id: number) => {
    return trasteros.find(t => t.id === id);
  };

  return (
    <TrasterosContext.Provider value={{ 
      trasteros, 
      types,
      loading, 
      loadingTypes,
      error, 
      refreshTrasteros, 
      refreshTypes,
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
