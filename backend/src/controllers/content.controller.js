const contentService = require("../services/content.service");
const { successResponse, paginatedResponse } = require("../utils/apiResponse");

async function list(req, res) {
    const result = await contentService.list(req.query);
    return res.json(paginatedResponse(
        result.items, result.pagination,
        "Contenido editorial obtenido correctamente."
    ));
}

async function create(req, res) {
    return res.status(201).json(successResponse(
        await contentService.create(req.body, req.user),
        "Contenido editorial creado correctamente."
    ));
}

async function get(req, res) {
    return res.json(successResponse(
        await contentService.getById(req.params.id),
        "Contenido editorial obtenido correctamente."
    ));
}

async function update(req, res) {
    return res.json(successResponse(
        await contentService.update(req.params.id, req.body),
        "Contenido editorial actualizado correctamente."
    ));
}

async function listVersions(req, res) {
    return res.json(successResponse(
        await contentService.listVersions(req.params.id),
        "Versiones editoriales obtenidas correctamente."
    ));
}

async function getVersion(req, res) {
    return res.json(successResponse(
        await contentService.getVersion(req.params.id, req.params.versionId),
        "Versión editorial obtenida correctamente."
    ));
}

async function createVersion(req, res) {
    return res.status(201).json(successResponse(
        await contentService.createVersion(req.params.id, req.body, req.user),
        "Revisión editorial creada correctamente."
    ));
}

async function replaceComposition(req, res) {
    return res.json(successResponse(
        await contentService.replaceComposition(
            req.params.id, req.params.versionId, req.body
        ),
        "Composición editorial guardada correctamente."
    ));
}

async function transition(req, res) {
    return res.json(successResponse(
        await contentService.transition(req.params.id, req.body, req.user),
        "Estado editorial actualizado correctamente."
    ));
}

async function history(req, res) {
    return res.json(successResponse(
        await contentService.history(req.params.id),
        "Historial editorial obtenido correctamente."
    ));
}

async function preview(req, res) {
    return res.json(successResponse(
        await contentService.preview(req.params.id),
        "Vista previa editorial obtenida correctamente."
    ));
}

async function listTemplates(req, res) {
    return res.json(successResponse(
        await contentService.listTemplates(req.query),
        "Plantillas editoriales obtenidas correctamente."
    ));
}

async function getTemplate(req, res) {
    return res.json(successResponse(
        await contentService.getTemplate(req.params.id),
        "Plantilla editorial obtenida correctamente."
    ));
}

module.exports = {
    list,
    create,
    get,
    update,
    listVersions,
    getVersion,
    createVersion,
    replaceComposition,
    transition,
    history,
    preview,
    listTemplates,
    getTemplate
};
