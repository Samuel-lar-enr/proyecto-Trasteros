import dotenv from 'dotenv';
import app from './app.js';
import { prisma } from './lib/prisma.js';

/**
 * Servidor principal
 * Carga variables de entorno, inicia el servidor Express
 * y verifica la conexión a la base de datos
 */

// Cargar variables de entorno desde .env
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Función para verificar la conexión a la base de datos
 */
async function checkDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a MySQL exitosamente');
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error);
    process.exit(1);
  }
}

/**
 * Función para iniciar el servidor
 */
async function startServer(): Promise<void> {
  try {
    // Verificar conexión a la base de datos
    await checkDatabaseConnection();

    // Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ====================================');
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🚀 Entorno: ${NODE_ENV}`);
      console.log(`🚀 Auth requerido: ${process.env.AUTH_REQUIRED || 'false'}`);
      console.log('🚀 ====================================');
      console.log('');
      console.log('📝 Endpoints disponibles:');
      console.log(`   - GET    http://localhost:${PORT}/`);
      console.log(`   - GET    http://localhost:${PORT}/health`);
      console.log(`   - POST   http://localhost:${PORT}/api/auth/register`);
      console.log(`   - POST   http://localhost:${PORT}/api/auth/login`);
      console.log(`   - GET    http://localhost:${PORT}/api/auth/me`);
      console.log('');
      console.log('💡 Modo de autenticación:');
      if (process.env.AUTH_REQUIRED === 'false') {
        console.log('   ✓ AUTH_REQUIRED=false (Sin autenticación, ideal para desarrollo)');
      } else {
        console.log('   ✓ AUTH_REQUIRED=true (Con autenticación JWT)');
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

/**
 * Manejo de cierre graceful
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Desconectado de MySQL');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Desconectado de MySQL');
  process.exit(0);
});

// Iniciar el servidor
startServer();
