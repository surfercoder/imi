import { z } from "zod";

export const ESPECIALIDADES = [
  "Alergología",
  "Anestesiología y reanimación",
  "Cardiología",
  "Dermatología",
  "Endocrinología y nutrición",
  "Geriatría",
  "Hematología y hemoterapia",
  "Inmunología",
  "Infectología",
  "Medicina interna",
  "Medicina familiar y comunitaria",
  "Medicina del trabajo",
  "Medicina preventiva y salud pública",
  "Medicina crítica / intensiva",
  "Neumología",
  "Nefrología",
  "Neurología",
  "Oncología médica",
  "Psiquiatría",
  "Pediatría",
  "Reumatología",
  "Cirugía general y del aparato digestivo",
  "Cirugía cardiovascular",
  "Cirugía torácica",
  "Cirugía ortopédica y traumatología",
  "Cirugía pediátrica",
  "Cirugía plástica, estética y reparadora",
  "Cirugía oral y maxilofacial",
  "Neurocirugía",
  "Angiología y cirugía vascular",
  "Dermatología médico-quirúrgica y venereología",
  "Obstetricia y ginecología",
  "Oftalmología",
  "Otorrinolaringología",
  "Urología",
  "Anatomía patológica",
  "Bioquímica clínica",
  "Farmacología clínica",
  "Microbiología y parasitología",
  "Medicina nuclear",
  "Neurofisiología clínica",
  "Radiodiagnóstico",
  "Medicina transfusional y hemoterapia",
  "Medicina del deporte / medicina física y rehabilitación",
  "Medicina legal y forense",
  "Medicina paliativa",
  "Medicina aeroespacial / medicina aeronáutica",
  "Hidrología médica",
] as const;

export type Especialidad = (typeof ESPECIALIDADES)[number];

export const loginSchema = z.object({
  email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "El nombre es requerido").optional(),
    email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
    dni: z
      .string()
      .min(1, "El DNI es requerido")
      .regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 dígitos numéricos")
      .optional(),
    matricula: z
      .string()
      .min(1, "La matrícula es requerida")
      .regex(/^\d+$/, "La matrícula debe contener solo números"),
    phone: z
      .string()
      .min(1, "El teléfono es requerido")
      .regex(/^\+?[\d\s\-().]{7,20}$/, "Teléfono inválido"),
    especialidad: z
      .string()
      .min(1, "La especialidad es requerida")
      .refine((val) => (ESPECIALIDADES as readonly string[]).includes(val), {
        message: "Seleccioná una especialidad válida",
      }),
    firmaDigital: z.string().optional(),
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
