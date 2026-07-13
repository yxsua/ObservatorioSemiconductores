const observatoryService = require(
    "../services/observatory.service"
);

const {
    successResponse
} = require("../utils/apiResponse");

async function getSummary(req, res) {
    const summary = await observatoryService.getSummary();

    return res.status(200).json(
        successResponse(summary, "Resumen del observatorio obtenido.")
    );
}

async function getCatalogs(req, res) {
    const catalogs = await observatoryService.getCatalogs();

    return res.status(200).json(
        successResponse(catalogs, "Catalogos obtenidos.")
    );
}

async function getSources(req, res) {
    const sources = await observatoryService.getSources(req.query);

    return res.status(200).json(
        successResponse(sources, "Fuentes obtenidas.")
    );
}

async function getSignals(req, res) {
    const signals = await observatoryService.getSignals(req.query);

    return res.status(200).json(
        successResponse(signals, "Senales obtenidas.")
    );
}

async function getTrends(req, res) {
    const trends = await observatoryService.getTrends(req.query);

    return res.status(200).json(
        successResponse(trends, "Tendencias obtenidas.")
    );
}

async function getAlerts(req, res) {
    const alerts = await observatoryService.getAlerts(req.query);

    return res.status(200).json(
        successResponse(alerts, "Alertas obtenidas.")
    );
}

async function getContent(req, res) {
    const content = await observatoryService.getContent(req.query);

    return res.status(200).json(
        successResponse(content, "Contenido obtenido.")
    );
}

module.exports = {
    getCatalogs,
    getSummary,
    getSources,
    getSignals,
    getTrends,
    getAlerts,
    getContent
};
