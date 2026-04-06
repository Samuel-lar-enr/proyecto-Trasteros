import { z } from "zod";

export const storageTypeSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
});

export const storageUnitSchema = z.object({
  number: z.string().min(1, "El número de trastero es requerido"),
  typeId: z.number().int().positive("El ID de tipo es inválido"),
  price: z.number().positive("El precio debe ser un número positivo"),
  m2: z.number().positive("Los metros cuadrados deben ser positivos"),
  m3: z.number().positive("Los metros cúbicos deben ser positivos"),
  location: z.string().min(1, "La ubicación es requerida"),
  status: z.enum(["FREE", "OCCUPIED", "RESERVED", "NOT_AVAILABLE"]).optional(),
  observations: z.string().optional(),
});

export const updateStorageUnitSchema = storageUnitSchema.partial();
