const sourceRepository = require(
    "../repositories/source.repository"
);

const {
    ValidationError
} = require("../errors/apiError");

class SourceService {
    async list(query = {}) {
        const unexpectedKeys = Object.keys(query).filter(
            (key) => key !== "search"
        );

        if (unexpectedKeys.length > 0) {
            throw new ValidationError(
                "Los filtros de fuentes no son válidos.",
                unexpectedKeys.map((field) => ({
                    field,
                    message: "El filtro no está permitido."
                }))
            );
        }

        let search = null;
        if (query.search !== undefined) {
            search = String(query.search).trim();
            if (search.length < 2 || search.length > 200) {
                throw new ValidationError(
                    "Los filtros de fuentes no son válidos.",
                    [{
                        field: "search",
                        message: "Debe contener entre 2 y 200 caracteres."
                    }]
                );
            }
        }

        const sources = await sourceRepository.findActive(search);
        return sources.map((source) => ({
            id: Number(source.id_source),
            type: {
                code: source.source_type_code,
                name: source.source_type
            },
            name: source.name,
            website: source.website,
            country: source.country,
            historicalReliability: source.reliability === null
                ? null
                : Number(source.reliability)
        }));
    }
}

module.exports = new SourceService();
