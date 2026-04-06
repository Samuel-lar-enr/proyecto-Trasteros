import { Router } from 'express';
import { register, login, getMe, manualRegister, googleLogin, updateProfile, activateAccount, forgotPassword, resetPassword, resendActivation } from '../controllers/auth.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

/**
 * Rutas de autenticación
 * Base path: /api/auth
 */

const router = Router();

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', login);

// POST /api/auth/resend-activation - Reenviar email de activación
router.post('/resend-activation', resendActivation);

// GET /api/auth/activate/:token - Activar cuenta
router.get('/activate/:token', activateAccount);

// POST /api/auth/forgot-password - Solicitar recuperación de contraseña
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token - Restablecer contraseña con token
router.post('/reset-password/:token', resetPassword);

// POST /api/auth/google - Login/Registro con Google
router.post('/google', googleLogin);

// POST /api/auth/manual-register - Registro manual por administrador
router.post('/manual-register', requireAdmin, manualRegister);

// PUT /api/auth/profile - Actualizar perfil (completar datos)
router.put('/profile', requireAuth, updateProfile);

// GET /api/auth/me - Obtener información del usuario autenticado
// Esta ruta siempre requiere autenticación (incluso con AUTH_REQUIRED=false)
router.get('/me', requireAuth, getMe);

export default router;
