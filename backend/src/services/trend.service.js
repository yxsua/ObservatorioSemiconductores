const trendRepository = require(
    "../repositories/trend.repository"
);

const {
    createTrendSchema,
    updateTrendSchema,
    trendRelationsSchema,
    transitionTrendSchema
} = require("../schemas/trend.schema");

const {
    ValidationError,
    ForbiddenError,
    NotFoundError,
    InvalidTransitionError,
    ConcurrentModificationError,
    DomainRuleError
} = require("../errors/apiError");

const { formatZodErrors } = require("../utils/zod");
const {
    parsePagination,
    buildPagination
} = require("../utils/pagination");

const FILTER_KEYS = new Set([
    "page", "pageSize", "search", "status", "direction", "maturity", "categoryId", "from", "to", "sort"
]);
const SORT_FIELDS = new Set([
    "title", "firstSignalDate", "updatedAt", "signalCount"
]);
const TRANSITION_PERMISSIONS = Object.freeze({
    SUBMIT_FOR_REVIEW: "trends:submit",
    REQUEST_CHANGES: "trends:validate",
    VALIDATE: "trends:validate",
    REOPEN: "trends:validate",
    ACTIVATE: "trends:activate",
    ARCHIVE: "trends:archive"
});

function parseId(value, field = "id") {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ValidationError(
            "El identificador no es válido.",
            [{ field, message: "Debe ser un entero positivo." }]
        );
    }
    return id;
}

function parseDate(value, field) {
    const date = String(value);
    const parsed = new Date(`${date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) {
        throw new ValidationError("Los filtros de tendencias no son válidos.", [{ field, message: "Debe ser una fecha YYYY-MM-DD válida." }]);
    }
    return date;
}

class TrendService {
    parseFilters(query = {}) {
        const unexpected = Object.keys(query).filter(
            (key) => !FILTER_KEYS.has(key)
        );
        if (unexpected.length) {
            throw new ValidationError(
                "Los filtros de tendencias no son válidos.",
                unexpected.map((field) => ({
                    field,
                    message: "El filtro no está permitido."
                }))
            );
        }

        const pagination = parsePagination(query);
        const filters = {};
        if (query.search !== undefined) {
            const search = String(query.search).trim();
            if (search.length < 2 || search.length > 200) {
                throw new ValidationError(
                    "Los filtros de tendencias no son válidos.",
                    [{ field: "search", message: "Debe contener entre 2 y 200 caracteres." }]
                );
            }
            filters.search = search;
        }
        for (const key of ["status", "direction", "maturity"]) {
            if (query[key] !== undefined) {
                filters[key] = String(query[key]).trim().toUpperCase();
            }
        }
        if (query.categoryId !== undefined) filters.categoryId = parseId(query.categoryId, "categoryId");
        if (query.from !== undefined) filters.from = parseDate(query.from, "from");
        if (query.to !== undefined) filters.to = parseDate(query.to, "to");
        if (filters.from && filters.to && filters.from > filters.to) {
            throw new ValidationError("Los filtros de tendencias no son válidos.", [{ field: "to", message: "Debe ser igual o posterior a from." }]);
        }

        const rawSort = query.sort === undefined
            ? "-updatedAt"
            : String(query.sort);
        filters.sortDirection = rawSort.startsWith("-") ? "DESC" : "ASC";
        filters.sortField = rawSort.replace(/^-/, "");
        if (!SORT_FIELDS.has(filters.sortField)) {
            throw new ValidationError(
                "Los filtros de tendencias no son válidos.",
                [{ field: "sort", message: "El campo de orden no está permitido." }]
            );
        }
        return { filters, pagination };
    }

    async list(query, publicOnly) {
        const { filters, pagination } = this.parseFilters(query);
        const result = await trendRepository.findAll(
            filters,
            pagination,
            publicOnly
        );
        return {
            items: result.rows.map((row) => this.mapTrend(row, publicOnly)),
            pagination: buildPagination(
                pagination.page,
                pagination.pageSize,
                result.totalItems
            )
        };
    }

    async getById(rawId, publicOnly) {
        const id = parseId(rawId);
        const trend = await trendRepository.findById(id, publicOnly);
        if (!trend) {
            throw new NotFoundError("La tendencia no existe o no está disponible.");
        }
        return this.mapTrend(trend, publicOnly);
    }

    async create(input, analystId) {
        const validation = createTrendSchema.safeParse(input);
        if (!validation.success) {
            throw new ValidationError(
                "Los datos de la tendencia no son válidos.",
                formatZodErrors(validation.error)
            );
        }
        try {
            const id = await trendRepository.create(validation.data, analystId);
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseError(error);
        }
    }

    async update(rawId, input, user) {
        const id = parseId(rawId);
        const validation = updateTrendSchema.safeParse(input);
        if (!validation.success) {
            throw new ValidationError(
                "Los datos de la tendencia no son válidos.",
                formatZodErrors(validation.error)
            );
        }
        const existing = await this.getRaw(id);
        this.assertEditable(existing, user);

        try {
            const rowCount = await trendRepository.update(id, validation.data);
            if (rowCount !== 1) {
                throw new ConcurrentModificationError();
            }
            return this.getById(id, false);
        } catch (error) {
            if (error instanceof ConcurrentModificationError) throw error;
            this.handleDatabaseError(error);
        }
    }

    async linkSignals(rawId, input, user) {
        return this.updateRelations(rawId, input, user, "signals", true);
    }

    async unlinkSignal(rawId, rawSignalId, user) {
        const id = parseId(rawId);
        const signalId = parseId(rawSignalId, "signalId");
        const existing = await this.getRaw(id);
        this.assertEditable(existing, user);
        try {
            await trendRepository.unlinkSignal(id, signalId);
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseError(error);
        }
    }

    async linkActors(rawId, input, user) {
        return this.updateRelations(rawId, input, user, "actors", true);
    }

    async unlinkActor(rawId, rawActorId, user) {
        const id = parseId(rawId);
        const actorId = parseId(rawActorId, "actorId");
        const existing = await this.getRaw(id);
        this.assertEditable(existing, user);
        try {
            await trendRepository.unlinkActor(id, actorId);
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseError(error);
        }
    }

    async updateRelations(rawId, input, user, relation) {
        const id = parseId(rawId);
        const validation = trendRelationsSchema.safeParse(input);
        if (!validation.success) {
            throw new ValidationError(
                "Las relaciones no son válidas.",
                formatZodErrors(validation.error)
            );
        }
        const existing = await this.getRaw(id);
        this.assertEditable(existing, user);
        try {
            if (relation === "signals") {
                await trendRepository.linkSignals(id, validation.data.ids);
            } else {
                await trendRepository.linkActors(id, validation.data.ids);
            }
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseError(error);
        }
    }

    async transition(rawId, input, user) {
        const id = parseId(rawId);
        const validation = transitionTrendSchema.safeParse(input);
        if (!validation.success) {
            throw new ValidationError(
                "La transición solicitada no es válida.",
                formatZodErrors(validation.error)
            );
        }
        const permission = TRANSITION_PERMISSIONS[validation.data.transition];
        if (!(user.permissions ?? []).includes(permission)) {
            throw new ForbiddenError(
                "No tienes permiso para realizar esta transición."
            );
        }
        try {
            await trendRepository.transition(
                id,
                validation.data.transition,
                user.id,
                validation.data.notes
            );
            return this.getById(id, false);
        } catch (error) {
            if (error.code === "P0001" && /transición/i.test(error.message)) {
                throw new InvalidTransitionError(error.message);
            }
            this.handleDatabaseError(error);
        }
    }

    async getHistory(rawId) {
        const id = parseId(rawId);
        await this.getRaw(id);
        const rows = await trendRepository.findHistory(id);
        return rows.map((row) => ({
            id: Number(row.id_trend_status_history),
            fromStatus: row.from_status_code === null
                ? null
                : { code: row.from_status_code, name: row.from_status },
            toStatus: { code: row.to_status_code, name: row.to_status },
            transition: row.transition_code,
            changedBy: {
                id: Number(row.changed_by),
                name: row.changed_by_name
            },
            notes: row.notes,
            changedAt: row.changed_at
        }));
    }

    async listActors(query = {}) {
        const unexpected = Object.keys(query).filter((key) => key !== "search");
        if (unexpected.length) {
            throw new ValidationError("Los filtros de actores no son válidos.");
        }
        let search = null;
        if (query.search !== undefined) {
            search = String(query.search).trim();
            if (search.length < 2 || search.length > 200) {
                throw new ValidationError("El texto de búsqueda no es válido.");
            }
        }
        const rows = await trendRepository.findActors(search);
        return rows.map((row) => ({
            id: Number(row.id_actor),
            type: row.type_code === null
                ? null
                : { code: row.type_code, name: row.type },
            name: row.name,
            country: row.country,
            website: row.website
        }));
    }

    async getRaw(id) {
        const trend = await trendRepository.findById(id, false);
        if (!trend) throw new NotFoundError("La tendencia no existe.");
        return trend;
    }

    assertEditable(trend, user) {
        if (trend.status_code !== "NEW") {
            throw new DomainRuleError(
                "Solo pueden modificarse tendencias en estado NEW."
            );
        }
        const isOwner = Number(trend.analyst_id) === user.id;
        const canValidate = (user.permissions ?? []).includes("trends:validate");
        if (!isOwner && !canValidate) {
            throw new ForbiddenError(
                "No tienes permiso para modificar esta tendencia."
            );
        }
    }

    handleDatabaseError(error) {
        if (error.code === "P0001") {
            throw new DomainRuleError(error.message);
        }
        throw error;
    }

    maturitySuggestion(row) {
        const signals = Number(row.signal_count);
        const sources = Number(row.source_count);
        const actors = Number(row.actor_count);
        let code = null;
        if (signals >= 8 && (actors >= 3 || sources >= 4)) {
            code = "ESTABLISHED";
        } else if (signals >= 5 && (actors >= 2 || sources >= 3)) {
            code = "CONSOLIDATING";
        } else if (signals >= 3 && sources >= 2) {
            code = "EMERGING";
        }
        return {
            code,
            requirements: {
                minimumSignals: signals >= 3,
                sourceDiversity: sources >= 2,
                actorOrSourceDiversity: actors >= 2 || sources >= 2
            }
        };
    }

    mapTrend(row, publicOnly) {
        const signals = (publicOnly
            ? row.signals.filter((signal) => signal.statusCode === "VALIDATED")
            : row.signals).map((signal) => ({
                ...signal,
                id: Number(signal.id),
                sourceId: Number(signal.sourceId),
                ips: Number(signal.ips)
            }));
        const actors = row.actors.map((actor) => ({
            ...actor,
            id: Number(actor.id)
        }));
        const publicSources = new Set(signals.map((signal) => signal.sourceId));
        const publicFcv = new Set(signals.map((signal) => signal.fcvCode));
        const metricSource = publicOnly
            ? {
                signal_count: signals.length,
                source_count: publicSources.size,
                actor_count: actors.length,
                fcv_count: publicFcv.size
            }
            : row;
        const publicDates = signals
            .map((signal) => signal.publicationDate)
            .filter(Boolean)
            .sort();
        const trend = {
            id: Number(row.id_trend),
            businessCode: row.business_code,
            title: row.title,
            narrative: row.narrative,
            implications: row.implications,
            firstSignalDate: publicOnly
                ? publicDates[0] ?? null
                : row.first_signal_date,
            lastSignalDate: publicOnly
                ? publicDates.at(-1) ?? null
                : row.last_signal_date,
            direction: row.direction_code === null
                ? null
                : { code: row.direction_code, name: row.direction },
            maturity: row.maturity_code === null
                ? null
                : { code: row.maturity_code, name: row.maturity },
            suggestedMaturity: this.maturitySuggestion(metricSource),
            status: { code: row.status_code, name: row.status },
            metrics: {
                signalCount: Number(metricSource.signal_count),
                sourceCount: Number(metricSource.source_count),
                actorCount: Number(metricSource.actor_count),
                fcvCount: Number(metricSource.fcv_count)
            },
            signals,
            actors,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
        if (!publicOnly) {
            trend.methodologyNotes = row.methodology_notes;
            trend.analyst = row.analyst_id === null
                ? null
                : {
                    id: Number(row.analyst_id),
                    name: row.analyst
                };
            trend.validator = row.validator_id === null
                ? null
                : { id: Number(row.validator_id), name: row.validator };
            trend.validationDate = row.validation_date;
        }
        return trend;
    }
}

module.exports = new TrendService();
