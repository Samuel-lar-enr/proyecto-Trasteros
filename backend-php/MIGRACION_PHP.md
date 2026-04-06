# 🚀 Guía de Migración: Backend PHP (Slim Framework)

Este documento detalla la migración del backend original (Node.js/Express) a la nueva implementación en **PHP** utilizando el **Slim Framework 4**.

## 🏗️ Estructura del Proyecto

La nueva estructura sigue las mejores prácticas de PSR y organización de archivos:

```text
backend-php/
├── public/                 # Punto de entrada y configuración del servidor web
│   ├── index.php           # El archivo principal que arranca la App
│   └── .htaccess           # Configuración para Apache (redirección)
├── src/
│   ├── Config/             # Configuración (Base de Datos)
│   ├── Controllers/        # Lógica de los endpoints
│   ├── Middleware/         # Control de acceso (JWT Auth)
│   ├── Routes/             # Definición de las rutas del API
│   ├── Utils/              # Utilidades (JWT, Email, etc.)
│   └── Models/             # (Opcional) Capa de datos si se requiere expandir
├── .env                    # Variables de entorno (Configuración)
├── composer.json           # Dependencias de PHP
└── vendor/                 # Librerías instaladas vía Composer
```

## 🛠️ Tecnologías Utilizadas

1.  **Slim Framework 4**: Para el enrutamiento y manejo de peticiones HTTP.
2.  **PDO (PHP Data Objects)**: Para una conexión segura y eficiente a MySQL.
3.  **Firebase JWT**: Para la generación y validación de tokens de seguridad.
4.  **PHPMailer**: Para el envío de correos electrónicos (Activación, Recuperación).
5.  **Google API Client**: Para la autenticación nativa con Google.
6.  **PHP Dotenv**: Para manejar las variables del archivo `.env`.

## ⚙️ Configuración del Entorno (`.env`)

El archivo `.env` en `backend-php/` contiene la configuración necesaria:

-   `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`: Credenciales de la base de datos (conectadas a la misma DB que el backend original).
-   `JWT_SECRET`: Clave para firmar los tokens.
-   `GOOGLE_CLIENT_ID`: ID para la autenticación con Google.
-   `SMTP_*`: Configuración para el envío de correos.

## 🚀 Cómo Ejecutar el Backend PHP

### 1. Requisitos
-   PHP 8.1 o superior.
-   Composer instalado.

### 2. Instalación
Si no lo has hecho ya, ejecuta en la carpeta `backend-php`:
```bash
composer install
```

### 3. Servidor de Desarrollo
Puedes usar el servidor embebido de PHP para pruebas locales:
```bash
php -S localhost:8000 -t public
```
La API estará disponible en `http://localhost:8000/api/auth/...`

## 🔀 Equivalencias de Endpoints

| Funcionalidad | Método | Endpoint original (Express) | Endpoint PHP (Slim) |
| :--- | :--- | :--- | :--- |
| Registro | POST | `/api/auth/register` | `/api/auth/register` |
| Login | POST | `/api/auth/login` | `/api/auth/login` |
| Activar Cuenta | GET | `/api/auth/activate/:token` | `/api/auth/activate/{token}` |
| Google Auth | POST | `/api/auth/google` | `/api/auth/google` |
| Obtener mi Perfil | GET | `/api/auth/me` | `/api/auth/me` |
| Actualizar Perfil | PUT | `/api/auth/profile` | `/api/auth/profile` |
| Registro Manual | POST | `/api/auth/manual-register` | `/api/auth/manual-register` |
| Reset Password (Req) | POST | `/api/auth/forgot-password` | `/api/auth/forgot-password` |
| Reset Password (New) | POST | `/api/auth/reset-password/:token` | `/api/auth/reset-password/{token}` |
| Reenviar Activación | POST | `/api/auth/resend-activation` | `/api/auth/resend-activation` |

## 🔒 Seguridad (JWT)

Se ha implementado el **`AuthMiddleware`** que intercepta las rutas protegidas. Verifica que el header `Authorization: Bearer <token>` sea válido antes de permitir el acceso a la lógica del controlador.

## 📧 Envío de Emails

Se utiliza **PHPMailer** configurado a través de las variables `SMTP` del `.env`. Las plantillas de email (en HTML) han sido porteadas de la lógica original.

---
**Nota**: El backend PHP utiliza la misma base de datos MySQL, por lo que los usuarios registrados en una plataforma serán visibles en la otra.
