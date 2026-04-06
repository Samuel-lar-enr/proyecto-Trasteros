import { z } from "zod";

export const applyIpcSchema = z.object({
  percentage: z.number().min(-10, "La subida no puede ser menor a -10%").max(30, "La subida no puede ser mayor a 30%"),
  observations: z.string().optional(),
});
