import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import storageRoutes from './routes/storage.routes.js';
import contractRoutes from './routes/contract.routes.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuración de la aplicación Express
 */

const app = express();

// ========================================
// MIDDLEWARES GLOBALES
// ========================================

// CORS - Permite peticiones desde cualquier origen (desarrollo)
// En producción, configurar allowedOrigins específicos
app.use(
  cors({
    origin: '*', // Permite cualquier origen (ideal para desarrollo)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parser de JSON - Convierte el body de las peticiones a JSON
app.use(express.json());

// Parser de URL-encoded - Para formularios
app.use(express.urlencoded({ extended: true }));

// ========================================
// RUTAS
// ========================================

// Ruta de health check
app.get('/', (_req, res) => {
  res.json({
    message: '🚀 API de Boxen funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      storage: '/api/storage',
      contracts: '/api/contracts',
    },
    docs: 'Ver README.md para documentación completa',
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/contracts', contractRoutes);

// ========================================
// FRONTEND ESTÁTICO
// ========================================

// Sirve los ficheros del build de React
const frontendPath = path.join(__dirname, 'public');
app.use(express.static(frontendPath));

// SPA fallback: cualquier ruta que no sea /api devuelve index.html
// para que react-router-dom maneje la navegación en el cliente
app.get('*', (req, res) => {
  const indexFile = path.join(frontendPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(404).json({
        error: 'No encontrado',
        message: `La ruta ${req.method} ${req.path} no existe`,
      });
    }
  });
});

// ========================================
// MANEJO DE ERRORES
// ========================================

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

export default app;
