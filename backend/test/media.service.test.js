const test = require("node:test");
const assert = require("node:assert/strict");
const mediaService = require("../src/services/media.service");

test("el servicio acepta únicamente identificadores positivos", () => {
    assert.equal(mediaService.parseId("12"), 12);
    assert.throws(() => mediaService.parseId("../12"), (error) => error.statusCode === 400);
});

test("el almacenamiento HTTP se clasifica sin descargarlo en el backend", async () => {
    assert.deepEqual(
        await mediaService.resolveStorage("https://cdn.example.com/file.pdf"),
        { kind: "remote", url: "https://cdn.example.com/file.pdf" }
    );
});

test("el almacenamiento local no permite escapar de MEDIA_ROOT", async () => {
    await assert.rejects(
        mediaService.resolveStorage("../../secret.txt"),
        (error) => error.statusCode === 404
    );
});

test("los nombres de descarga eliminan rutas y caracteres de cabecera", () => {
    assert.equal(mediaService.safeFilename("../reporte\r\n.pdf", 3), "reporte.pdf");
});
