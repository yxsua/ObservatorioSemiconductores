const test = require("node:test");
const assert = require("node:assert/strict");
const {
    createAlertSchema,
    updateAlertSchema,
    alertIdRelationsSchema,
    alertAudienceRelationsSchema,
    transitionAlertSchema
} = require("../src/schemas/alert.schema");

test("createAlertSchema normaliza códigos y relaciones", () => {
    const result = createAlertSchema.parse({
        title: "Riesgo de talento",
        executiveSummary: "La evidencia indica una posible escasez.",
        levelCode: "orange",
        signalIds: [1, 1, 2],
        audienceCodes: ["industry", "INDUSTRY"]
    });
    assert.equal(result.levelCode, "ORANGE");
    assert.deepEqual(result.signalIds, [1, 2]);
    assert.deepEqual(result.audienceCodes, ["INDUSTRY"]);
});

test("createAlertSchema rechaza fechas inexistentes", () => {
    assert.equal(createAlertSchema.safeParse({
        title: "Alerta",
        executiveSummary: "Resumen",
        responseDeadline: "2026-02-31"
    }).success, false);
});

test("updateAlertSchema rechaza actualizaciones vacías", () => {
    assert.equal(updateAlertSchema.safeParse({}).success, false);
});

test("las relaciones de evidencia requieren al menos un id", () => {
    assert.equal(alertIdRelationsSchema.safeParse({ ids: [] }).success, false);
});

test("las audiencias se normalizan a códigos únicos", () => {
    assert.deepEqual(
        alertAudienceRelationsSchema.parse({ codes: ["academia", "ACADEMIA"] }).codes,
        ["ACADEMIA"]
    );
});

test("transitionAlertSchema acepta PUBLISH y rechaza PUBLISHED", () => {
    assert.equal(
        transitionAlertSchema.safeParse({ transition: "PUBLISH" }).success,
        true
    );
    assert.equal(
        transitionAlertSchema.safeParse({ transition: "PUBLISHED" }).success,
        false
    );
});
