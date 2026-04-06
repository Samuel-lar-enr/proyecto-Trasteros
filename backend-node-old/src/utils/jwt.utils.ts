import jwt from 'jsonwebtoken';

/**
 * Utilidades para manejo de JSON Web Tokens (JWT)
 * Incluye funciones para generar y verificar tokens de autenticación
 */

// Tipo del payload que se almacena en el JWT
export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

/**
 * Genera un JWT con los datos del usuario
 *
 * @param payload - Datos del usuario a incluir en el token
 * @returns Token JWT firmado
 */
export function generateToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

/**
 * Verifica y decodifica un JWT
 *
 * @param token - Token JWT a verificar
 * @returns Payload decodificado si el token es válido
 * @throws Error si el token es inválido o ha expirado
 */
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw new Error('Error al verificar el token');
  }
}
