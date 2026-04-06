import { z } from "zod";

export const createContractSchema = z.object({
  userId: z.number().int().positive("ID de usuario inválido"),
  storageUnitId: z.number().int().positive("ID de trastero inválido"),
  startDate: z.string().datetime("La fecha de inicio debe ser una fecha válida (ISO)"),
  endDate: z.string().datetime("La fecha de fin debe ser una fecha válida (ISO)").optional(),
  content: z.string().optional(),
  insuranceCoverage: z.number().nonnegative("La cobertura debe ser un número positivo").optional(),
  currentPrice: z.number().positive("El precio actual debe ser positivo"),
});

export const updateContractSchema = z.object({
  endDate: z.string().datetime("La fecha de fin debe ser una fecha válida (ISO)").optional(),
  content: z.string().optional(),
  insuranceCoverage: z.number().nonnegative().optional(),
  currentPrice: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});
