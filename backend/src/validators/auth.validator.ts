import { z } from 'zod';

/**
 * Validadores Zod para endpoints de autenticación
 */

// Schema para registro de usuario
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre es demasiado largo')
    .trim(),
  acceptPrivacy: z
    .boolean({ required_error: 'Debes aceptar la política de privacidad' })
    .refine((val) => val === true, 'Debes aceptar la política de privacidad'),
  acceptCommunications: z
    .boolean()
    .default(false),
});

// Validador de IBAN (simplificado pero sigue el formato estándar)
const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;

// Schema para registro manual (Administrador)
export const manualRegisterSchema = z.object({
  userType: z.enum(['PARTICULAR', 'EMPRESA'], {
    required_error: 'El tipo de usuario es requerido',
  }),
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .trim(),
  password: z
    .string({ required_error: 'La clave es requerida' })
    .min(4, 'La clave debe tener al menos 4 caracteres')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'La clave debe contener letras y números'),
  passwordReminder: z
    .string({ required_error: 'La palabra recordatorio es requerida' })
    .min(2, 'La palabra recordatorio es demasiado corta'),
  
  // Datos comunes
  address: z.string({ required_error: 'La dirección es requerida' }).min(5).trim(),
  population: z.string({ required_error: 'La población es requerida' }).min(2).trim(),
  province: z.string({ required_error: 'La provincia es requerida' }).min(2).trim(),
  phone: z.string({ required_error: 'El teléfono es requerido' }).min(9).trim(),
  
  // Datos opcionales según tipo
  surname: z.string().optional().or(z.literal('')), // Obligatorio para particular
  dniNif: z.string().optional().or(z.literal('')), // Obligatorio para particular
  
  commercialName: z.string().optional().or(z.literal('')), // Obligatorio para empresa
  nifCif: z.string().optional().or(z.literal('')), // Obligatorio para empresa

  // Datos Bancarios
  paymentMethod: z.string({ required_error: 'La forma de pago es requerida' }),
  bank: z.string({ required_error: 'El banco es requerido' }),
  bicSwift: z.string({ required_error: 'El BIC/SWIFT es requerido' }),
  iban: z.string({ required_error: 'El IBAN es requerido' }).refine((val: string) => ibanRegex.test(val.replace(/\s/g, '')), {
    message: 'Formato de IBAN inválido',
  }),
  
  observations: z.string().optional().or(z.literal('')),
}).refine((data: any) => {
  if (data.userType === 'PARTICULAR') {
    return !!data.surname && !!data.dniNif;
  }
  return true;
}, {
  message: 'Para usuarios PARTICULARES, los apellidos y DNI/NIF son obligatorios',
  path: ['surname'],
}).refine((data: any) => {
  if (data.userType === 'EMPRESA') {
    return !!data.commercialName && !!data.nifCif;
  }
  return true;
}, {
  message: 'Para empresas, el nombre comercial y NIF/CIF son obligatorios',
  path: ['commercialName'],
});

// Schema para login
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'La contraseña es requerida' }),
});

// Schema para login con Google
export const googleLoginSchema = z.object({
  idToken: z.string({ required_error: 'El ID Token de Google es requerido' }),
});

// Schema para actualización de perfil (completar datos)
export const updateProfileSchema = z.object({
  userType: z.enum(['PARTICULAR', 'EMPRESA']).optional(),
  name: z.string().min(2).trim().optional(),
  surname: z.string().trim().optional(),
  dniNif: z.string().trim().optional(),
  commercialName: z.string().trim().optional(),
  nifCif: z.string().trim().optional(),
  address: z.string().trim().optional(),
  population: z.string().trim().optional(),
  province: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  paymentMethod: z.string().optional(),
  bank: z.string().optional(),
  bicSwift: z.string().optional(),
  iban: z.string().optional().refine((val) => !val || ibanRegex.test(val.replace(/\s/g, '')), {
    message: 'Formato de IBAN inválido',
  }),
  observations: z.string().optional(),
});

// Schema para recuperación de contraseña (solicitud)
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
});

// Schema para restablecimiento de contraseña
export const resetPasswordSchema = z.object({
  password: z
    .string({ required_error: 'La nueva contraseña es requerida' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
});

// Schema para reenviar email de activación
export const resendActivationSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
});


// Tipos TypeScript inferidos de los schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type ManualRegisterInput = z.infer<typeof manualRegisterSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type ResendActivationInput = z.infer<typeof resendActivationSchema>;
