import axios from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  MeResponse,
  UpdateProfileRequest,
  GoogleLoginRequest,
  GenericResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResendActivationRequest,
  StorageUnit,
  Contract,
  Invoice,
  CreateContractRequest,
  BatchGenerateInvoicesRequest,
  IpcBatch,
  ApplyIpcRequest,
  UpdateStorageUnitRequest
} from '../types/apiTypes';

/**
 * Configuración de instancia de Axios
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor para incluir el token JWT en todas las peticiones
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Servicios de Autenticación y Usuarios
 */
export const authService = {
  /**
   * Iniciar sesión con email y contraseña
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    return res.data;
  },

  /**
   * Registro público de nuevo usuario
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  /**
   * Autenticación con Google
   */
  googleLogin: async (data: GoogleLoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/google', data);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    return res.data;
  },

  /**
   * Obtener datos del usuario actual (basado en el token)
   */
  getMe: async (): Promise<MeResponse> => {
    const res = await api.get<MeResponse>('/auth/me');
    return res.data;
  },

  /**
   * Actualizar perfil / Completar datos
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<AuthResponse> => {
    const res = await api.put<AuthResponse>('/auth/profile', data);
    return res.data;
  },

  /**
   * Activar cuenta mediante token del email
   */
  activateAccount: async (token: string): Promise<GenericResponse> => {
    const res = await api.get<GenericResponse>(`/auth/activate/${token}`);
    return res.data;
  },

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<GenericResponse> => {
    const res = await api.post<GenericResponse>('/auth/forgot-password', data);
    return res.data;
  },

  /**
   * Restablecer contraseña usando token
   */
  resetPassword: async (token: string, data: ResetPasswordRequest): Promise<GenericResponse> => {
    const res = await api.post<GenericResponse>(`/auth/reset-password/${token}`, data);
    return res.data;
  },

  /**
   * Reenviar email de activación
   */
  resendActivation: async (data: ResendActivationRequest): Promise<GenericResponse> => {
    const res = await api.post<GenericResponse>('/auth/resend-activation', data);
    return res.data;
  },

  /**
   * Cerrar sesión (limpiar localstorage)
   */
  logout: () => {
    localStorage.removeItem('token');
  }
};

/**
 * Servicios de Trasteros
 */
export const storageService = {
  getAll: async (filters?: any): Promise<{ storageUnits: StorageUnit[] }> => {
    const res = await api.get('/storage-units', { params: filters });
    return res.data;
  },
  getOne: async (id: number): Promise<{ storageUnit: StorageUnit }> => {
    const res = await api.get(`/storage-units/${id}`);
    return res.data;
  },
  update: async (id: number, data: UpdateStorageUnitRequest): Promise<{ message: string, storageUnit: StorageUnit }> => {
    const res = await api.put(`/storage-units/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/storage-units/${id}`);
    return res.data;
  }
};

/**
 * Servicios de Contratos
 */
export const contractService = {
  getAll: async (filters?: any): Promise<{ contracts: Contract[] }> => {
    const res = await api.get('/contracts', { params: filters });
    return res.data;
  },
  create: async (data: CreateContractRequest): Promise<{ message: string, contract: Contract }> => {
    const res = await api.post('/contracts', data);
    return res.data;
  },
  terminate: async (id: number): Promise<{ message: string }> => {
    const res = await api.put(`/contracts/${id}/terminate`);
    return res.data;
  }
};

/**
 * Servicios de Facturación
 */
export const invoiceService = {
  getAll: async (filters?: any): Promise<{ invoices: Invoice[] }> => {
    const res = await api.get('/invoices', { params: filters });
    return res.data;
  },
  batchGenerate: async (data: BatchGenerateInvoicesRequest): Promise<{ message: string, createdCount: number, errors?: string[] }> => {
    const res = await api.post('/invoices/batch-generate', data);
    return res.data;
  },
  updateStatus: async (id: number, status: string): Promise<GenericResponse> => {
    const res = await api.put(`/invoices/${id}/status`, { status });
    return res.data;
  }
};

/**
 * Servicios de IPC
 */
export const ipcService = {
  apply: async (data: ApplyIpcRequest): Promise<{ message: string, details: any }> => {
    const res = await api.post('/ipc/apply', data);
    return res.data;
  },
  getHistory: async (): Promise<{ batches: IpcBatch[] }> => {
    const res = await api.get('/ipc/batches');
    return res.data;
  },
  getBatchDetails: async (id: number): Promise<{ batch: IpcBatch }> => {
    const res = await api.get(`/ipc/batches/${id}`);
    return res.data;
  }
};

export default api;
