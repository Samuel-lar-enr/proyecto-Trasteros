import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Middleware de manejo centralizado de errores
 *
 * Captura y formatea errores de:
 * - Validaciones Zod
 * - Errores de Prisma (base de datos)
 * - Errores genéricos
 *
 * Devuelve respuestas JSON consistentes con códigos HTTP apropiados
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('❌ Error capturado:', error);

  // Error de validación de Zod
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Error de validación',
      details: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }

  // Errores de Prisma (base de datos)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Violación de restricción única (email, nombre de empresa, etc.)
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.[0] || 'campo';
      res.status(409).json({
        error: 'Conflicto',
        message: `Ya existe un registro con ese ${field}`,
      });
      return;
    }

    // Registro no encontrado
    if (error.code === 'P2025') {
      res.status(404).json({
        error: 'No encontrado',
        message: 'El registro solicitado no existe',
      });
      return;
    }

    // Violación de clave foránea
    if (error.code === 'P2003') {
      res.status(400).json({
        error: 'Error de relación',
        message: 'La empresa especificada no existe',
      });
      return;
    }

    // Otros errores de Prisma
    res.status(500).json({
      error: 'Error de base de datos',
      message: 'Ocurrió un error al procesar la solicitud',
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Ocurrió un error inesperado',
  });
}
