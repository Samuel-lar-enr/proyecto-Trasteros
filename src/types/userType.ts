// === AUTH ===

/** Datos del usuario autenticado */
export interface User {
  id: number;
  username: string;
  email: string;
}

//No hay backend aún no se sabe esto ⬇️

/** Respuesta de POST /auth/login */
export interface AuthResponse {
  user: User;
  token: string;
}