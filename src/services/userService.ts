import type {
    AuthResponse,

    User,
} from "../types/userType";
/**
 * ==============================================
 * NO HAY BACKEND, FUTURA CONFIGURACION REQUERIDA
 */


const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Helper para obtener headers con token si existe
 */
function getHeaders(): HeadersInit {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    // Si hay token en localStorage, añadirlo al header
    const token = localStorage.getItem("token");
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

// ========================================
// USUARIOS (USERS)
//

export const authAPI = {
    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                email: email,
                password: password
            }),
        });
        if (!response.ok) {
            throw new Error("Error al iniciar sesión");
        }
        return response.json();
    },
    async getMe(): Promise<{ user: User }> {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: getHeaders(),
        });
        if (!response.ok) {
            throw new Error("Error al obtener información del usuario");
        }
        return response.json();
    },
};
