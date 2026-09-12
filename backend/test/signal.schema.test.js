const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createSignalSchema,
    updateSignalSchema,
    transitionSignalSchema
} = require("../src/schemas/signal.schema");

const validSignal = {
    title: "Nueva inversión",
    summary: "Evidencia relevante para el ecosistema.",
    publicationDate: "2026-07-12",
    evidenceUrl: "https://example.com/evidence",
    categoryId: 1,
    sourceId: 1,
    signalTypeCode: "strong",
    assessment:{version:'2026-07-21',impact:[2,2,2,2,2],urgency:[1,1,1,1,1],reliability:Array(19).fill('YES')}
};

test("createSignalSchema normaliza códigos de catálogo", () => {
    const result = createSignalSchema.parse(validSignal);
    assert.equal(result.signalTypeCode, "STRONG");
    assert.equal(result.reliabilityCode, "HIGH");
    assert.deepEqual(result.keywords, []);
});

test("createSignalSchema impide que el cliente envíe IPS o analista", () => {
    const result = createSignalSchema.safeParse({
        ...validSignal,
        ips: 27,
        analystId: 99
    });
    assert.equal(result.success, false);
});

test("updateSignalSchema rechaza actualizaciones vacías", () => {
    assert.equal(updateSignalSchema.safeParse({}).success, false);
});

test("transitionSignalSchema acepta transiciones canónicas", () => {
    assert.deepEqual(
        transitionSignalSchema.parse({ transition: "VALIDATE" }),
        { transition: "VALIDATE" }
    );
});

test("transitionSignalSchema rechaza estados arbitrarios", () => {
    assert.equal(
        transitionSignalSchema.safeParse({ transition: "VALIDATED" }).success,
        false
    );
});

test("createSignalSchema rechaza fechas inexistentes", () => {
    assert.equal(
        createSignalSchema.safeParse({
            ...validSignal,
            publicationDate: "2026-02-31"
        }).success,
        false
    );
});
