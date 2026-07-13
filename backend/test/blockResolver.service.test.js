const test = require("node:test");
const assert = require("node:assert/strict");
const blockResolverService = require("../src/services/blockResolver.service");

test("compact resuelve únicamente la identidad pública", () => {
    const entity = blockResolverService.mapEntity({
        id_signal: "7",
        business_code: "SIG-007",
        title: "Señal pública",
        summary: "Resumen"
    }, "signal", { variant: "compact", fields: {} });
    assert.deepEqual(entity, {
        kind: "signal",
        id: 7,
        businessCode: "SIG-007",
        title: "Señal pública",
        href: "/api/signals/7"
    });
});

test("los fields explícitos sobrescriben la proyección de la variante", () => {
    assert.deepEqual(
        blockResolverService.projectionFor({
            variant: "featured",
            fields: { summary: false, relations: false }
        }),
        { summary: false, metadata: true, relations: false }
    );
});

test("la recolección deduplica referencias antes de consultar", () => {
    const references = blockResolverService.collectReferences([{
        blocks: [
            { type_code: "signal", data: { entityId: 4 } },
            { type_code: "signal", data: { entityId: 4 } },
            { type_code: "image", data: { mediaId: 9 } },
            { type_code: "paragraph", data: { text: "Sin referencia" } }
        ]
    }]);
    assert.deepEqual(references, {
        mediaIds: [9], signalIds: [4], trendIds: [], alertIds: []
    });
});

test("los medios resueltos usan endpoints controlados por la API", () => {
    assert.deepEqual(blockResolverService.mapMedia({
        id_media: "9",
        filename: "documento.pdf",
        original_filename: "Documento.pdf",
        mime_type: "application/pdf",
        extension: "pdf",
        size_bytes: "2048"
    }, "file"), {
        kind: "file",
        id: 9,
        filename: "documento.pdf",
        originalFilename: "Documento.pdf",
        mimeType: "application/pdf",
        extension: "pdf",
        sizeBytes: 2048,
        url: null,
        downloadUrl: "/api/media/9/download"
    });
});
