const service = require("../services/publicView.service");
const { successResponse } = require("../utils/apiResponse");

async function get(req, res) {
    return res.json(successResponse(
        await service.get(req.params.resourceType, req.params.resourceId),
        "Contador público obtenido correctamente."
    ));
}

async function increment(req, res) {
    return res.json(successResponse(
        await service.increment(req.params.resourceType, req.params.resourceId),
        "Visita registrada correctamente."
    ));
}

module.exports = { get, increment };
