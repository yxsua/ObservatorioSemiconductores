const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createContentSchema,
    updateContentSchema,
    compositionSchema,
    transitionContentSchema
} = require("../src/schemas/editorial.schema");
const contentService = require("../src/services/content.service");

test("createContentSchema normaliza el tipo editorial", () => {
    const result = createContentSchema.parse({
        typeCode: "report",
        title: "Reporte de semiconductores",
        slug: "reporte-semiconductores"
    });
    assert.equal(result.typeCode, "REPORT");
});

test("updateContentSchema rechaza actualizaciones vacías", () => {
    assert.equal(updateContentSchema.safeParse({}).success, false);
    assert.equal(updateContentSchema.safeParse({ updatedAt: "2026-07-13T00:00:00Z" }).success, false);
});

test("compositionSchema aplica valores predeterminados", () => {
    const result = compositionSchema.parse({
        sections: [{ blocks: [] }]
    });
    assert.equal(result.sections[0].typeCode, "custom");
    assert.equal(result.sections[0].isVisible, true);
    assert.deepEqual(result.relations, {
        categoryIds: [], signalIds: [], trendIds: [], alertIds: []
    });
});

test("la composición deduce relaciones desde bloques de vigilancia", () => {
    const base = compositionSchema.parse({
        sections: [{
            typeCode: "signals",
            blocks: [{
                type: "signal",
                schemaVersion: 1,
                data: { entityId: 21 }
            }]
        }],
        relations: { signalIds: [20] }
    });
    const result = contentService.validateCompositionBlocks(base);
    assert.deepEqual(result.relations.signalIds, [20, 21]);
    assert.equal(result.sections[0].blocks[0].data.variant, "card");
});

test("la composición reporta la ruta completa de un bloque inválido", () => {
    const base = compositionSchema.parse({
        sections: [{ blocks: [{
            type: "paragraph",
            schemaVersion: 1,
            data: { text: "<iframe src='x'></iframe>" }
        }] }]
    });
    assert.throws(
        () => contentService.validateCompositionBlocks(base),
        (error) => error.errors[0].field === "sections.0.blocks.0.data.text"
    );
});

test("transitionContentSchema no acepta estados como transición", () => {
    assert.equal(transitionContentSchema.safeParse({ transition: "PUBLISH" }).success, true);
    assert.equal(transitionContentSchema.safeParse({ transition: "PUBLISHED" }).success, false);
});
