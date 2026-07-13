const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateBlock,
    listBlockDescriptors
} = require("../src/editorial/blockRegistry");

test("el registro expone únicamente los trece bloques MVP", () => {
    const descriptors = listBlockDescriptors();
    assert.equal(descriptors.length, 13);
    assert.deepEqual(
        descriptors.map((item) => item.code).sort(),
        [
            "alert", "callout", "chart", "divider", "file", "heading",
            "image", "list", "paragraph", "quote", "signal", "table", "trend"
        ]
    );
    assert.ok(descriptors.every((item) => item.schemaVersion === 1));
});

test("validateBlock normaliza un párrafo y aplica valores predeterminados", () => {
    const block = validateBlock({
        type: " PARAGRAPH ",
        schemaVersion: 1,
        data: { text: "Contenido editorial" }
    });
    assert.equal(block.type, "paragraph");
    assert.equal(block.data.format, "plain");
    assert.equal(block.isVisible, true);
    assert.deepEqual(block.settings, {});
});

test("validateBlock rechaza tipos no habilitados", () => {
    assert.throws(() => validateBlock({
        type: "embed",
        schemaVersion: 1,
        data: { html: "<script>alert(1)</script>" }
    }), /no está habilitado/i);
});

test("validateBlock rechaza versiones de esquema desactualizadas", () => {
    assert.throws(() => validateBlock({
        type: "heading",
        schemaVersion: 2,
        data: { text: "Título", level: 2 }
    }), /versión admitida/i);
});

test("un párrafo no admite HTML arbitrario", () => {
    assert.throws(() => validateBlock({
        type: "paragraph",
        schemaVersion: 1,
        data: { text: "<script>alert(1)</script>", format: "markdown" }
    }), /no se admite HTML/i);
});

test("una tabla rechaza celdas que no pertenecen a sus columnas", () => {
    assert.throws(() => validateBlock({
        type: "table",
        schemaVersion: 1,
        data: {
            columns: [{ key: "name", label: "Nombre", type: "text" }],
            rows: [{ name: "Ejemplo", hidden: "no permitido" }]
        }
    }), /no corresponde a una columna/i);
});

test("una tabla valida el tipo declarado de cada celda", () => {
    assert.throws(() => validateBlock({
        type: "table",
        schemaVersion: 1,
        data: {
            columns: [{ key: "total", label: "Total", type: "number" }],
            rows: [{ total: "diez" }]
        }
    }), /tipo number/i);
});

test("una gráfica exige un valor por cada etiqueta", () => {
    assert.throws(() => validateBlock({
        type: "chart",
        schemaVersion: 1,
        data: {
            chartType: "line",
            labels: ["2025", "2026"],
            series: [{ name: "Producción", values: [10] }]
        }
    }), /valor por etiqueta/i);
});

test("los bloques de vigilancia conservan referencias y no copias", () => {
    const block = validateBlock({
        type: "signal",
        schemaVersion: 1,
        data: { entityId: 42 }
    });
    assert.deepEqual(block.data, {
        entityId: 42,
        variant: "card",
        fields: {}
    });
});
