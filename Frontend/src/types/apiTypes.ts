/**
 * Tipos e Interfaces para la API de Autenticación y Usuarios
 * Copia este archivo a tu proyecto Frontend (src/types/api.ts)
 */

export type UserType = 'PARTICULAR' | 'EMPRESA';
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  surname?: string | null;
  dniNif?: string | null;
  commercialName?: string | null;
  nifCif?: string | null;
  userType: UserType;
  role: UserRole;
  isActive: boolean;
  address?: string | null;
  population?: string | null;
  province?: string | null;
  phone?: string | null;
  paymentMethod?: string | null;
  bank?: string | null;
  bicSwift?: string | null;
  iban?: string | null;
  observations?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * RESPUESTAS DE LA API
 */

export interface AuthResponse {
  message: string;
  user: Partial<User>;
  token: string;
}

export interface MeResponse {
  user: User;
}

export interface GenericResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

/**
 * PETICIONES (REQUESTS)
 */

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  acceptPrivacy: boolean;
  acceptCommunications: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface UpdateProfileRequest {
  userType?: UserType;
  name?: string;
  surname?: string;
  dniNif?: string;
  commercialName?: string;
  nifCif?: string;
  address?: string;
  population?: string;
  province?: string;
  phone?: string;
  paymentMethod?: string;
  bank?: string;
  bicSwift?: string;
  iban?: string;
  observations?: string;
}

export interface ManualRegisterRequest extends UpdateProfileRequest {
    email: string;
    password: string;
    passwordReminder: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface ResendActivationRequest {
  email: string;
}
