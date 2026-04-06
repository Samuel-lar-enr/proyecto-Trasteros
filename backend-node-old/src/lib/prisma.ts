import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma Singleton
 *
 * Este patrón asegura que solo haya una instancia de PrismaClient
 * en toda la aplicación, evitando múltiples conexiones a la base de datos.
 *
 * En desarrollo, se usa el globalThis para persistir la instancia
 * entre hot-reloads de TypeScript.
 */

// Declaración de tipo global para almacenar el cliente Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Crear instancia única de Prisma
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// En desarrollo, guardar la instancia en global para evitar múltiples conexiones
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
