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
  ResendActivationRequest
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

export default api;
