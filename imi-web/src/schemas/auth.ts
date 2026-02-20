import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const signupSchema = z
  .object({
    email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
