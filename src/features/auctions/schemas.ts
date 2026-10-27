import { z } from "zod";

const moneySchema = z
  .string()
  .regex(/^\d{1,10}(?:\.\d{1,2})?$/, "Usa un monto positivo con hasta 2 decimales.")
  .refine((value) => Number(value) > 0, "El monto debe ser mayor que cero.");

const dateSchema = z.string().refine(
  (value) => Number.isFinite(Date.parse(value)),
  "La fecha de cierre no es válida.",
);

const imageSchema = z
  .string()
  .trim()
  .max(500, "La URL de imagen es demasiado larga.")
  .refine(
    (value) => value.startsWith("/") || value.startsWith("https://"),
    "Usa una ruta local o una URL HTTPS.",
  );

export const createAuctionSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(4_000),
  imageUrl: imageSchema.optional(),
  initialPrice: moneySchema,
  minIncrement: moneySchema,
  closesAt: dateSchema,
  categoryId: z.uuid("Selecciona una categoría válida."),
});

export const updateAuctionSchema = createAuctionSchema
  .partial()
  .refine((values) => Object.keys(values).length > 0, "Envía al menos un campo para editar.");

export const bidSchema = z.object({
  amount: moneySchema,
});

export const cancellationSchema = z.object({
  reason: z.string().trim().min(10, "Escribe un motivo de al menos 10 caracteres.").max(500),
});

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
export type UpdateAuctionInput = z.infer<typeof updateAuctionSchema>;
export type BidInput = z.infer<typeof bidSchema>;
export type CancellationInput = z.infer<typeof cancellationSchema>;
