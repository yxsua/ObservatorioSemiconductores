const exportService = require("../services/export.service");
const { paginatedResponse } = require("../utils/apiResponse");

async function download(req, res) {
    const result = await exportService.generate(
        req.params.resource,
        req.params.format,
        req.query,
        req.user.id
    );
    res.set({
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": String(result.sizeBytes),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Export-Id": String(result.id),
        "X-Row-Count": String(result.rowCount),
        "X-Checksum-SHA256": result.checksum
    });
    return res.send(result.buffer);
}

async function history(req, res) {
    const result = await exportService.history(req.user.id, req.query);
    return res.json(paginatedResponse(
        result.items,
        result.pagination,
        "Historial de exportaciones obtenido correctamente."
    ));
}

module.exports = { download, history };

