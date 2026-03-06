# 🚀 Documentación del Backend: Sistema de Autenticación y Gestión de Usuarios

Este backend es una API REST robusta construida con **Node.js, Express y TypeScript**. Utiliza **MySQL** como base de datos a través de **Prisma ORM** y gestiona la seguridad mediante **JSON Web Tokens (JWT)** y validación de esquemas con **Zod**.

## 🏗️ Resumen General

La API permite la gestión completa del ciclo de vida del usuario:

1.  **Registro y Seguridad**: Soporta autoregistro con verificación por email y registro manual por administradores.
2.  **Autenticación Híbrida**: Permite el login tradicional (email/password) y la integración con **Google Auth**.
3.  **Activación de Cuenta**: Bloquea el acceso a usuarios nuevos hasta que validen su email.
4.  **Perfiles Flexibles**: Soporta dos tipos de usuarios (**PARTICULAR** y **EMPRESA**) con campos específicos para cada uno.

---

## 🔐 Endpoints de Autenticación (`/api/auth`)

### 1. Registro Público (`POST /register`)

Permite a cualquier persona crear una cuenta básica. El usuario queda inactivo hasta que valida su email.

**Ejemplo de Petición (Request):**

```json
{
  "email": "juan.perez@example.com",
  "password": "Password123!",
  "name": "Juan Pérez"
}
```

**Respuesta Exitosa (201 Created):**

```json
{
  "message": "Registro exitoso. Por favor, revisa tu email para activar tu cuenta.",
  "user": {
    "id": 15,
    "email": "juan.perez@example.com",
    "name": "Juan Pérez",
    "role": "USER",
    "isActive": false,
    "createdAt": "2026-03-06T12:00:00Z"
  }
}
```

- **Errores**:
  - `409 Conflicto`: El email ya está registrado.
  - `400 Bad Request`: Datos mal formados (Zod).

### 2. Inicio de Sesión (`POST /login`)

Acceso mediante credenciales manuales.

**Ejemplo de Petición (Request):**

```json
{
  "email": "juan.perez@example.com",
  "password": "Password123!"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Login exitoso",
  "user": {
    "id": 15,
    "email": "juan.perez@example.com",
    "name": "Juan Pérez",
    "role": "USER",
    "createdAt": "2026-03-06T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error por cuenta no activa (403 Forbidden):**

```json
{
  "error": "Cuenta no activada",
  "message": "Por favor, activa tu cuenta utilizando el enlace enviado a tu email"
}
```

- **Errores**:
  - `401 No autorizado`: Email o contraseña incorrectos.
  - `403 Prohibido`: **Cuenta no activada**. El usuario debe revisar su email.

### 3. Activación de Cuenta (`GET /activate/:token`)

Endpoint al que apunta el botón del email recibido tras el registro.

- **Necesita**: `token` enviado por URL.
- **Qué hace**: Valida el token, marca al usuario como `isActive: true` y borra el token de la DB.
- **Respuesta Exitosa (200)**: `{ message: "Cuenta activada exitosamente." }`
- **Errores**:
  - `400 Bad Request`: Token inválido o ya utilizado.

### 4. Autenticación con Google (`POST /google`)

Login o registro automático desde el botón de Google.

**Ejemplo de Petición (Request):**

```json
{
  "idToken": "TOKEN_RECIBIDO_DE_GOOGLE_SDK"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Autenticación con Google exitosa",
  "user": {
    "id": 20,
    "email": "samuel.google@gmail.com",
    "name": "Samuel L.",
    "role": "USER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Qué hace**:
  - Si el usuario no existe, lo crea y lo marca como **activo automáticamente** (Google ya verificó el email).
  - Si existe pero no estaba vinculado con Google, lo vincula.

### 5. Obtener Perfil Actual (`GET /me`)

Recupera los datos del usuario logueado.

- **Necesita**: Token JWT en el header (`Authorization: Bearer <token>`).
- **Respuesta Exitosa (200)**: Devuelve el objeto completo del usuario (incluyendo campos de empresa/particular).
- **Errores**:
  - `401 No autorizado`: Token ausente o caducado.

### 6. Actualizar Perfil o Completar Datos (`PUT /profile`)

Actualiza la información del usuario logueado. Requiere token Bearer.

**Ejemplo de Petición para PARTICULAR (Request):**

```json
{
  "userType": "PARTICULAR",
  "surname": "Mora Pérez",
  "dniNif": "87654321X",
  "address": "Calle Nueva 5, 2ºB",
  "population": "Valencia",
  "province": "Valencia",
  "phone": "655443322",
  "paymentMethod": "Tarjeta",
  "bank": "CaixaBank",
  "bicSwift": "CAIXESMM",
  "iban": "ES2100001111222233334444"
}
```

**Ejemplo de Petición para EMPRESA (Request):**

```json
{
  "userType": "EMPRESA",
  "commercialName": "Tech Solutions S.L.",
  "nifCif": "B12345678",
  "address": "Polígono Ind. Oeste, Nave 4",
  "phone": "968112233"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Perfil actualizado correctamente",
  "user": {
    "id": 20,
    "email": "samuel.google@gmail.com",
    "name": "Samuel L.",
    "role": "USER"
  }
}
```

---

## 🛠️ Endpoints de Administración

### 7. Registro Manual (`POST /manual-register`)

Registro completo realizado por un administrador. Requiere token de ADMIN.

**Ejemplo de Petición (Request):**

```json
{
  "userType": "PARTICULAR",
  "email": "cliente.nuevo@test.com",
  "username": "c_nuevo",
  "password": "PasswordManual123",
  "passwordReminder": "Mi primer coche",
  "name": "Andrés",
  "surname": "García Ruiz",
  "dniNif": "11223344K",
  "address": "Av. Libertad 12",
  "population": "Murcia",
  "province": "Murcia",
  "phone": "611009988",
  "paymentMethod": "Transferencia",
  "bank": "BBVA",
  "bicSwift": "BBVAESMM",
  "iban": "ES2100491234123412341234"
}
```

**Respuesta Exitosa (201 Created):**

```json
{
  "message": "Nuevo usuario registrado manualmente con éxito",
  "user": {
    "id": 25,
    "email": "cliente.nuevo@test.com",
    "username": "c_nuevo",
    "name": "Andrés",
    "userType": "PARTICULAR",
    "role": "USER"
  }
}
```

- **Errores**:
  - `403 Prohibido`: El usuario que hace la petición no es ADMIN.

---

## 📋 Resumen de Esquema de Datos (`User`)

| Campo      | Tipo    | Descripción                       |
| :--------- | :------ | :-------------------------------- |
| `userType` | Enum    | `PARTICULAR` o `EMPRESA`.         |
| `role`     | Enum    | `USER` o `ADMIN`.                 |
| `isActive` | Boolean | `true` si ha verificado su email. |
| `email`    | String  | Único, usado para login.          |
| `dniNif`   | String  | Único para particulares.          |
| `nifCif`   | String  | Para empresas.                    |
| `googleId` | String  | ID único de la cuenta de Google.  |

---

## 📝 Notas de Desarrollo

- **Validación**: Toda entrada de datos pasa por **Zod**, lo que garantiza que si falta un campo obligatorio o el formato del IBAN es incorrecto, el servidor responderá con un error claro indicando qué campo falla.
- **Seguridad**: Las contraseñas nunca se guardan en texto plano, siempre se hashean con **bcrypt**. Los tokens JWT expiran según se configure en el `.env` (por defecto 24h).
