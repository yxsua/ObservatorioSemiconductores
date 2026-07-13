const {
    ValidationError
} = require("../errors/apiError");

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePositiveInteger(value, field, defaultValue) {
    if (value === undefined) {
        return defaultValue;
    }

    if (!/^\d+$/.test(String(value))) {
        throw new ValidationError(
            "Los parámetros de paginación no son válidos.",
            [{ field, message: "Debe ser un número entero positivo." }]
        );
    }

    const parsedValue = Number(value);

    if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
        throw new ValidationError(
            "Los parámetros de paginación no son válidos.",
            [{ field, message: "Debe ser un número entero positivo." }]
        );
    }

    return parsedValue;
}

function parsePagination(query = {}) {
    const page = parsePositiveInteger(
        query.page,
        "page",
        DEFAULT_PAGE
    );

    const pageSize = parsePositiveInteger(
        query.pageSize,
        "pageSize",
        DEFAULT_PAGE_SIZE
    );

    if (pageSize > MAX_PAGE_SIZE) {
        throw new ValidationError(
            "Los parámetros de paginación no son válidos.",
            [{
                field: "pageSize",
                message: `No puede ser mayor que ${MAX_PAGE_SIZE}.`
            }]
        );
    }

    return {
        page,
        pageSize,
        limit: pageSize,
        offset: (page - 1) * pageSize
    };
}

function buildPagination(page, pageSize, totalItems) {
    return {
        page,
        pageSize,
        totalItems,
        totalPages: totalItems === 0
            ? 0
            : Math.ceil(totalItems / pageSize)
    };
}

module.exports = {
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    parsePagination,
    buildPagination
};
