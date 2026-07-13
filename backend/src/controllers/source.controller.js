const sourceService = require(
    "../services/source.service"
);

const {
    successResponse
} = require("../utils/apiResponse");

async function listSources(req, res) {
    const sources = await sourceService.list(req.query, req.user);
    return res.status(200).json(
        successResponse(
            sources,
            "Fuentes activas obtenidas correctamente."
        )
    );
}

async function getSource(req, res) {
    return res.json(successResponse(await sourceService.getById(req.params.id), "Fuente obtenida correctamente."));
}
async function createSource(req, res) {
    return res.status(201).json(successResponse(await sourceService.create(req.body), "Fuente creada correctamente."));
}
async function updateSource(req, res) {
    return res.json(successResponse(await sourceService.update(req.params.id, req.body), "Fuente actualizada correctamente."));
}
async function deactivateSource(req, res) {
    return res.json(successResponse(await sourceService.deactivate(req.params.id, req.body), "Fuente desactivada correctamente."));
}

module.exports = {
    listSources, getSource, createSource, updateSource, deactivateSource
};
