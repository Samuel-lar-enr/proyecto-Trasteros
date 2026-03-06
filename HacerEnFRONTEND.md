# 🛠️ Guía Completa: Implementación del Sistema de Autenticación en el Frontend

Esta guía detalla cómo conectar tu Frontend (React/Vite) con el sistema de autenticación del Backend, cubriendo Registro, Login (Manual y Google), Activación y Perfil.

---

## ⚙️ 1. Configuración Inicial

### Variables de Entorno (.env)

Crea un archivo `.env` en la raíz de tu carpeta `Frontend`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu-id-de-google-aqui.apps.googleusercontent.com
```

### Cliente de API (Ejemplo con Axios)

Configura una instancia para incluir el token automáticamente:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor para añadir el Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 🆕 2. Registro de Usuario (Autoregistro)

El usuario rellena `email`, `password` y `nombre`.

- **Endpoint:** `POST /auth/register`
- **Comportamiento:**
  - Tras el éxito, **NO entras directamente**.
  - Muestra un mensaje: _"¡Registro casi completado! Revisa tu email para activar tu cuenta"_ e informa de que el enlace puede estar en Spam.

---

## 🔑 3. Login Manual

El usuario introduce `email` y `password`.

- **Endpoint:** `POST /auth/login`
- **Lógica de Errores Crítica:**
  - **Error 401:** "Email o contraseña incorrectos".
  - **Error 403:** "Tu cuenta no está activa. Por favor, revisa tu email para activarla".
- **Éxito:** Guarda el `token` en `localStorage` y redirige a la página principal.

---

## 🌐 4. Login con Google (Flujo Automático)

Para esto se recomienda usar `@react-oauth/google`.

1.  Envías el `idToken` que te da Google al Backend.
2.  **Endpoint:** `POST /auth/google`
3.  **Lógica Post-Login:**
    - El usuario se loguea/registra automáticamente.
    - Si es la primera vez, el objeto `user` tendrá campos vacíos (DNI, Dirección, etc.).
    - **Tip:** Comprueba si `user.dniNif` o `user.nifCif` están vacíos; si es así, redirígelo a la página de **"Completar Perfil"**.

---

## ✅ 5. Página de Activación de Cuenta

Ruta sugerida: `/activate/:token`

- **Lógica:** Al cargar la página, extrae el token y llama a:
  - **Endpoint (GET):** `/auth/activate/${token}`
- **Diseño:** Muestra un spinner mientras carga. Si es OK, pon un botón de "¡Listo! Iniciar Sesión". Si falla, indica que el enlace caducó.

---

## 📝 6. Perfil y Completar Datos

Endpoint versátil para actualizar cualquier campo del usuario.

- **Endpoint (PUT):** `/auth/profile` (Requiere `Authorization: Bearer ...`)
- **Formulario Inteligente:**
  - Crea un selector para elegir entre **PARTICULAR** o **EMPRESA**.
  - Si elige **PARTICULAR**: Muestra campos de Apellidos y DNI.
  - Si elige **EMPRESA**: Muestra campos de Nombre Comercial y CIF.
  - Campos comunes: Dirección, CP, Población, Teléfono e IBAN.

---

## 🛡️ 7. Protección de Rutas y Estado Global

Para saber si el usuario sigue logueado al refrescar la página:

1.  Al arrancar la App, verifica si hay un token en `localStorage`.
2.  Si existe, llama a:
    - **Endpoint (GET):** `/auth/me`
3.  Si la llamada devuelve el usuario, guárdalo en tu estado global (Context/Zustand/Redux). Si da error (token caducado), borra el token y redirige a `/login`.

---

## 📌 Resumen de Endpoints del Backend

| Acción               | Método | Ruta                    | Auth       |
| :------------------- | :----- | :---------------------- | :--------- |
| Registro normal      | POST   | `/auth/register`        | No         |
| Iniciar sesión       | POST   | `/auth/login`           | No         |
| Login Google         | POST   | `/auth/google`          | No         |
| Activar cuenta       | GET    | `/auth/activate/:token` | No         |
| Datos usuario actual | GET    | `/auth/me`              | Sí         |
| Actualizar perfil    | PUT    | `/auth/profile`         | Sí         |
| Registro Admin       | POST   | `/auth/manual-register` | Sí (Admin) |
