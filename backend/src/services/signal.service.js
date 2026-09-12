const signalRepository = require(
    "../repositories/signal.repository"
);

const {
    createSignalSchema,
    updateSignalSchema,
    transitionSignalSchema
} = require("../schemas/signal.schema");

const {
    ValidationError,
    ForbiddenError,
    NotFoundError,
    InvalidTransitionError,
    ConcurrentModificationError,
    DomainRuleError
} = require("../errors/apiError");

const {
    formatZodErrors
} = require("../utils/zod");

const {
    parsePagination,
    buildPagination
} = require("../utils/pagination");

const SORT_FIELDS = new Set([
    "publicationDate",
    "captureDate",
    "ips",
    "title",
    "updatedAt"
]);

const FILTER_KEYS = new Set([
    "page",
    "pageSize",
    "search",
    "status",
    "categoryId",
    "fcv",
    "impact",
    "urgency",
    "reliability",
    "scope",
    "from",
    "to",
    "sort"
]);

const TRANSITION_PERMISSIONS = Object.freeze({
    SUBMIT_FOR_REVIEW: "signals:submit",
    REQUEST_CHANGES: "signals:validate",
    VALIDATE: "signals:validate",
    REOPEN: "signals:validate",
    ARCHIVE: "signals:archive"
});

function parseId(value) {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ValidationError(
            "El identificador de la señal no es válido.",
            [{ field: "id", message: "Debe ser un entero positivo." }]
        );
    }

    return id;
}

function normalizeCode(value) {
    return value === undefined
        ? undefined
        : String(value).trim().toUpperCase();
}

function normalizeKeywords(keywords = []) {
    const uniqueKeywords = new Map();

    for (const keyword of keywords) {
        const normalized = keyword
            .trim()
            .toLocaleLowerCase("es-MX");

        uniqueKeywords.set(normalized, normalized);
    }

    return [...uniqueKeywords.values()];
}

function isValidCalendarDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

class SignalService {
    parseFilters(query = {}) {
        const unexpectedKeys = Object.keys(query).filter(
            (key) => !FILTER_KEYS.has(key)
        );

        if (unexpectedKeys.length > 0) {
            throw new ValidationError(
                "Los filtros de señales no son válidos.",
                unexpectedKeys.map((field) => ({
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
                    "Los filtros de señales no son válidos.",
                    [{
                        field: "search",
                        message: "Debe contener entre 2 y 200 caracteres."
                    }]
                );
            }
            filters.search = search;
        }

        for (const key of [
            "status",
            "fcv",
            "impact",
            "urgency",
            "reliability",
            "scope"
        ]) {
            if (query[key] !== undefined) {
                filters[key] = normalizeCode(query[key]);
            }
        }

        if (query.categoryId !== undefined) {
            const categoryId = Number(query.categoryId);
            if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
                throw new ValidationError(
                    "Los filtros de señales no son válidos.",
                    [{
                        field: "categoryId",
                        message: "Debe ser un entero positivo."
                    }]
                );
            }
            filters.categoryId = categoryId;
        }

        for (const key of ["from", "to"]) {
            if (query[key] !== undefined) {
                const value = String(query[key]);
                if (!isValidCalendarDate(value)) {
                    throw new ValidationError(
                        "Los filtros de señales no son válidos.",
                        [{ field: key, message: "Debe utilizar YYYY-MM-DD." }]
                    );
                }
                filters[key] = value;
            }
        }

        const rawSort = query.sort === undefined
            ? "-publicationDate"
            : String(query.sort);
        filters.sortDirection = rawSort.startsWith("-") ? "DESC" : "ASC";
        filters.sortField = rawSort.replace(/^-/, "");

        if (!SORT_FIELDS.has(filters.sortField)) {
            throw new ValidationError(
                "Los filtros de señales no son válidos.",
                [{ field: "sort", message: "El campo de orden no está permitido." }]
            );
        }

        return { filters, pagination };
    }

    async list(query, publicOnly) {
        const { filters, pagination } = this.parseFilters(query);
        const result = await signalRepository.findAll(
            filters,
            pagination,
            publicOnly
        );

        return {
            items: result.rows.map((row) => this.mapSignal(row, publicOnly)),
            pagination: buildPagination(
                pagination.page,
                pagination.pageSize,
                result.totalItems
            )
        };
    }

    async getById(rawId, publicOnly) {
        const id = parseId(rawId);
        const signal = await signalRepository.findById(id, publicOnly);

        if (!signal) {
            throw new NotFoundError("La señal no existe o no está disponible.");
        }

        return this.mapSignal(signal, publicOnly);
    }

    async create(input, analystId) {
        const validation = createSignalSchema.safeParse(input);

        if (!validation.success) {
            throw new ValidationError(
                "Los datos de la señal no son válidos.",
                formatZodErrors(validation.error)
            );
        }

        const data = {
            ...validation.data,
            keywords: normalizeKeywords(validation.data.keywords)
        };

        try {
            const id = await signalRepository.create(data, analystId);
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseDomainError(error);
        }
    }

    async update(rawId, input, user) {
        const id = parseId(rawId);
        const validation = updateSignalSchema.safeParse(input);

        if (!validation.success) {
            throw new ValidationError(
                "Los datos de la señal no son válidos.",
                formatZodErrors(validation.error)
            );
        }

        const existing = await signalRepository.findById(id, false);
        if (!existing) {
            throw new NotFoundError("La señal no existe.");
        }

        if (existing.status_code !== "NEW") {
            throw new DomainRuleError(
                "Solo pueden modificarse señales en estado NEW."
            );
        }

        const permissions = new Set(user.permissions ?? []);
        const canUpdateAny = permissions.has("signals:update-any");
        const canUpdateOwn = permissions.has("signals:update-own")
            && Number(existing.analyst_id) === user.id;

        if (!canUpdateAny && !canUpdateOwn) {
            throw new ForbiddenError(
                "No tienes permiso para modificar esta señal."
            );
        }

        const data = { ...validation.data };
        if (data.keywords !== undefined) {
            data.keywords = normalizeKeywords(data.keywords);
        }

        try {
            await signalRepository.update(id, data);
            return this.getById(id, false);
        } catch (error) {
            if (error.applicationCode === "CONCURRENT_MODIFICATION") {
                throw new ConcurrentModificationError();
            }
            this.handleDatabaseDomainError(error);
        }
    }

    async transition(rawId, input, user) {
        const id = parseId(rawId);
        const validation = transitionSignalSchema.safeParse(input);

        if (!validation.success) {
            throw new ValidationError(
                "La transición solicitada no es válida.",
                formatZodErrors(validation.error)
            );
        }

        const requiredPermission = TRANSITION_PERMISSIONS[
            validation.data.transition
        ];

        if (!(user.permissions ?? []).includes(requiredPermission)) {
            throw new ForbiddenError(
                "No tienes permiso para realizar esta transición."
            );
        }

        try {
            await signalRepository.transition(
                id,
                validation.data.transition,
                user.id,
                validation.data.notes
            );
            return this.getById(id, false);
        } catch (error) {
            if (
                error.code === "P0001" &&
                /transición|cambio de estado/i.test(error.message)
            ) {
                throw new InvalidTransitionError(error.message);
            }
            this.handleDatabaseDomainError(error);
        }
    }

    async getHistory(rawId) {
        const id = parseId(rawId);
        const signal = await signalRepository.findById(id, false);

        if (!signal) {
            throw new NotFoundError("La señal no existe.");
        }

        const history = await signalRepository.findHistory(id);
        return history.map((row) => ({
            id: Number(row.id_signal_status_history),
            fromStatus: row.from_status_code === null
                ? null
                : { code: row.from_status_code, name: row.from_status },
            toStatus: {
                code: row.to_status_code,
                name: row.to_status
            },
            transition: row.transition_code,
            changedBy: {
                id: Number(row.changed_by),
                name: row.changed_by_name
            },
            notes: row.notes,
            changedAt: row.changed_at
        }));
    }

    handleDatabaseDomainError(error) {
        if (error.code === "P0001") {
            throw new DomainRuleError(error.message);
        }
        throw error;
    }

    mapSignal(row, publicOnly) {
        const signal = {
            id: Number(row.id_signal),
            businessCode: row.business_code,
            title: row.title,
            summary: row.summary,
            publicationDate: row.publication_date,
            captureDate: row.capture_date,
            evidenceUrl: row.evidence_url,
            ips: Number(row.ips),
            priority: row.priority_code,
            category: {
                id: Number(row.id_category),
                name: row.category,
                fcv: { code: row.fcv_code, name: row.fcv }
            },
            source: { id: Number(row.id_source), name: row.source },
            signalType: {
                code: row.signal_type_code,
                name: row.signal_type
            },
            impact: { code: row.impact_code, name: row.impact },
            urgency: { code: row.urgency_code, name: row.urgency },
            reliability: {
                code: row.reliability_code,
                name: row.reliability
            },
            scope: { code: row.scope_code, name: row.scope },
            status: { code: row.status_code, name: row.status },
            keywords: row.keywords,
            relations: {
                linkedToTrend: row.linked_to_trend,
                linkedToAlert: row.linked_to_alert
            },
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        if (!publicOnly) {
            signal.assessment = row.assessment ?? null;
            signal.analyst = {
                id: Number(row.analyst_id),
                name: row.analyst
            };
            signal.validator = row.validator_id === null
                ? null
                : { id: Number(row.validator_id), name: row.validator };
            signal.validationDate = row.validation_date;
            signal.notes = row.notes;
        }

        return signal;
    }
}

module.exports = new SignalService();
