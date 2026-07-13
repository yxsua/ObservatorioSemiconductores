const catalogService = require(
    "../services/catalog.service"
);

const {
    successResponse
} = require("../utils/apiResponse");

function listCatalogs(req, res) {
    return res.status(200).json(
        successResponse(
            catalogService.listCatalogs(),
            "Catálogos disponibles obtenidos correctamente."
        )
    );
}

async function getCatalog(req, res) {
    const catalog = await catalogService.getCatalog(
        req.params.catalog
    );

    return res.status(200).json(
        successResponse(
            catalog,
            "Catálogo obtenido correctamente."
        )
    );
}

module.exports = {
    listCatalogs,
    getCatalog
};
