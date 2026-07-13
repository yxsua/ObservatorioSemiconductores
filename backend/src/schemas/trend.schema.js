const { z } = require("zod");

const codeSchema = z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase());

const idArraySchema = z
    .array(z.number().int().positive())
    .max(100)
    .transform((values) => [...new Set(values)]);

const createTrendSchema = z
    .object({
        title: z.string().trim().min(1).max(200),
        narrative: z.string().trim().min(1).max(10000),
        implications: z.string().trim().max(10000).nullable().optional(),
        directionCode: codeSchema.nullable().optional(),
        maturityCode: codeSchema.nullable().optional(),
        methodologyNotes: z.string().trim().max(5000).nullable().optional(),
        signalIds: idArraySchema.optional().default([]),
        actorIds: idArraySchema.optional().default([])
    })
    .strict("Se enviaron campos que no están permitidos.");

const updateTrendSchema = z
    .object({
        title: z.string().trim().min(1).max(200).optional(),
        narrative: z.string().trim().min(1).max(10000).optional(),
        implications: z.string().trim().max(10000).nullable().optional(),
        directionCode: codeSchema.nullable().optional(),
        maturityCode: codeSchema.nullable().optional(),
        methodologyNotes: z.string().trim().max(5000).nullable().optional(),
        updatedAt: z.string().datetime({ offset: true }).optional()
    })
    .strict("Se enviaron campos que no están permitidos.")
    .refine(
        (value) => Object.keys(value).some((key) => key !== "updatedAt"),
        "Debe enviarse al menos un campo para actualizar."
    );

const trendRelationsSchema = z
    .object({
        ids: z.array(z.number().int().positive()).min(1).max(100)
            .transform((values) => [...new Set(values)])
    })
    .strict("Se enviaron campos que no están permitidos.");

const transitionTrendSchema = z
    .object({
        transition: z.enum([
            "SUBMIT_FOR_REVIEW",
            "REQUEST_CHANGES",
            "VALIDATE",
            "REOPEN",
            "ACTIVATE",
            "ARCHIVE"
        ]),
        notes: z.string().trim().max(2000).nullable().optional()
    })
    .strict("Se enviaron campos que no están permitidos.");

module.exports = {
    createTrendSchema,
    updateTrendSchema,
    trendRelationsSchema,
    transitionTrendSchema
};
