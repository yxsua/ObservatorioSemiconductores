const crypto = require("node:crypto");
const signalRepository = require("../repositories/signal.repository");
const trendRepository = require("../repositories/trend.repository");
const alertRepository = require("../repositories/alert.repository");
const publicContentRepository = require("../repositories/publicContent.repository");
const exportHistoryRepository = require("../repositories/exportHistory.repository");
const signalService = require("./signal.service");
const trendService = require("./trend.service");
const alertService = require("./alert.service");
const publicContentService = require("./publicContent.service");
const { parsePagination, buildPagination } = require("../utils/pagination");
const { ValidationError, DomainRuleError } = require("../errors/apiError");

const RESOURCES = new Set(["signals", "trends", "alerts", "content"]);
const FORMATS = new Set(["csv", "json"]);
const EXPORT_FORBIDDEN_FILTERS = new Set(["page", "pageSize", "status"]);

class ExportService {
    maxRows() {
        const configured = Number(process.env.EXPORT_MAX_ROWS ?? 5000);
        return Number.isSafeInteger(configured) && configured > 0
            ? Math.min(configured, 10000)
            : 5000;
    }

    validateRequest(rawResource, rawFormat, query = {}) {
        const resource = String(rawResource ?? "").trim().toLowerCase();
        const format = String(rawFormat ?? "").trim().toLowerCase();
        const errors = [];
        if (!RESOURCES.has(resource)) {
            errors.push({
                field: "resource",
                message: "Debe ser signals, trends, alerts o content."
            });
        }
        if (!FORMATS.has(format)) {
            errors.push({ field: "format", message: "Debe ser csv o json." });
        }
        Object.entries(query).forEach(([field, value]) => {
            if (EXPORT_FORBIDDEN_FILTERS.has(field)) {
                errors.push({ field, message: "El filtro no está permitido al exportar." });
            }
            if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
                errors.push({ field, message: "El filtro debe tener un solo valor." });
            }
        });
        if (errors.length) {
            throw new ValidationError("La solicitud de exportación no es válida.", errors);
        }
        return { resource, format };
    }

    async generate(rawResource, rawFormat, query, userId) {
        const { resource, format } = this.validateRequest(
            rawResource, rawFormat, query
        );
        const filters = this.normalizedQuery(query);
        const items = await this.extract(resource, query);
        const generatedAt = new Date().toISOString();
        const buffer = format === "csv"
            ? this.toCsv(resource, items)
            : Buffer.from(JSON.stringify({
                generatedAt,
                resource,
                rowCount: items.length,
                filters,
                data: items
            }), "utf8");
        const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
        const history = await exportHistoryRepository.create({
            userId,
            resource,
            format,
            filters,
            rowCount: items.length,
            sizeBytes: buffer.length,
            checksum
        });
        return {
            id: Number(history.id_export),
            resource,
            format,
            rowCount: items.length,
            sizeBytes: buffer.length,
            checksum,
            filename: this.filename(resource, format, generatedAt),
            contentType: format === "csv"
                ? "text/csv; charset=utf-8"
                : "application/json; charset=utf-8",
            buffer
        };
    }

    async extract(resource, query) {
        const limit = this.maxRows();
        const pagination = { limit: limit + 1, offset: 0 };
        let result;
        let items;
        if (resource === "signals") {
            const { filters } = signalService.parseFilters(query);
            result = await signalRepository.findAll(filters, pagination, true);
            items = result.rows.map((row) => signalService.mapSignal(row, true));
        } else if (resource === "trends") {
            const { filters } = trendService.parseFilters(query);
            result = await trendRepository.findAll(filters, pagination, true);
            items = result.rows.map((row) => trendService.mapTrend(row, true));
        } else if (resource === "alerts") {
            const { filters } = alertService.parseFilters(query);
            result = await alertRepository.findAll(filters, pagination, true);
            items = result.rows.map((row) => alertService.mapAlert(row, true));
        } else {
            const { filters } = publicContentService.parseFilters(query);
            result = await publicContentRepository.findAll(filters, pagination);
            items = result.rows.map((row) => publicContentService.mapSummary(row));
        }
        if (result.totalItems > limit || items.length > limit) {
            throw new DomainRuleError(
                `La exportación supera el límite de ${limit} registros.`,
                [{ field: "filters", message: "Aplique filtros más específicos." }]
            );
        }
        return items;
    }

    normalizedQuery(query) {
        return Object.fromEntries(
            Object.keys(query).sort().map((key) => [key, String(query[key])])
        );
    }

    filename(resource, format, generatedAt) {
        const stamp = generatedAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
        return `observatorio-${resource}-${stamp}.${format}`;
    }

    toCsv(resource, items) {
        const rows = items.map((item) => this.flatten(resource, item));
        const columns = this.csvColumns(resource);
        const lines = [
            columns.map((column) => this.csvCell(column)).join(","),
            ...rows.map((row) => columns.map((column) =>
                this.csvCell(row[column])).join(","))
        ];
        return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
    }

    csvCell(value) {
        let text = value === null || value === undefined ? "" : String(value);
        if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    }

    csvColumns(resource) {
        return {
            signals: [
                "id", "business_code", "title", "summary", "publication_date",
                "capture_date", "evidence_url", "ips", "priority", "category",
                "fcv", "source", "signal_type", "impact", "urgency",
                "reliability", "scope", "keywords"
            ],
            trends: [
                "id", "business_code", "title", "narrative", "implications",
                "first_signal_date", "last_signal_date", "direction", "maturity",
                "signal_count", "source_count", "actor_count", "fcv_count",
                "signals", "actors"
            ],
            alerts: [
                "id", "business_code", "title", "executive_summary", "implications",
                "recommendations", "generation_date", "response_deadline",
                "publication_date", "level", "origin", "signal_count",
                "trend_count", "audience_count", "signals", "trends", "audiences"
            ],
            content: [
                "id", "slug", "type", "title", "summary", "categories",
                "published_at"
            ]
        }[resource];
    }

    flatten(resource, item) {
        if (resource === "signals") {
            return {
                id: item.id, business_code: item.businessCode, title: item.title,
                summary: item.summary, publication_date: item.publicationDate,
                capture_date: item.captureDate, evidence_url: item.evidenceUrl,
                ips: item.ips, priority: item.priority, category: item.category.name,
                fcv: item.category.fcv.code, source: item.source.name,
                signal_type: item.signalType.code, impact: item.impact.code,
                urgency: item.urgency.code, reliability: item.reliability.code,
                scope: item.scope.code,
                keywords: item.keywords.map((value) => value.name ?? value).join(" | ")
            };
        }
        if (resource === "trends") {
            return {
                id: item.id, business_code: item.businessCode, title: item.title,
                narrative: item.narrative, implications: item.implications,
                first_signal_date: item.firstSignalDate,
                last_signal_date: item.lastSignalDate,
                direction: item.direction?.code, maturity: item.maturity?.code,
                signal_count: item.metrics.signalCount,
                source_count: item.metrics.sourceCount,
                actor_count: item.metrics.actorCount, fcv_count: item.metrics.fcvCount,
                signals: item.signals.map((value) => value.businessCode).join(" | "),
                actors: item.actors.map((value) => value.name).join(" | ")
            };
        }
        if (resource === "alerts") {
            return {
                id: item.id, business_code: item.businessCode, title: item.title,
                executive_summary: item.executiveSummary,
                implications: item.implications, recommendations: item.recommendations,
                generation_date: item.generationDate,
                response_deadline: item.responseDeadline,
                publication_date: item.publicationDate, level: item.level?.code,
                origin: item.origin.code, signal_count: item.metrics.signalCount,
                trend_count: item.metrics.trendCount,
                audience_count: item.metrics.audienceCount,
                signals: item.signals.map((value) => value.businessCode).join(" | "),
                trends: item.trends.map((value) => value.businessCode).join(" | "),
                audiences: item.audiences.map((value) => value.code).join(" | ")
            };
        }
        return {
            id: item.id, slug: item.slug, type: item.type.code, title: item.title,
            summary: item.summary,
            categories: item.categories.map((value) => value.name).join(" | "),
            published_at: item.publishedAt
        };
    }

    async history(userId, query = {}) {
        const unexpected = Object.keys(query).filter(
            (key) => !["page", "pageSize"].includes(key)
        );
        if (unexpected.length) {
            throw new ValidationError(
                "Los filtros del historial no son válidos.",
                unexpected.map((field) => ({
                    field, message: "El filtro no está permitido."
                }))
            );
        }
        const pagination = parsePagination(query);
        const result = await exportHistoryRepository.findByUser(userId, pagination);
        return {
            items: result.rows.map((row) => ({
                id: Number(row.id_export),
                resource: row.resource_code,
                format: row.format_code,
                filters: row.filters,
                rowCount: row.row_count,
                sizeBytes: Number(row.size_bytes),
                checksum: row.checksum,
                createdAt: row.created_at
            })),
            pagination: buildPagination(
                pagination.page, pagination.pageSize, result.totalItems
            )
        };
    }
}

module.exports = new ExportService();

