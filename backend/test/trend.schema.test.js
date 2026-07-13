const test = require("node:test");
const assert = require("node:assert/strict");
const {
    createTrendSchema,
    updateTrendSchema,
    trendRelationsSchema,
    transitionTrendSchema
} = require("../src/schemas/trend.schema");

test("createTrendSchema normaliza catálogos y elimina relaciones duplicadas", () => {
    const result = createTrendSchema.parse({
        title: "Empaque avanzado",
        narrative: "Patrón sostenido de inversión.",
        directionCode: "increasing",
        maturityCode: "emerging",
        signalIds: [1, 1, 2]
    });
    assert.equal(result.directionCode, "INCREASING");
    assert.deepEqual(result.signalIds, [1, 2]);
    assert.deepEqual(result.actorIds, []);
});

test("updateTrendSchema rechaza una actualización vacía", () => {
    assert.equal(updateTrendSchema.safeParse({}).success, false);
});

test("trendRelationsSchema requiere al menos una relación", () => {
    assert.equal(trendRelationsSchema.safeParse({ ids: [] }).success, false);
});

test("transitionTrendSchema acepta ACTIVATE", () => {
    assert.equal(
        transitionTrendSchema.parse({ transition: "ACTIVATE" }).transition,
        "ACTIVATE"
    );
});

test("transitionTrendSchema rechaza estados enviados como transición", () => {
    assert.equal(
        transitionTrendSchema.safeParse({ transition: "ACTIVE" }).success,
        false
    );
});
