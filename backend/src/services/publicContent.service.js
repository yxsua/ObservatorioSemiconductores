const publicContentRepository = require("../repositories/publicContent.repository");
const blockResolverService = require("./blockResolver.service");
const { ValidationError, NotFoundError } = require("../errors/apiError");
const { parsePagination, buildPagination } = require("../utils/pagination");

const FILTER_KEYS = new Set([
    "page", "pageSize", "search", "type", "categoryId", "fcv", "categoryIds", "fcvCodes",
    "from", "to", "sort"
]);
const SORT_FIELDS = new Set(["publishedAt", "title"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidCalendarDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

class PublicContentService {
    parseFilters(query = {}) {
        const unexpected = Object.keys(query).filter((key) => !FILTER_KEYS.has(key));
        if (unexpected.length) {
            throw new ValidationError(
                "Los filtros de contenido no son válidos.",
                unexpected.map((field) => ({
                    field, message: "El filtro no está permitido."
                }))
            );
        }
        const pagination = parsePagination(query);
        const filters = {};
        if (query.search !== undefined) {
            const search = String(query.search).trim();
            if (search.length < 2 || search.length > 200) {
                throw new ValidationError(
                    "Los filtros de contenido no son válidos.",
                    [{ field: "search", message: "Debe contener entre 2 y 200 caracteres." }]
                );
            }
            filters.search = search;
        }
        for (const key of ["type", "fcv"]) {
            if (query[key] !== undefined) {
                const value = String(query[key]).trim().toUpperCase();
                if (!value || value.length > 50) {
                    throw new ValidationError(
                        "Los filtros de contenido no son válidos.",
                        [{ field: key, message: "Debe ser un código válido." }]
                    );
                }
                filters[key] = value;
            }
        }
        if (query.categoryId !== undefined) {
            const categoryId = Number(query.categoryId);
            if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
                throw new ValidationError(
                    "Los filtros de contenido no son válidos.",
                    [{ field: "categoryId", message: "Debe ser un entero positivo." }]
                );
            }
            filters.categoryId = categoryId;
        }
        for (const key of ["fcvCodes", "categoryIds"]) {
            if (query[key] === undefined) continue;
            const raw = query[key];
            if (typeof raw !== "string" || raw.length > 2000) throw new ValidationError("Selección múltiple inválida.", [{field:key,message:"Utiliza una lista separada por comas."}]);
            const entries = [...new Set(raw.split(",").map(value => value.trim().toUpperCase()))];
            if (!entries.length || entries.length > 100 || entries.some(value => key === "categoryIds" ? !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) : !/^[A-Z][A-Z0-9_]{0,19}$/.test(value))) throw new ValidationError("Selección múltiple inválida.", [{field:key,message:"Revisa las opciones seleccionadas."}]);
            filters[key] = key === "categoryIds" ? entries.map(Number) : entries;
        }

        for (const key of ["from", "to"]) {
            if (query[key] !== undefined) {
                const value = String(query[key]);
                if (!isValidCalendarDate(value)) {
                    throw new ValidationError(
                        "Los filtros de contenido no son válidos.",
                        [{ field: key, message: "Debe utilizar YYYY-MM-DD." }]
                    );
                }
                filters[key] = value;
            }
        }
        if (filters.from && filters.to && filters.from > filters.to) {
            throw new ValidationError(
                "Los filtros de contenido no son válidos.",
                [{ field: "from", message: "No puede ser posterior a to." }]
            );
        }
        const rawSort = query.sort === undefined ? "-publishedAt" : String(query.sort);
        filters.sortDirection = rawSort.startsWith("-") ? "DESC" : "ASC";
        filters.sortField = rawSort.replace(/^-/, "");
        if (!SORT_FIELDS.has(filters.sortField)) {
            throw new ValidationError(
                "Los filtros de contenido no son válidos.",
                [{ field: "sort", message: "El campo de orden no está permitido." }]
            );
        }
        return { filters, pagination };
    }

    async list(query = {}) {
        const { filters, pagination } = this.parseFilters(query);
        const result = await publicContentRepository.findAll(filters, pagination);
        return {
            items: result.rows.map((row) => this.mapSummary(row)),
            pagination: buildPagination(
                pagination.page, pagination.pageSize, result.totalItems
            )
        };
    }

    async getBySlug(rawSlug) {
        const slug = String(rawSlug ?? "").trim().toLowerCase();
        if (!SLUG_PATTERN.test(slug) || slug.length > 250) {
            throw new ValidationError(
                "El slug del contenido no es válido.",
                [{ field: "slug", message: "Debe utilizar el formato kebab-case." }]
            );
        }
        const row = await publicContentRepository.findBySlug(slug);
        if (!row) throw new NotFoundError("El contenido público no existe.");
        const resolvedSections = await blockResolverService.resolveSections(row.sections);
        const categories = row.relations.categories.map((item) => ({
            id: Number(item.id),
            name: item.name,
            fcv: { code: item.fcv_code, name: item.fcv_name }
        }));
        return {
            ...this.mapSummary(row),
            categories,
            versionNumber: row.version_number,
            sections: resolvedSections.map((section) => this.mapSection(section)),
            relations: {
                categories,
                signals: row.relations.signals.map((item) => this.mapRelation(item)),
                trends: row.relations.trends.map((item) => this.mapRelation(item)),
                alerts: row.relations.alerts.map((item) => this.mapRelation(item))
            }
        };
    }

    mapSummary(row) {
        return {
            id: Number(row.id_content),
            slug: row.slug,
            type: { code: row.type_code, name: row.type_name },
            title: row.title,
            summary: row.summary,
            featuredMedia: row.featured_media_id === null ? null : {
                id: Number(row.featured_media_id),
                filename: row.featured_media_filename,
                mimeType: row.featured_media_mime_type
            },
            categories: (row.categories ?? []).map((category) => ({
                id: Number(category.id),
                name: category.name,
                fcv: { code: category.fcvCode, name: category.fcvName }
            })),
            publishedAt: row.published_at
        };
    }

    mapSection(section) {
        const settings = { ...(section.settings ?? {}) };
        delete settings.templateSectionId;
        delete settings.required;
        delete settings.repeatable;
        return {
            id: Number(section.id_content_section),
            type: section.type_code === null ? null : {
                code: section.type_code, name: section.type_name
            },
            title: section.title,
            position: section.position,
            isCollapsible: section.is_collapsible,
            settings,
            blocks: section.blocks.map((block) => ({
                id: Number(block.id_content_block),
                type: { code: block.type_code, name: block.type_name },
                schemaVersion: block.schema_version,
                position: block.position,
                data: block.data,
                settings: block.settings,
                cssClass: block.css_class,
                ...(block.resolved === undefined ? {} : { resolved: block.resolved })
            }))
        };
    }

    mapRelation(item) {
        return {
            id: Number(item.id),
            businessCode: item.business_code,
            title: item.title
        };
    }
}

module.exports = new PublicContentService();
