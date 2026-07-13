const { z } = require("zod");

const codeSchema = z.string().trim().min(1).max(50)
    .transform((value) => value.toUpperCase());
const sectionCodeSchema = z.string().trim().min(1).max(50)
    .transform((value) => value.toLowerCase());
const nullableText = (max) => z.string().trim().max(max).nullable().optional();
const positiveId = z.number().int().positive();
const jsonObject = z.record(z.string(), z.unknown());
const idArray = (max = 100) => z.array(positiveId).max(max)
    .transform((values) => [...new Set(values)]);

const createContentSchema = z.object({
    typeCode: codeSchema,
    title: z.string().trim().min(1).max(250),
    summary: nullableText(10000),
    slug: z.string().trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .max(250).nullable().optional(),
    featuredMediaId: positiveId.nullable().optional(),
    templateId: positiveId.nullable().optional()
}).strict("Se enviaron campos que no están permitidos.");

const updateContentSchema = z.object({
    typeCode: codeSchema.optional(),
    title: z.string().trim().min(1).max(250).optional(),
    summary: nullableText(10000),
    slug: z.string().trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .max(250).optional(),
    featuredMediaId: positiveId.nullable().optional(),
    updatedAt: z.string().datetime({ offset: true }).optional()
}).strict("Se enviaron campos que no están permitidos.").refine(
    (value) => Object.keys(value).some((key) => key !== "updatedAt"),
    "Debe enviarse al menos un campo para actualizar."
);

const createVersionSchema = z.object({
    changeSummary: z.string().trim().min(1).max(2000)
}).strict("Se enviaron campos que no están permitidos.");

const compositionSectionSchema = z.object({
    typeCode: sectionCodeSchema.default("custom"),
    title: nullableText(150),
    isCollapsible: z.boolean().optional().default(false),
    isVisible: z.boolean().optional().default(true),
    settings: jsonObject.optional().default({}),
    blocks: z.array(z.unknown()).max(200).optional().default([])
}).strict("Se enviaron campos que no están permitidos.");

const compositionSchema = z.object({
    sections: z.array(compositionSectionSchema).max(100),
    relations: z.object({
        categoryIds: idArray().optional().default([]),
        signalIds: idArray().optional().default([]),
        trendIds: idArray().optional().default([]),
        alertIds: idArray().optional().default([])
    }).strict().optional().default({
        categoryIds: [], signalIds: [], trendIds: [], alertIds: []
    }),
    updatedAt: z.string().datetime({ offset: true }).optional()
}).strict("Se enviaron campos que no están permitidos.");

const transitionContentSchema = z.object({
    transition: z.enum([
        "SUBMIT_FOR_REVIEW",
        "REQUEST_CHANGES",
        "APPROVE",
        "REOPEN",
        "PUBLISH",
        "ARCHIVE"
    ]),
    notes: nullableText(2000)
}).strict("Se enviaron campos que no están permitidos.");

module.exports = {
    createContentSchema,
    updateContentSchema,
    createVersionSchema,
    compositionSchema,
    transitionContentSchema
};
