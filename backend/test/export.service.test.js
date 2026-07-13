const test = require("node:test");
const assert = require("node:assert/strict");
const exportService = require("../src/services/export.service");

test("valida recursos, formatos y filtros exclusivos de exportación", () => {
    assert.deepEqual(
        exportService.validateRequest(" Signals ", "CSV", { search: "chips" }),
        { resource: "signals", format: "csv" }
    );
    assert.throws(
        () => exportService.validateRequest("private", "xlsx", {}),
        (error) => error.statusCode === 400
            && error.errors.some((item) => item.field === "resource")
            && error.errors.some((item) => item.field === "format")
    );
    assert.throws(
        () => exportService.validateRequest("signals", "csv", { page: "1" }),
        (error) => error.statusCode === 400 && error.errors[0].field === "page"
    );
    assert.throws(
        () => exportService.validateRequest("signals", "csv", { fcv: ["A", "B"] }),
        (error) => error.statusCode === 400 && error.errors[0].field === "fcv"
    );
});

test("el CSV usa BOM, CRLF, comillas y neutraliza fórmulas", () => {
    const buffer = exportService.toCsv("content", [{
        id: 7,
        slug: "reporte-prueba",
        type: { code: "REPORT" },
        title: "=HYPERLINK(\"https://evil.example\")",
        summary: "Texto, con coma",
        categories: [{ name: "Diseño \"avanzado\"" }],
        publishedAt: "2026-07-13T12:00:00.000Z"
    }]);
    const csv = buffer.toString("utf8");
    assert.equal(csv.charCodeAt(0), 0xFEFF);
    assert.match(csv, /\r\n$/);
    assert.match(csv, /"'=HYPERLINK\(""https:\/\/evil\.example""\)"/);
    assert.match(csv, /"Texto, con coma"/);
    assert.match(csv, /"Diseño ""avanzado"""/);
});

test("el nombre de archivo no contiene separadores inseguros", () => {
    assert.equal(
        exportService.filename("alerts", "json", "2026-07-13T12:34:56.789Z"),
        "observatorio-alerts-20260713T123456Z.json"
    );
});

test("el límite configurable es positivo y nunca supera diez mil", () => {
    const original = process.env.EXPORT_MAX_ROWS;
    try {
        process.env.EXPORT_MAX_ROWS = "250";
        assert.equal(exportService.maxRows(), 250);
        process.env.EXPORT_MAX_ROWS = "99999";
        assert.equal(exportService.maxRows(), 10000);
        process.env.EXPORT_MAX_ROWS = "inválido";
        assert.equal(exportService.maxRows(), 5000);
    } finally {
        if (original === undefined) delete process.env.EXPORT_MAX_ROWS;
        else process.env.EXPORT_MAX_ROWS = original;
    }
});
