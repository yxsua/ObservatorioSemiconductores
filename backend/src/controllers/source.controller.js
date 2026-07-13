const sourceService = require(
    "../services/source.service"
);

const {
    successResponse
} = require("../utils/apiResponse");

async function listSources(req, res) {
    const sources = await sourceService.list(req.query);
    return res.status(200).json(
        successResponse(
            sources,
            "Fuentes activas obtenidas correctamente."
        )
    );
}

module.exports = {
    listSources
};
