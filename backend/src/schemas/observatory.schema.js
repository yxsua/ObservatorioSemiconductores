const { z } = require('zod');
const text = (max = 200) => z.string().trim().min(1).max(max);
const url = z.string().trim().max(2000).url().refine(v => /^https?:\/\//i.test(v), 'Usa una URL HTTP o HTTPS.');
const date = z.iso.date();
const optionalText = (max = 200) => text(max).nullable().default(null);
const optionalUrl = url.nullable().default(null);
const amount = z.number().finite().min(-1e15).max(1e15);
const definitions = {
    indicators: { table: 'indicator_observations', schema: z.object({
        series_code: text(80).regex(/^[A-Z0-9_]+$/),
        dimension: z.enum(['ECONOMIC','TECHNOLOGICAL','SOCIAL','REGULATORY','SUSTAINABILITY']),
        period: z.number().int().min(1900).max(2200), value: amount.nullable().default(null),
        assessment: optionalText(),
        upper_value: amount.nullable().default(null), unit: text(80),
        nature: z.enum(['OBSERVED','ESTIMATE','PROJECTION']), methodology: text(10000), geography: text()
    }).strict().refine(v => v.value !== null || v.assessment !== null, 'Indica un valor o una evaluación cualitativa.')
      .refine(v => v.upper_value === null || (v.value !== null && v.upper_value >= v.value), 'El límite superior no puede ser menor al valor.') },
    ecosystem: { table: 'ecosystem_actors', schema: z.object({
        actor_type: z.enum(['COMPANY','ACADEMIA','RESEARCH','GOVERNMENT','CLUSTER']), location: text(),
        website: optionalUrl, capabilities: text(10000), value_chain_stage: text()
    }).strict() },
    investments: { table: 'investments', schema: z.object({
        organization: text(), location: text(), stage: z.enum(['ANNOUNCED','IN_PROGRESS','OPERATING','CANCELLED']),
        amount: amount.min(0).nullable().default(null), currency: text(3).regex(/^[A-Z]{3}$/),
        announced_on: date.nullable().default(null), jobs: z.number().int().min(0).max(100000000).nullable().default(null)
    }).strict() },
    events: { table: 'events', schema: z.object({
        starts_at: z.iso.datetime({ offset: true }), ends_at: z.iso.datetime({ offset: true }),
        organizer: text(), location: text(), registration_url: optionalUrl, photo_media_id: z.number().int().positive().safe().nullable().default(null)
    }).strict().refine(v => Date.parse(v.ends_at) >= Date.parse(v.starts_at), 'El evento debe terminar después de su inicio.') },
    resources: { table: 'resources', schema: z.object({
        resource_type: z.enum(['DATASET','REPORT','TOOL','TRAINING','WEBSITE']), url,
        format: text(80), license: optionalText()
    }).strict() }
};
const ids = z.array(z.number().int().positive().safe()).max(50).default([]).transform(v => [...new Set(v)]);
const fields = {
    title: text(), summary: text(10000), sourceName: text(300), sourceUrl: optionalUrl,
    asOf: date, responsible: text(), validFrom: date.nullable().default(null), validUntil: date.nullable().default(null),
    tags: z.array(text(60)).max(20).default([]).transform(v => [...new Set(v)]),
    mediaIds: ids, signalIds: ids, trendIds: ids
};
function inputSchema(kind, update = false) {
    return z.object({ ...fields, details: definitions[kind].schema,
        ...(update ? { version: z.number().int().positive() } : {})
    }).strict().refine(v => !v.validFrom || !v.validUntil || v.validUntil >= v.validFrom, 'La vigencia final debe ser posterior a la inicial.');
}
const filtersSchema = z.object({
    search: z.string().trim().min(2).max(200).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED']).optional(),
    period: z.coerce.number().int().min(1900).max(2200).optional(),
    tag: text(60).optional()
}).strict();
const transitionSchema = z.object({
    version: z.number().int().positive(),
    action: z.enum(['SUBMIT','APPROVE','REJECT','PUBLISH','ARCHIVE','REOPEN']),
    note: z.string().trim().max(2000).default('')
}).strict();
module.exports = { definitions, inputSchema, filtersSchema, transitionSchema };
