const { z } = require("zod");
const { signalAssessmentSchema, evaluateSignal } = require('../domain/assessment');

function isValidCalendarDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

const catalogCodeSchema = z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase());

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Debe utilizar el formato YYYY-MM-DD.")
    .refine(
        isValidCalendarDate,
        "La fecha no es válida."
    );

const keywordSchema = z
    .string()
    .trim()
    .min(1, "La palabra clave no puede estar vacía.")
    .max(80, "La palabra clave no puede superar 80 caracteres.");

const signalFields = {
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(5000),
    publicationDate: dateSchema,
    evidenceUrl: z.string().trim().url().max(2000),
    categoryId: z.number().int().positive(),
    sourceId: z.number().int().positive(),
    signalTypeCode: catalogCodeSchema,
    assessment: signalAssessmentSchema,
    notes: z.string().trim().max(5000).nullable().optional(),
    keywords: z.array(keywordSchema).max(20).optional().default([])
};

const createSignalSchema = z
    .object(signalFields)
    .strict("Se enviaron campos que no están permitidos.")
    .transform(value => ({...value, ...levels(value.assessment), scopeCode:'IN_IMPACT'}));

function levels(assessment) {
    const {impactCode,urgencyCode,reliabilityCode}=evaluateSignal(assessment);
    return {impactCode,urgencyCode,reliabilityCode};
}

const updateSignalSchema = z
    .object({
        title: signalFields.title.optional(),
        summary: signalFields.summary.optional(),
        publicationDate: signalFields.publicationDate.optional(),
        evidenceUrl: signalFields.evidenceUrl.optional(),
        categoryId: signalFields.categoryId.optional(),
        sourceId: signalFields.sourceId.optional(),
        signalTypeCode: signalFields.signalTypeCode.optional(),
        assessment: signalAssessmentSchema.optional(),
        notes: signalFields.notes,
        keywords: z.array(keywordSchema).max(20).optional(),
        updatedAt: z.string().datetime({ offset: true }).optional()
    })
    .strict("Se enviaron campos que no están permitidos.")
    .refine(
        (value) => Object.keys(value).some((key) => key !== "updatedAt"),
        "Debe enviarse al menos un campo para actualizar."
    ).transform(value => value.assessment ? {...value,...levels(value.assessment),scopeCode:'IN_IMPACT'} : value);

const transitionSignalSchema = z
    .object({
        transition: z.enum([
            "SUBMIT_FOR_REVIEW",
            "REQUEST_CHANGES",
            "VALIDATE",
            "REOPEN",
            "ARCHIVE"
        ]),
        notes: z.string().trim().max(2000).nullable().optional()
    })
    .strict("Se enviaron campos que no están permitidos.");

module.exports = {
    createSignalSchema,
    updateSignalSchema,
    transitionSignalSchema
};
