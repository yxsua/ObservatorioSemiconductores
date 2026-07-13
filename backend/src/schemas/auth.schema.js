const { z } = require("zod");

const emailSchema = z
    .string({
        required_error: "El correo electrónico es obligatorio.",
        invalid_type_error:
            "El correo electrónico debe ser una cadena de texto."
    })
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .max(
        150,
        "El correo electrónico no puede superar los 150 caracteres."
    )
    .email("El formato del correo electrónico no es válido.")
    .transform((email) => email.toLowerCase());

const passwordSchema = z
    .string({
        required_error: "La contraseña es obligatoria.",
        invalid_type_error:
            "La contraseña debe ser una cadena de texto."
    })
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(100, "La contraseña no puede superar los 100 caracteres.")
    .regex(
        /[a-z]/,
        "La contraseña debe contener al menos una letra minúscula."
    )
    .regex(
        /[A-Z]/,
        "La contraseña debe contener al menos una letra mayúscula."
    )
    .regex(
        /[0-9]/,
        "La contraseña debe contener al menos un número."
    );

const registerSchema = z
    .object({
        firstName: z
            .string({
                required_error: "El nombre es obligatorio.",
                invalid_type_error:
                    "El nombre debe ser una cadena de texto."
            })
            .trim()
            .min(1, "El nombre es obligatorio.")
            .max(
                80,
                "El nombre no puede superar los 80 caracteres."
            ),

        lastName: z
            .string({
                required_error: "El apellido es obligatorio.",
                invalid_type_error:
                    "El apellido debe ser una cadena de texto."
            })
            .trim()
            .min(1, "El apellido es obligatorio.")
            .max(
                80,
                "El apellido no puede superar los 80 caracteres."
            ),

        email: emailSchema,

        password: passwordSchema
    })
    .strict("Se enviaron campos que no están permitidos.");

const loginSchema = z
    .object({
        email: emailSchema,

        password: z
            .string({
                required_error: "La contraseña es obligatoria.",
                invalid_type_error:
                    "La contraseña debe ser una cadena de texto."
            })
            .min(1, "La contraseña es obligatoria.")
            .max(
                100,
                "La contraseña no puede superar los 100 caracteres."
            )
    })
    .strict("Se enviaron campos que no están permitidos.");

module.exports = {
    registerSchema,
    loginSchema
};