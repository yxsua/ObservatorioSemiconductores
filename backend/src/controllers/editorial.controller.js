const editorialService = require("../services/editorial.service");
const { successResponse } = require("../utils/apiResponse");

async function listBlockTypes(req, res) {
    const blockTypes = await editorialService.listBlockTypes();
    return res.json(successResponse(
        blockTypes,
        "Contratos de bloques editoriales obtenidos correctamente."
    ));
}

module.exports = { listBlockTypes };
