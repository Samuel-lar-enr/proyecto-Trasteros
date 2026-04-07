import { z } from "zod";

export const applyIpcSchema = z.object({
  percentage: z.number().min(-99, "La subida no puede ser menor a -99%").max(99, "La subida no puede ser mayor a 99%"),
  observations: z.string().optional(),
});
