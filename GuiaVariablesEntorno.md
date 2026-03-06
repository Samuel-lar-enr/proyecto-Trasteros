# 🔐 Guía de Variables de Entorno (.env)

Esta guía explica la configuración necesaria tanto para el **Backend** como para el **Frontend**. Los archivos `.env` son cruciales para que los servicios se comuniquen entre sí y con servicios externos (Base de Datos, Email, Google).

---

## 🖥️ BACKEND (`backend/.env`)

### 📦 Base de Datos (MySQL)

Estas variables configuran el contenedor de MySQL y la conexión de Prisma.

- **`MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD`**: Contraseñas para la base de datos.
- **`MYSQL_DATABASE`**: Nombre de la base de datos (e.g., `contacts_db`).
- **`MYSQL_USER`**: Usuario de la base de datos.
- **`DATABASE_URL`**: La cadena de conexión que usa Prisma. Tiene el formato `mysql://USER:PASS@localhost:3306/DB_NAME`.
  - **¿Datos reales?** No. Para desarrollo local puedes usar las que vienen por defecto (`admin/admin123`).

### 🔑 Seguridad y Servidor

- **`JWT_SECRET`**: Clave secreta para firmar los tokens de sesión.
  - **¿Datos reales?** En desarrollo pon cualquier frase larga. En producción debe ser una clave muy compleja.
- **`PORT`**: El puerto donde corre el backend (por defecto `3000`).
- **`JWT_EXPIRES_IN`**: Tiempo de validez del token (e.g., `24h`).

### 📧 Configuración de Email (SMTP)

Necesario para enviar los correos de **activación de cuenta**.

- **`SMTP_HOST`**: Servidor de correo (e.g., `smtp.gmail.com`).
- **`SMTP_PORT`**: Puerto (587 para TLS).
- **`SMTP_USER`**: Tu dirección de correo.
- **`SMTP_PASS`**: Tu contraseña (o "Contraseña de Aplicación" si usas Gmail).
- **`SMTP_FROM`**: El nombre que verá el usuario como remitente (e.g., `"Trasteros App"`).
  - **¿Datos reales?** **SÍ**. Si quieres que los emails lleguen de verdad, debes poner datos reales de una cuenta activa.

### 🌐 Integraciones

- **`GOOGLE_CLIENT_ID`**: ID de tu proyecto en Google Cloud Console.
  - **¿Datos reales?** **SÍ**, para que el botón de Google funcione realmente. Si no lo tienes, puedes poner uno "dummy", pero el login fallará excepto en el modo simulado.
- **`FRONTEND_URL`**: La URL donde el usuario hará clic para activar su cuenta.
  - **Importante**: Actualmente apunta al backend (`http://localhost:3000/api/auth/activate`) para pruebas directas, pero en producción debe apuntar al frontend (`http://localhost:5173/activate`).

---

## 🎨 FRONTEND (`Frontend/.env`)

Las variables de frontend en Vite **DEBEN** empezar por `VITE_` para que sean accesibles.

- **`VITE_API_URL`**: La dirección donde está escuchando el backend.
  - **Valor**: `http://localhost:3000/api`
  - **¿Datos reales?** Sí, debe coincidir con el puerto del backend.
- **`VITE_GOOGLE_CLIENT_ID`**: ID de cliente de Google (debe ser el mismo que el del backend).
- **`PORT`**: Puerto donde corre el frontend (por defecto `5173`).

---

## ⚠️ NOTAS IMPORTANTES

1.  **Seguridad**: Nunca subas los archivos `.env` a GitHub o repositorios públicos. Están incluidos en el `.gitignore` por seguridad.
2.  **Docker**: Si cambias algo en el `.env` del backend, es recomendable reiniciar el contenedor (`docker compose up -d`) para asegurar que los cambios se apliquen correctamente.
3.  **Contraseña de Google**: Recuerda que para `SMTP_PASS` en Gmail, no debes usar tu contraseña normal, sino una **Contraseña de Aplicación** de 16 letras generada en tu cuenta de Google.
