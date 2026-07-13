const { z } = require("zod");

const nullableUrl = z.string().trim().url().max(2000).nullable().optional();
const nullableText = (max) => z.string().trim().max(max).nullable().optional();
const sourceFields = {
    typeCode: z.string().trim().min(1).max(40)
        .transform((value) => value.toUpperCase()),
    name: z.string().trim().min(1).max(200),
    website: nullableUrl,
    country: nullableText(100),
    rssUrl: nullableUrl,
    apiUrl: nullableUrl,
    historicalReliability: z.number().min(0).max(1).nullable().optional()
};

const createSourceSchema = z.object(sourceFields)
    .strict("Se enviaron campos que no están permitidos.");
const updateSourceSchema = z.object({
    ...Object.fromEntries(Object.entries(sourceFields).map(([key, value]) => [key, value.optional()])),
    updatedAt: z.string().datetime({ offset: true })
}).strict("Se enviaron campos que no están permitidos.")
    .refine((value) => Object.keys(value).some((key) => key !== "updatedAt"),
        "Debe enviarse al menos un campo para actualizar.");
const deactivateSourceSchema = z.object({
    updatedAt: z.string().datetime({ offset: true })
}).strict("Se enviaron campos que no están permitidos.");

module.exports = { createSourceSchema, updateSourceSchema, deactivateSourceSchema };
