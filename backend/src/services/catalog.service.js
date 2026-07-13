const catalogRepository = require(
    "../repositories/catalog.repository"
);

const {
    NotFoundError
} = require("../errors/apiError");

function toCamelCase(value) {
    return value.replace(
        /_([a-z])/g,
        (_, character) => character.toUpperCase()
    );
}

function mapCatalogItem(row) {
    return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
            toCamelCase(key),
            value
        ])
    );
}

class CatalogService {
    listCatalogs() {
        return catalogRepository.getCatalogNames();
    }

    async getCatalog(catalogName) {
        const normalizedName = String(catalogName).trim().toLowerCase();

        if (!catalogRepository.hasCatalog(normalizedName)) {
            throw new NotFoundError(
                `El catálogo "${normalizedName}" no existe.`
            );
        }

        const rows = await catalogRepository.findAll(normalizedName);

        return {
            name: normalizedName,
            items: rows.map(mapCatalogItem)
        };
    }
}

module.exports = new CatalogService();
