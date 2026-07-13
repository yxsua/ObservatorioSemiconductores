const test = require("node:test");
const assert = require("node:assert/strict");
const { createSourceSchema, updateSourceSchema } = require("../src/schemas/source.schema");
const sourceService = require("../src/services/source.service");

test("normaliza el tipo y acepta confiabilidad histórica entre cero y uno", () => {
    const result = createSourceSchema.parse({
        typeCode: "news", name: "Fuente regional",
        website: "https://example.com", historicalReliability: 0.85
    });
    assert.equal(result.typeCode, "NEWS");
    assert.equal(result.historicalReliability, 0.85);
});

test("rechaza confiabilidad histórica fuera del rango", () => {
    assert.equal(createSourceSchema.safeParse({
        typeCode: "NEWS", name: "Fuente", historicalReliability: 1.2
    }).success, false);
});

test("actualización exige versión y al menos un cambio", () => {
    assert.equal(updateSourceSchema.safeParse({ updatedAt: "2026-07-13T12:00:00.000Z" }).success, false);
    assert.equal(updateSourceSchema.safeParse({ name: "Nueva", updatedAt: "2026-07-13T12:00:00.000Z" }).success, true);
});

test("el listado conserva fuentes activas para captura y restringe el histórico", () => {
    assert.deepEqual(sourceService.parseFilters({}, { permissions: [] }), { search: null, active: true });
    assert.throws(() => sourceService.parseFilters({ active: "all" }, { permissions: [] }), /permiso/);
    assert.equal(sourceService.parseFilters({ active: "all" }, { permissions: ["sources:read-internal"] }).active, null);
});
