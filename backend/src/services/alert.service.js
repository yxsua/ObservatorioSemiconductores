const alertRepository = require("../repositories/alert.repository");
const {
    createAlertSchema,
    updateAlertSchema,
    alertIdRelationsSchema,
    alertAudienceRelationsSchema,
    transitionAlertSchema
} = require("../schemas/alert.schema");
const {
    ValidationError,
    ForbiddenError,
    NotFoundError,
    InvalidTransitionError,
    ConcurrentModificationError,
    DomainRuleError
} = require("../errors/apiError");
const { formatZodErrors } = require("../utils/zod");
const { parsePagination, buildPagination } = require("../utils/pagination");

const FILTER_KEYS = new Set([
    "page", "pageSize", "search", "status", "level", "audience", "sort"
]);
const SORT_FIELDS = new Set([
    "generationDate", "responseDeadline", "level", "title", "updatedAt"
]);
const TRANSITION_PERMISSIONS = Object.freeze({
    SUBMIT_FOR_REVIEW: "alerts:submit",
    REQUEST_CHANGES: "alerts:validate",
    VALIDATE: "alerts:validate",
    REOPEN: "alerts:validate",
    PUBLISH: "alerts:publish",
    CLOSE: "alerts:close"
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

class AlertService {
    parseFilters(query = {}) {
        const unexpected = Object.keys(query).filter(
            (key) => !FILTER_KEYS.has(key)
        );
        if (unexpected.length) {
            throw new ValidationError(
                "Los filtros de alertas no son válidos.",
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
                    "Los filtros de alertas no son válidos.",
                    [{ field: "search", message: "Debe contener entre 2 y 200 caracteres." }]
                );
            }
            filters.search = search;
        }
        for (const key of ["status", "level", "audience"]) {
            if (query[key] !== undefined) {
                filters[key] = String(query[key]).trim().toUpperCase();
            }
        }
        const rawSort = query.sort === undefined
            ? "-updatedAt"
            : String(query.sort);
        filters.sortDirection = rawSort.startsWith("-") ? "DESC" : "ASC";
        filters.sortField = rawSort.replace(/^-/, "");
        if (!SORT_FIELDS.has(filters.sortField)) {
            throw new ValidationError(
                "Los filtros de alertas no son válidos.",
                [{ field: "sort", message: "El campo de orden no está permitido." }]
            );
        }
        return { filters, pagination };
    }

    async list(query, publicOnly) {
        const { filters, pagination } = this.parseFilters(query);
        const result = await alertRepository.findAll(
            filters,
            pagination,
            publicOnly
        );
        return {
            items: result.rows.map((row) => this.mapAlert(row, publicOnly)),
            pagination: buildPagination(
                pagination.page,
                pagination.pageSize,
                result.totalItems
            )
        };
    }

    async getById(rawId, publicOnly) {
        const id = parseId(rawId);
        const alert = await alertRepository.findById(id, publicOnly);
        if (!alert) {
            throw new NotFoundError("La alerta no existe o no está disponible.");
        }
        return this.mapAlert(alert, publicOnly);
    }

    async create(input, creatorId) {
        const validation = createAlertSchema.safeParse(input);
        if (!validation.success) {
            throw new ValidationError(
                "Los datos de la alerta no son válidos.",
                formatZodErrors(validation.error)
            );
        }
        try {
            const id = await alertRepository.create(validation.data, creatorId);
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseError(error);
        }
    }

    async update(rawId, input, user) {
        const id = parseId(rawId);
        const validation = updateAlertSchema.safeParse(input);
        if (!validation.success) {
            throw new ValidationError(
                "Los datos de la alerta no son válidos.",
                formatZodErrors(validation.error)
            );
        }
        const existing = await this.getRaw(id);
        this.assertEditable(existing, user);
        try {
            const rowCount = await alertRepository.update(id, validation.data);
            if (rowCount !== 1) throw new ConcurrentModificationError();
            return this.getById(id, false);
        } catch (error) {
            if (error instanceof ConcurrentModificationError) throw error;
            this.handleDatabaseError(error);
        }
    }

    async linkIds(rawId, input, user, relation) {
        const id = parseId(rawId);
        const validation = alertIdRelationsSchema.safeParse(input);
        if (!validation.success) {
            throw new ValidationError(
                "Las relaciones no son válidas.",
                formatZodErrors(validation.error)
            );
        }
        const existing = await this.getRaw(id);
        this.assertEditable(existing, user);
        try {
            await alertRepository.link(id, validation.data.ids, relation);
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseError(error);
        }
    }

    async linkAudiences(rawId, input, user) {
        const id = parseId(rawId);
        const validation = alertAudienceRelationsSchema.safeParse(input);
        if (!validation.success) {
            throw new ValidationError(
                "Las audiencias no son válidas.",
                formatZodErrors(validation.error)
            );
        }
        const existing = await this.getRaw(id);
        this.assertEditable(existing, user);
        try {
            await alertRepository.link(id, validation.data.codes, "audience");
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseError(error);
        }
    }

    async unlink(rawId, rawValue, user, relation) {
        const id = parseId(rawId);
        const value = relation === "audience"
            ? String(rawValue).trim().toUpperCase()
            : parseId(rawValue, `${relation}Id`);
        if (relation === "audience" && !value) {
            throw new ValidationError("El código de audiencia no es válido.");
        }
        const existing = await this.getRaw(id);
        this.assertEditable(existing, user);
        try {
            await alertRepository.unlink(id, value, relation);
            return this.getById(id, false);
        } catch (error) {
            this.handleDatabaseError(error);
        }
    }

    async transition(rawId, input, user) {
        const id = parseId(rawId);
        const validation = transitionAlertSchema.safeParse(input);
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
            await alertRepository.transition(
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
        const rows = await alertRepository.findHistory(id);
        return rows.map((row) => ({
            id: Number(row.id_alert_status_history),
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

    async getRaw(id) {
        const alert = await alertRepository.findById(id, false);
        if (!alert) throw new NotFoundError("La alerta no existe.");
        return alert;
    }

    assertEditable(alert, user) {
        if (alert.status_code !== "NEW") {
            throw new DomainRuleError(
                "Solo pueden modificarse alertas en estado NEW."
            );
        }
        const isOwner = Number(alert.creator_id) === user.id;
        const canValidate = (user.permissions ?? []).includes("alerts:validate");
        if (!isOwner && !canValidate) {
            throw new ForbiddenError("No tienes permiso para modificar esta alerta.");
        }
    }

    handleDatabaseError(error) {
        if (error.code === "P0001") throw new DomainRuleError(error.message);
        throw error;
    }

    mapAlert(row, publicOnly) {
        const signals = (publicOnly
            ? row.signals.filter((item) => item.statusCode === "VALIDATED")
            : row.signals).map((item) => ({
                ...item,
                id: Number(item.id),
                ips: Number(item.ips)
            }));
        const trends = (publicOnly
            ? row.trends.filter((item) => ["VALIDATED", "ACTIVE"].includes(item.statusCode))
            : row.trends).map((item) => ({
                ...item,
                id: Number(item.id)
            }));
        const metricSource = publicOnly
            ? {
                signalCount: signals.length,
                trendCount: trends.length,
                audienceCount: row.audiences.length
            }
            : {
                signalCount: Number(row.signal_count),
                trendCount: Number(row.trend_count),
                audienceCount: Number(row.audience_count)
            };
        const alert = {
            id: Number(row.id_alert),
            businessCode: row.business_code,
            title: row.title,
            executiveSummary: row.executive_summary,
            implications: row.implications,
            recommendations: row.recommendations,
            generationDate: row.generation_date,
            responseDeadline: row.response_deadline,
            publicationDate: row.publication_date,
            activationRule: row.activation_rule,
            level: row.level_code === null
                ? null
                : { code: row.level_code, name: row.level, color: row.level_color },
            status: { code: row.status_code, name: row.status },
            origin: { code: row.origin_code, name: row.origin },
            metrics: metricSource,
            signals,
            trends,
            audiences: row.audiences,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
        if (!publicOnly) {
            alert.notes = row.notes;
            alert.creator = row.creator_id === null
                ? null
                : { id: Number(row.creator_id), name: row.creator };
            alert.validator = row.validator_id === null
                ? null
                : { id: Number(row.validator_id), name: row.validator };
            alert.publisher = row.publisher_id === null
                ? null
                : { id: Number(row.publisher_id), name: row.publisher };
            alert.validationDate = row.validation_date;
        }
        return alert;
    }
}

module.exports = new AlertService();
