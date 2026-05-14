import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Contract } from '../types/apiTypes';
import { contractService } from '../services/api';

interface ContractContextType {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  refreshContracts: (filters?: any) => Promise<void>;
  terminateContract: (id: number) => Promise<void>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await contractService.getAll(filters);
      if (response && response.contracts) {
        setContracts(response.contracts);
      }
    } catch (err) {
      setError('Error al cargar los contratos');
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const refreshContracts = async (filters?: any) => {
    await fetchContracts(filters);
  };

  const terminateContract = async (id: number) => {
    try {
      await contractService.terminate(id);
      await fetchContracts();
    } catch (err) {
      console.error('Error terminating contract:', err);
      throw err;
    }
  };

  return (
    <ContractContext.Provider value={{ 
      contracts, 
      loading, 
      error, 
      refreshContracts,
      terminateContract
    }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  return context;
};
