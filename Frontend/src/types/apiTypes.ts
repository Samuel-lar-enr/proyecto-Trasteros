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
  // Relaciones (opcionales para evitar ciclos pesados)
  contracts?: Contract[];
  invoices?: Invoice[];
}

/**
 * STORAGE UNITS
 */
export type StorageStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'NOT_AVAILABLE';

export interface StorageType {
  id: number;
  description: string;
}

export interface StorageUnit {
  id: number;
  number: string;
  typeId: number;
  type?: StorageType;
  price: string | number;
  m2: string | number;
  m3: string | number;
  location: string;
  status: StorageStatus;
  observations?: string | null;
  contracts?: Contract[];
  invoices?: Invoice[];
  createdAt: string;
  updatedAt: string;
}

/**
 * CONTRACTS
 */
export interface Contract {
  id: number;
  userId: number;
  user?: User;
  storageUnitId: number;
  storageUnit?: StorageUnit;
  startDate: string;
  endDate?: string | null;
  content?: string | null;
  insuranceCoverage?: string | number | null;
  currentPrice: string | number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * INVOICES
 */
export type InvoiceStatus = 'PAID' | 'PENDING' | 'RETURNED';

export interface Invoice {
  id: number;
  date: string;
  number: string;
  series?: string | null;
  userId: number;
  user?: User;
  storageUnitId: number;
  storageUnit?: StorageUnit;
  taxBase: string | number;
  vatAmount: string | number;
  total: string | number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * IPC
 */
export interface IpcBatch {
  id: number;
  date: string;
  percentage: string | number;
  observations?: string | null;
  history?: IpcHistory[];
  _count?: { history: number };
}

export interface IpcHistory {
  id: number;
  batchId: number;
  storageUnitId: number;
  storageUnit?: StorageUnit;
  oldPrice: string | number;
  newPrice: string | number;
  difference: string | number;
  oldContractPrice: string | number;
  newContractPrice: string | number;
  createdAt: string;
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
  recaptchaToken: string;
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

/**
 * IPC REQUESTS
 */
export interface ApplyIpcRequest {
  percentage: number;
  observations?: string;
}

/**
 * INVOICE REQUESTS
 */
export interface BatchGenerateInvoicesRequest {
  month: number;
  year: number;
  series?: string;
}

/**
 * CONTRACT REQUESTS
 */
export interface CreateContractRequest {
  userId: number;
  storageUnitId: number;
  startDate: string;
  endDate?: string;
  content?: string;
  insuranceCoverage?: number;
  currentPrice: number;
}

/**
 * STORAGE UNIT REQUESTS
 */
export interface UpdateStorageUnitRequest {
  number?: string;
  typeId?: number;
  price?: number;
  m2?: number;
  m3?: number;
  location?: string;
  status?: StorageStatus;
  observations?: string;
}
