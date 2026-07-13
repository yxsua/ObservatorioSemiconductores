const sourceRepository = require("../repositories/source.repository");
const { createSourceSchema, updateSourceSchema, deactivateSourceSchema } = require("../schemas/source.schema");
const { ValidationError, ForbiddenError, NotFoundError,
    ConcurrentModificationError, DomainRuleError } = require("../errors/apiError");
const { formatZodErrors } = require("../utils/zod");

function parseId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ValidationError("El identificador de la fuente no es válido.");
    }
    return id;
}

class SourceService {
    parseFilters(query, user) {
        const unexpected = Object.keys(query).filter((key) => !["search", "active"].includes(key));
        if (unexpected.length) throw new ValidationError("Los filtros de fuentes no son válidos.");
        let search = null;
        if (query.search !== undefined) {
            search = String(query.search).trim();
            if (search.length < 2 || search.length > 200) {
                throw new ValidationError("Los filtros de fuentes no son válidos.",
                    [{ field: "search", message: "Debe contener entre 2 y 200 caracteres." }]);
            }
        }
        const rawActive = query.active ?? "true";
        if (!["true", "false", "all"].includes(rawActive)) {
            throw new ValidationError("El filtro active debe ser true, false o all.");
        }
        if (rawActive !== "true" && !(user.permissions ?? []).includes("sources:read-internal")) {
            throw new ForbiddenError("No tienes permiso para consultar fuentes inactivas.");
        }
        return { search, active: rawActive === "all" ? null : rawActive === "true" };
    }

    async list(query = {}, user = {}) {
        const filters = this.parseFilters(query, user);
        const rows = await sourceRepository.findAll(filters.search, filters.active);
        return rows.map((row) => this.mapSource(row));
    }

    async getById(rawId) {
        const row = await sourceRepository.findById(parseId(rawId));
        if (!row) throw new NotFoundError("La fuente no existe.");
        return this.mapSource(row);
    }

    async create(input) {
        const data = this.validate(createSourceSchema, input);
        try {
            const id = await sourceRepository.create(data);
            return this.getById(id);
        } catch (error) { this.handleDatabaseError(error); }
    }

    async update(rawId, input) {
        const id = parseId(rawId);
        await this.getById(id);
        const data = this.validate(updateSourceSchema, input);
        try {
            if (await sourceRepository.update(id, data) !== 1) throw new ConcurrentModificationError();
            return this.getById(id);
        } catch (error) {
            if (error instanceof ConcurrentModificationError) throw error;
            this.handleDatabaseError(error);
        }
    }

    async deactivate(rawId, input) {
        const id = parseId(rawId);
        const existing = await this.getById(id);
        if (!existing.active) throw new DomainRuleError("La fuente ya está inactiva.");
        const data = this.validate(deactivateSourceSchema, input);
        if (await sourceRepository.deactivate(id, data.updatedAt) !== 1) {
            throw new ConcurrentModificationError();
        }
        return this.getById(id);
    }

    validate(schema, input) {
        const result = schema.safeParse(input);
        if (!result.success) throw new ValidationError(
            "Los datos de la fuente no son válidos.", formatZodErrors(result.error)
        );
        return result.data;
    }

    handleDatabaseError(error) {
        if (error.code === "P0001" || error.code === "23503") {
            throw new DomainRuleError(error.message);
        }
        throw error;
    }

    mapSource(row) {
        return {
            id: Number(row.id_source),
            type: { code: row.source_type_code, name: row.source_type },
            name: row.name, website: row.website, country: row.country,
            rssUrl: row.rss_url, apiUrl: row.api_url,
            historicalReliability: row.reliability === null ? null : Number(row.reliability),
            active: row.active, createdAt: row.created_at, updatedAt: row.updated_at
        };
    }
}

module.exports = new SourceService();
