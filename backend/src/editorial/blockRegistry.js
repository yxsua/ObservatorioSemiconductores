const { z } = require("zod");

const nonEmptyText = (max) => z.string().trim().min(1).max(max);
const optionalText = (max) => z.string().trim().max(max).nullable().optional();
const positiveId = z.number().int().positive();
const schemaVersion = 1;
const safeUrl = z.string().trim().url().max(2000).refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
}, "Solo se admiten URL HTTP o HTTPS.");
const paragraphText = nonEmptyText(20000).refine(
    (value) => !/<\/?[a-z][^>]*>/i.test(value),
    "No se admite HTML dentro de un párrafo."
);

const commonSettingsSchema = z.object({
    width: z.enum(["narrow", "content", "wide", "full"]).optional(),
    alignment: z.enum(["left", "center", "right"]).optional(),
    background: z.enum(["none", "muted", "accent"]).optional()
}).strict();

const referenceFieldsSchema = z.object({
    summary: z.boolean().optional(),
    metadata: z.boolean().optional(),
    relations: z.boolean().optional()
}).strict();

const referenceSchema = z.object({
    entityId: positiveId,
    variant: z.enum(["compact", "card", "featured"]).default("card"),
    fields: referenceFieldsSchema.optional().default({})
}).strict();

const tableColumnSchema = z.object({
    key: z.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/),
    label: nonEmptyText(100),
    type: z.enum(["text", "number", "boolean", "date"]).default("text")
}).strict();

const tableCellSchema = z.union([
    z.string().max(2000),
    z.number().finite(),
    z.boolean(),
    z.null()
]);

const tableDataSchema = z.object({
    caption: optionalText(300),
    columns: z.array(tableColumnSchema).min(1).max(20),
    rows: z.array(z.record(z.string(), tableCellSchema)).max(500)
}).strict().superRefine((value, context) => {
    const keys = value.columns.map((column) => column.key);
    if (new Set(keys).size !== keys.length) {
        context.addIssue({
            code: "custom",
            path: ["columns"],
            message: "Las claves de columna deben ser únicas."
        });
    }
    const allowedKeys = new Set(keys);
    value.rows.forEach((row, rowIndex) => {
        Object.keys(row).forEach((key) => {
            if (!allowedKeys.has(key)) {
                context.addIssue({
                    code: "custom",
                    path: ["rows", rowIndex, key],
                    message: "La celda no corresponde a una columna declarada."
                });
            }
        });
        value.columns.forEach((column) => {
            const cell = row[column.key];
            if (cell === undefined || cell === null) return;
            const validType = (
                (column.type === "text" && typeof cell === "string")
                || (column.type === "number" && typeof cell === "number")
                || (column.type === "boolean" && typeof cell === "boolean")
                || (
                    column.type === "date"
                    && typeof cell === "string"
                    && /^\d{4}-\d{2}-\d{2}$/.test(cell)
                )
            );
            if (!validType) {
                context.addIssue({
                    code: "custom",
                    path: ["rows", rowIndex, column.key],
                    message: `La celda debe respetar el tipo ${column.type}.`
                });
            }
        });
    });
});

const chartDataSchema = z.object({
    chartType: z.enum(["bar", "line", "area", "pie"]),
    title: optionalText(300),
    labels: z.array(nonEmptyText(100)).min(1).max(1000),
    series: z.array(z.object({
        name: nonEmptyText(100),
        values: z.array(z.number().finite()).min(1).max(1000),
        color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).optional()
    }).strict()).min(1).max(20)
}).strict().superRefine((value, context) => {
    value.series.forEach((series, index) => {
        if (series.values.length !== value.labels.length) {
            context.addIssue({
                code: "custom",
                path: ["series", index, "values"],
                message: "Cada serie debe tener un valor por etiqueta."
            });
        }
    });
});

function definition(name, category, dataSchema, dataContract) {
    return Object.freeze({
        schemaVersion,
        name,
        category,
        dataSchema,
        settingsSchema: commonSettingsSchema,
        dataContract
    });
}

const BLOCK_REGISTRY = Object.freeze({
    heading: definition(
        "Encabezado", "text",
        z.object({
            text: nonEmptyText(300),
            level: z.number().int().min(2).max(6).default(2),
            anchor: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()
        }).strict(),
        { text: "string", level: "integer:2..6", anchor: "slug?" }
    ),
    paragraph: definition(
        "Párrafo", "text",
        z.object({
            text: paragraphText,
            format: z.enum(["plain", "markdown"]).default("plain")
        }).strict(),
        { text: "string", format: "plain|markdown" }
    ),
    quote: definition(
        "Cita", "text",
        z.object({
            text: nonEmptyText(5000),
            attribution: optionalText(300),
            source: optionalText(500)
        }).strict(),
        { text: "string", attribution: "string?", source: "string?" }
    ),
    list: definition(
        "Lista", "text",
        z.object({
            style: z.enum(["unordered", "ordered"]).default("unordered"),
            items: z.array(nonEmptyText(2000)).min(1).max(100)
        }).strict(),
        { style: "unordered|ordered", items: "string[]" }
    ),
    callout: definition(
        "Aviso", "text",
        z.object({
            tone: z.enum(["info", "warning", "success", "danger"]).default("info"),
            title: optionalText(200),
            text: nonEmptyText(5000)
        }).strict(),
        { tone: "info|warning|success|danger", title: "string?", text: "string" }
    ),
    divider: definition(
        "Separador", "layout", z.object({}).strict(), {}
    ),
    image: definition(
        "Imagen", "media",
        z.object({
            mediaId: positiveId,
            alt: nonEmptyText(300),
            caption: optionalText(1000),
            linkUrl: safeUrl.nullable().optional()
        }).strict(),
        { mediaId: "positiveInteger", alt: "string", caption: "string?", linkUrl: "url?" }
    ),
    file: definition(
        "Archivo", "media",
        z.object({
            mediaId: positiveId,
            label: nonEmptyText(250),
            description: optionalText(1000)
        }).strict(),
        { mediaId: "positiveInteger", label: "string", description: "string?" }
    ),
    table: definition(
        "Tabla", "data", tableDataSchema,
        { caption: "string?", columns: "TableColumn[]", rows: "Record<string, scalar>[]" }
    ),
    chart: definition(
        "Gráfico", "data", chartDataSchema,
        { chartType: "bar|line|area|pie", labels: "string[]", series: "ChartSeries[]" }
    ),
    signal: definition(
        "Señal", "surveillance", referenceSchema,
        { entityId: "positiveInteger", variant: "compact|card|featured", fields: "ReferenceFields?" }
    ),
    trend: definition(
        "Tendencia", "surveillance", referenceSchema,
        { entityId: "positiveInteger", variant: "compact|card|featured", fields: "ReferenceFields?" }
    ),
    alert: definition(
        "Alerta", "surveillance", referenceSchema,
        { entityId: "positiveInteger", variant: "compact|card|featured", fields: "ReferenceFields?" }
    )
});

const blockEnvelopeSchema = z.object({
    type: z.string().trim().min(1).max(40)
        .transform((value) => value.toLowerCase()),
    schemaVersion: z.number().int().positive(),
    data: z.unknown(),
    settings: commonSettingsSchema.optional().default({}),
    position: z.number().int().positive().optional(),
    isVisible: z.boolean().optional().default(true),
    cssClass: z.string().trim()
        .regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,99}$/)
        .nullable().optional()
}).strict();

function validateBlock(input) {
    const envelope = blockEnvelopeSchema.parse(input);
    const blockDefinition = BLOCK_REGISTRY[envelope.type];
    if (!blockDefinition) {
        throw new z.ZodError([{
            code: "custom",
            path: ["type"],
            message: "El tipo de bloque no está habilitado."
        }]);
    }
    if (envelope.schemaVersion !== blockDefinition.schemaVersion) {
        throw new z.ZodError([{
            code: "custom",
            path: ["schemaVersion"],
            message: `La versión admitida es ${blockDefinition.schemaVersion}.`
        }]);
    }
    const dataResult = blockDefinition.dataSchema.safeParse(envelope.data);
    if (!dataResult.success) {
        throw new z.ZodError(dataResult.error.issues.map((issue) => ({
            ...issue,
            path: ["data", ...issue.path]
        })));
    }
    return {
        ...envelope,
        data: dataResult.data,
        settings: blockDefinition.settingsSchema.parse(envelope.settings)
    };
}

function getBlockDescriptor(code) {
    const blockDefinition = BLOCK_REGISTRY[code];
    if (!blockDefinition) return null;
    return {
        code,
        name: blockDefinition.name,
        category: blockDefinition.category,
        schemaVersion: blockDefinition.schemaVersion,
        dataContract: blockDefinition.dataContract,
        settingsContract: {
            width: "narrow|content|wide|full",
            alignment: "left|center|right",
            background: "none|muted|accent"
        }
    };
}

function listBlockDescriptors() {
    return Object.keys(BLOCK_REGISTRY).map(getBlockDescriptor);
}

module.exports = {
    BLOCK_REGISTRY,
    validateBlock,
    getBlockDescriptor,
    listBlockDescriptors
};
