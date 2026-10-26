import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo válido.")
    .max(254, "El correo es demasiado largo."),
  password: z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres.")
    .max(128, "La contraseña no puede superar los 128 caracteres."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo válido.")
    .max(254, "El correo es demasiado largo."),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria.")
    .max(128, "La contraseña no puede superar los 128 caracteres."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;