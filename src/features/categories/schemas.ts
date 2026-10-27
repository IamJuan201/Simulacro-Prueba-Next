import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(40, "El nombre no puede superar 40 caracteres."),
});

export type CategoryInput = z.infer<typeof categorySchema>;
