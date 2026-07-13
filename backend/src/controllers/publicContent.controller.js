const publicContentService = require("../services/publicContent.service");
const { successResponse, paginatedResponse } = require("../utils/apiResponse");

async function list(req, res) {
    const result = await publicContentService.list(req.query);
    return res.json(paginatedResponse(
        result.items,
        result.pagination,
        "Contenido público obtenido correctamente."
    ));
}

async function getBySlug(req, res) {
    return res.json(successResponse(
        await publicContentService.getBySlug(req.params.slug),
        "Contenido público obtenido correctamente."
    ));
}

module.exports = { list, getBySlug };

