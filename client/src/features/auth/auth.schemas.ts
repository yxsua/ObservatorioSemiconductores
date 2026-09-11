import { z } from "zod";

const email = z.string()
  .trim()
  .min(1, "El correo electrónico es obligatorio.")
  .max(150, "El correo electrónico no puede superar 150 caracteres.")
  .email("El correo electrónico no tiene un formato válido.");

const securePassword = z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(100, "La contraseña no puede superar 100 caracteres.")
  .regex(/[a-z]/, "Debe incluir una letra minúscula.")
  .regex(/[A-Z]/, "Debe incluir una letra mayúscula.")
  .regex(/[0-9]/, "Debe incluir un número.");

export const loginFormSchema = z.object({
  email,
  password: z.string()
    .min(1, "La contraseña es obligatoria.")
    .max(100, "La contraseña no puede superar 100 caracteres.")
});

export const registerFormSchema = z.object({
  acceptedTerms: z.boolean().refine(v=>v,"Debes aceptar los términos y leer el aviso de privacidad."),
  firstName: z.string().trim()
    .min(1, "El nombre es obligatorio.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  lastName: z.string().trim()
    .min(1, "El apellido es obligatorio.")
    .max(80, "El apellido no puede superar 80 caracteres."),
  email,
  password: securePassword,
  confirmPassword: z.string()
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden."
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const resetPasswordFormSchema=z.object({password:securePassword,confirmPassword:z.string()}).refine(v=>v.password===v.confirmPassword,{path:["confirmPassword"],message:"Las contraseñas no coinciden."});
