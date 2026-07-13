const trendService = require("../services/trend.service");
const {
    successResponse,
    paginatedResponse
} = require("../utils/apiResponse");

async function listPublic(req, res) {
    const result = await trendService.list(req.query, true);
    return res.json(paginatedResponse(
        result.items, result.pagination, "Tendencias públicas obtenidas correctamente."
    ));
}
async function getPublic(req, res) {
    return res.json(successResponse(
        await trendService.getById(req.params.id, true),
        "Tendencia obtenida correctamente."
    ));
}
async function listInternal(req, res) {
    const result = await trendService.list(req.query, false);
    return res.json(paginatedResponse(
        result.items, result.pagination, "Tendencias internas obtenidas correctamente."
    ));
}
async function getInternal(req, res) {
    return res.json(successResponse(
        await trendService.getById(req.params.id, false),
        "Tendencia obtenida correctamente."
    ));
}
async function create(req, res) {
    const trend = await trendService.create(req.body, req.user.id);
    return res.status(201).json(successResponse(trend, "Tendencia creada correctamente."));
}
async function update(req, res) {
    return res.json(successResponse(
        await trendService.update(req.params.id, req.body, req.user),
        "Tendencia actualizada correctamente."
    ));
}
async function linkSignals(req, res) {
    return res.json(successResponse(
        await trendService.linkSignals(req.params.id, req.body, req.user),
        "Señales vinculadas correctamente."
    ));
}
async function unlinkSignal(req, res) {
    return res.json(successResponse(
        await trendService.unlinkSignal(
            req.params.id, req.params.signalId, req.user
        ),
        "Señal desvinculada correctamente."
    ));
}
async function linkActors(req, res) {
    return res.json(successResponse(
        await trendService.linkActors(req.params.id, req.body, req.user),
        "Actores vinculados correctamente."
    ));
}
async function unlinkActor(req, res) {
    return res.json(successResponse(
        await trendService.unlinkActor(
            req.params.id, req.params.actorId, req.user
        ),
        "Actor desvinculado correctamente."
    ));
}
async function transition(req, res) {
    return res.json(successResponse(
        await trendService.transition(req.params.id, req.body, req.user),
        "Estado de la tendencia actualizado correctamente."
    ));
}
async function history(req, res) {
    return res.json(successResponse(
        await trendService.getHistory(req.params.id),
        "Historial obtenido correctamente."
    ));
}
async function listActors(req, res) {
    return res.json(successResponse(
        await trendService.listActors(req.query),
        "Actores obtenidos correctamente."
    ));
}

module.exports = {
    listPublic,
    getPublic,
    listInternal,
    getInternal,
    create,
    update,
    linkSignals,
    unlinkSignal,
    linkActors,
    unlinkActor,
    transition,
    history,
    listActors
};
