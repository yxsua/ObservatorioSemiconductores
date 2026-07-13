const alertService = require("../services/alert.service");
const { successResponse, paginatedResponse } = require("../utils/apiResponse");

async function listPublic(req, res) {
    const result = await alertService.list(req.query, true);
    return res.json(paginatedResponse(
        result.items, result.pagination, "Alertas públicas obtenidas correctamente."
    ));
}
async function getPublic(req, res) {
    return res.json(successResponse(
        await alertService.getById(req.params.id, true),
        "Alerta obtenida correctamente."
    ));
}
async function listInternal(req, res) {
    const result = await alertService.list(req.query, false);
    return res.json(paginatedResponse(
        result.items, result.pagination, "Alertas internas obtenidas correctamente."
    ));
}
async function getInternal(req, res) {
    return res.json(successResponse(
        await alertService.getById(req.params.id, false),
        "Alerta obtenida correctamente."
    ));
}
async function create(req, res) {
    return res.status(201).json(successResponse(
        await alertService.create(req.body, req.user.id),
        "Alerta creada correctamente."
    ));
}
async function update(req, res) {
    return res.json(successResponse(
        await alertService.update(req.params.id, req.body, req.user),
        "Alerta actualizada correctamente."
    ));
}
async function linkSignals(req, res) {
    return res.json(successResponse(
        await alertService.linkIds(req.params.id, req.body, req.user, "signal"),
        "Señales vinculadas correctamente."
    ));
}
async function unlinkSignal(req, res) {
    return res.json(successResponse(
        await alertService.unlink(
            req.params.id, req.params.signalId, req.user, "signal"
        ),
        "Señal desvinculada correctamente."
    ));
}
async function linkTrends(req, res) {
    return res.json(successResponse(
        await alertService.linkIds(req.params.id, req.body, req.user, "trend"),
        "Tendencias vinculadas correctamente."
    ));
}
async function unlinkTrend(req, res) {
    return res.json(successResponse(
        await alertService.unlink(
            req.params.id, req.params.trendId, req.user, "trend"
        ),
        "Tendencia desvinculada correctamente."
    ));
}
async function linkAudiences(req, res) {
    return res.json(successResponse(
        await alertService.linkAudiences(req.params.id, req.body, req.user),
        "Audiencias vinculadas correctamente."
    ));
}
async function unlinkAudience(req, res) {
    return res.json(successResponse(
        await alertService.unlink(
            req.params.id, req.params.audienceCode, req.user, "audience"
        ),
        "Audiencia desvinculada correctamente."
    ));
}
async function transition(req, res) {
    return res.json(successResponse(
        await alertService.transition(req.params.id, req.body, req.user),
        "Estado de la alerta actualizado correctamente."
    ));
}
async function history(req, res) {
    return res.json(successResponse(
        await alertService.getHistory(req.params.id),
        "Historial obtenido correctamente."
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
    linkTrends,
    unlinkTrend,
    linkAudiences,
    unlinkAudience,
    transition,
    history
};
