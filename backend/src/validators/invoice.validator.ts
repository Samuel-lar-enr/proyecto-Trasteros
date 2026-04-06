import { z } from "zod";

export const createInvoiceSchema = z.object({
  number: z.string().min(1, "El número de factura es requerido"),
  series: z.string().optional(),
  userId: z.number().int().positive(),
  storageUnitId: z.number().int().positive(),
  taxBase: z.number().positive(),
  vatAmount: z.number().nonnegative(),
  total: z.number().positive(),
  status: z.enum(["PAID", "PENDING", "RETURNED"]).optional(),
  date: z.string().datetime().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["PAID", "PENDING", "RETURNED"]),
});

export const batchGenerateSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  series: z.string().optional(),
});
