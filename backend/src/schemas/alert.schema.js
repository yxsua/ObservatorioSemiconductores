const { z } = require("zod");

function isValidCalendarDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

const codeSchema = z.string().trim().min(1).max(40)
    .transform((value) => value.toUpperCase());
const nullableText = (max) => z.string().trim().max(max).nullable().optional();
const dateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Debe utilizar YYYY-MM-DD.")
    .refine(isValidCalendarDate, "La fecha no es válida.");
const idArray = z.array(z.number().int().positive()).max(100)
    .transform((values) => [...new Set(values)]);
const codeArray = z.array(codeSchema).max(50)
    .transform((values) => [...new Set(values)]);

const createAlertSchema = z.object({
    title: z.string().trim().min(1).max(150),
    executiveSummary: z.string().trim().min(1).max(10000),
    implications: nullableText(10000),
    recommendations: nullableText(10000),
    responseDeadline: dateSchema.nullable().optional(),
    levelCode: codeSchema.nullable().optional(),
    activationRule: nullableText(5000),
    notes: nullableText(5000),
    signalIds: idArray.optional().default([]),
    trendIds: idArray.optional().default([]),
    audienceCodes: codeArray.optional().default([])
}).strict("Se enviaron campos que no están permitidos.");

const updateAlertSchema = z.object({
    title: z.string().trim().min(1).max(150).optional(),
    executiveSummary: z.string().trim().min(1).max(10000).optional(),
    implications: nullableText(10000),
    recommendations: nullableText(10000),
    responseDeadline: dateSchema.nullable().optional(),
    levelCode: codeSchema.nullable().optional(),
    activationRule: nullableText(5000),
    notes: nullableText(5000),
    updatedAt: z.string().datetime({ offset: true }).optional()
}).strict("Se enviaron campos que no están permitidos.").refine(
    (value) => Object.keys(value).some((key) => key !== "updatedAt"),
    "Debe enviarse al menos un campo para actualizar."
);

const alertIdRelationsSchema = z.object({
    ids: z.array(z.number().int().positive()).min(1).max(100)
        .transform((values) => [...new Set(values)])
}).strict("Se enviaron campos que no están permitidos.");

const alertAudienceRelationsSchema = z.object({
    codes: z.array(codeSchema).min(1).max(50)
        .transform((values) => [...new Set(values)])
}).strict("Se enviaron campos que no están permitidos.");

const transitionAlertSchema = z.object({
    transition: z.enum([
        "SUBMIT_FOR_REVIEW",
        "REQUEST_CHANGES",
        "VALIDATE",
        "REOPEN",
        "PUBLISH",
        "CLOSE"
    ]),
    notes: nullableText(2000)
}).strict("Se enviaron campos que no están permitidos.");

module.exports = {
    createAlertSchema,
    updateAlertSchema,
    alertIdRelationsSchema,
    alertAudienceRelationsSchema,
    transitionAlertSchema
};
