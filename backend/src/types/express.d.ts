import { JwtPayload } from '../utils/jwt.utils.js';

/**
 * Extensión de tipos de Express
 *
 * Añade la propiedad 'user' al objeto Request de Express
 * para almacenar los datos del usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
