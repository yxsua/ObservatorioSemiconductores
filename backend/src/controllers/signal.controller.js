const signalService = require(
    "../services/signal.service"
);

const {
    successResponse,
    paginatedResponse
} = require("../utils/apiResponse");

async function listPublicSignals(req, res) {
    const result = await signalService.list(req.query, true);
    return res.status(200).json(
        paginatedResponse(
            result.items,
            result.pagination,
            "Señales públicas obtenidas correctamente."
        )
    );
}

async function getPublicSignal(req, res) {
    const signal = await signalService.getById(req.params.id, true);
    return res.status(200).json(
        successResponse(signal, "Señal obtenida correctamente.")
    );
}

async function listInternalSignals(req, res) {
    const result = await signalService.list(req.query, false);
    return res.status(200).json(
        paginatedResponse(
            result.items,
            result.pagination,
            "Señales internas obtenidas correctamente."
        )
    );
}

async function getInternalSignal(req, res) {
    const signal = await signalService.getById(req.params.id, false);
    return res.status(200).json(
        successResponse(signal, "Señal obtenida correctamente.")
    );
}

async function createSignal(req, res) {
    const signal = await signalService.create(req.body, req.user.id);
    return res.status(201).json(
        successResponse(signal, "Señal creada correctamente.")
    );
}

async function updateSignal(req, res) {
    const signal = await signalService.update(
        req.params.id,
        req.body,
        req.user
    );
    return res.status(200).json(
        successResponse(signal, "Señal actualizada correctamente.")
    );
}

async function transitionSignal(req, res) {
    const signal = await signalService.transition(
        req.params.id,
        req.body,
        req.user
    );
    return res.status(200).json(
        successResponse(signal, "Estado de la señal actualizado correctamente.")
    );
}

async function getSignalHistory(req, res) {
    const history = await signalService.getHistory(req.params.id);
    return res.status(200).json(
        successResponse(history, "Historial obtenido correctamente.")
    );
}

module.exports = {
    listPublicSignals,
    getPublicSignal,
    listInternalSignals,
    getInternalSignal,
    createSignal,
    updateSignal,
    transitionSignal,
    getSignalHistory
};
