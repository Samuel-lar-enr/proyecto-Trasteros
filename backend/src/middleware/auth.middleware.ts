import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils.js';

/**
 * Middleware de autenticación JWT con lógica condicional
 *
 * Comportamiento según la variable de entorno AUTH_REQUIRED:
 * - AUTH_REQUIRED=false: Permite el acceso sin token (modo desarrollo/sin auth)
 * - AUTH_REQUIRED=true: Requiere token JWT válido en el header Authorization
 *
 * Este middleware híbrido permite a los alumnos:
 * 1. Practicar CRUD sin implementar login (AUTH_REQUIRED=false)
 * 2. Añadir autenticación cuando estén listos (AUTH_REQUIRED=true)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Si AUTH_REQUIRED=false, bypass completo (permitir acceso sin auth)
  if (process.env.AUTH_REQUIRED === 'false') {
    return next();
  }

  // Si AUTH_REQUIRED=true, verificar token JWT
  try {
    // Obtener token del header Authorization: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'No autorizado',
        message: 'Token de autenticación requerido. Proporcione un token en el header Authorization.',
      });
      return;
    }

    // Extraer el token (quitar el prefijo "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verificar y decodificar el token
    const decoded = verifyToken(token);

    // Adjuntar los datos del usuario al request para usarlos en los controladores
    req.user = decoded;

    // Continuar al siguiente middleware/controlador
    next();
  } catch (error) {
    // Token inválido o expirado
    const message = error instanceof Error ? error.message : 'Token inválido';
    res.status(401).json({
      error: 'No autorizado',
      message,
    });
  }
}

/**
 * Middleware para requerir rol de Administrador
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // Si AUTH_REQUIRED=false, permitir todo
  if (process.env.AUTH_REQUIRED === 'false') {
    return next();
  }

  // Primero debe estar autenticado
  requireAuth(req, res, () => {
    // Verificar si es ADMIN
    if (req.user && req.user.role === 'ADMIN') {
      return next();
    }

    // Si no es admin, prohibido
    res.status(403).json({
      error: 'Prohibido',
      message: 'Esta acción requiere privilegios de administrador',
    });
  });
}
