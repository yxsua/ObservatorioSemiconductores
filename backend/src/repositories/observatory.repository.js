const pool = require("../config/database");

const DEFAULT_LIMIT = 60;

function hasValue(value) {
    return value !== undefined &&
        value !== null &&
        String(value).trim() !== "";
}

function normalizeLimit(limit = DEFAULT_LIMIT) {
    const parsedLimit = Number(limit);

    if (!Number.isSafeInteger(parsedLimit) || parsedLimit <= 0) {
        return DEFAULT_LIMIT;
    }

    return Math.min(parsedLimit, 100);
}

function addTextSearch(conditions, values, columns, search) {
    if (!hasValue(search)) {
        return;
    }

    values.push(`%${String(search).trim()}%`);
    const parameter = `$${values.length}`;

    conditions.push(
        `(${columns.map((column) => `${column} ILIKE ${parameter}`).join(" OR ")})`
    );
}

function addEqualsFilter(conditions, values, column, value) {
    if (!hasValue(value)) {
        return;
    }

    values.push(String(value).trim());
    conditions.push(`${column} = $${values.length}`);
}

function addNumericFilter(conditions, values, column, value) {
    if (!hasValue(value)) {
        return;
    }

    const parsedValue = Number(value);

    if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
        return;
    }

    values.push(parsedValue);
    conditions.push(`${column} = $${values.length}`);
}

function addBooleanFilter(conditions, values, column, value) {
    if (!hasValue(value)) {
        return;
    }

    if (value !== "true" && value !== "false") {
        return;
    }

    values.push(value === "true");
    conditions.push(`${column} = $${values.length}`);
}

function buildWhereClause(conditions) {
    return conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";
}

class ObservatoryRepository {
    async getCounts() {
        const query = `
            SELECT
                (SELECT COUNT(*) FROM vw_sources WHERE active = TRUE) AS sources,
                (SELECT COUNT(*) FROM vw_signals) AS signals,
                (SELECT COUNT(*) FROM vw_trends) AS trends,
                (SELECT COUNT(*) FROM vw_alerts) AS alerts,
                (SELECT COUNT(*) FROM vw_content) AS content;
        `;

        const { rows } = await pool.query(query);

        return rows[0];
    }

    async getCatalogOptions() {
        const catalogQueries = {
            sourceTypes: `
                SELECT code AS value, name AS label
                FROM vw_source_types
                ORDER BY name;
            `,
            fcv: `
                SELECT code AS value, name AS label
                FROM vw_fcv
                WHERE active = TRUE
                ORDER BY name;
            `,
            categories: `
                SELECT id_category::text AS value, fcv || ' - ' || name AS label
                FROM vw_categories
                WHERE active = TRUE
                ORDER BY fcv, name;
            `,
            sources: `
                SELECT id_source::text AS value, name AS label
                FROM vw_sources
                WHERE active = TRUE
                ORDER BY name;
            `,
            signalTypes: `
                SELECT code AS value, name AS label
                FROM vw_signal_types
                ORDER BY name;
            `,
            impacts: `
                SELECT code AS value, name AS label
                FROM vw_impacts
                ORDER BY weight DESC, name;
            `,
            urgencies: `
                SELECT code AS value, name AS label
                FROM vw_urgencies
                ORDER BY weight DESC, name;
            `,
            scopes: `
                SELECT code AS value, name AS label
                FROM vw_scopes
                ORDER BY name;
            `,
            signalStatuses: `
                SELECT code AS value, name AS label
                FROM vw_signal_statuses
                ORDER BY name;
            `,
            trendDirections: `
                SELECT code AS value, name AS label
                FROM vw_trend_directions
                ORDER BY name;
            `,
            trendMaturity: `
                SELECT code AS value, name AS label
                FROM vw_trend_maturity
                ORDER BY name;
            `,
            trendStatuses: `
                SELECT code AS value, name AS label
                FROM vw_trend_statuses
                ORDER BY name;
            `,
            alertLevels: `
                SELECT code AS value, name AS label
                FROM vw_alert_levels
                ORDER BY name;
            `,
            alertStatuses: `
                SELECT code AS value, name AS label
                FROM vw_alert_statuses
                ORDER BY name;
            `,
            alertOrigins: `
                SELECT code AS value, name AS label
                FROM vw_alert_origins
                ORDER BY name;
            `,
            contentTypes: `
                SELECT code AS value, name AS label
                FROM vw_content_types
                ORDER BY name;
            `,
            contentStatuses: `
                SELECT code AS value, name AS label
                FROM vw_content_statuses
                ORDER BY name;
            `
        };

        const entries = await Promise.all(
            Object.entries(catalogQueries).map(async ([key, query]) => {
                const { rows } = await pool.query(query);
                return [key, rows];
            })
        );

        return Object.fromEntries(entries);
    }

    async getSources(filters = {}) {
        const values = [];
        const conditions = [];

        addTextSearch(
            conditions,
            values,
            ["name", "website", "country", "source_type"],
            filters.q
        );
        addEqualsFilter(
            conditions,
            values,
            "source_type_code",
            filters.sourceType
        );
        addBooleanFilter(conditions, values, "active", filters.active);

        values.push(normalizeLimit(filters.limit));
        const limitParameter = `$${values.length}`;

        const query = `
            SELECT
                id_source,
                source_type_code,
                source_type,
                name,
                website,
                country,
                reliability,
                active,
                created_at,
                updated_at
            FROM vw_sources
            ${buildWhereClause(conditions)}
            ORDER BY created_at DESC, id_source DESC
            LIMIT ${limitParameter};
        `;

        const { rows } = await pool.query(query, values);

        return rows;
    }

    async getSignals(filters = {}) {
        const values = [];
        const conditions = [];

        addTextSearch(
            conditions,
            values,
            ["title", "business_code", "summary", "source", "category", "fcv"],
            filters.q
        );
        addEqualsFilter(conditions, values, "fcv_code", filters.fcv);
        addNumericFilter(conditions, values, "id_category", filters.category);
        addNumericFilter(conditions, values, "id_source", filters.source);
        addEqualsFilter(
            conditions,
            values,
            "signal_type_code",
            filters.signalType
        );
        addEqualsFilter(conditions, values, "impact_code", filters.impact);
        addEqualsFilter(conditions, values, "urgency_code", filters.urgency);
        addEqualsFilter(conditions, values, "scope_code", filters.scope);
        addEqualsFilter(conditions, values, "status_code", filters.status);

        values.push(normalizeLimit(filters.limit));
        const limitParameter = `$${values.length}`;

        const query = `
            SELECT
                id_signal,
                business_code,
                title,
                summary,
                publication_date,
                capture_date,
                evidence_url,
                ips,
                id_category,
                category,
                fcv_code,
                fcv,
                id_source,
                source,
                signal_type_code,
                signal_type,
                impact_code,
                impact,
                urgency_code,
                urgency,
                scope,
                status_code,
                status,
                analyst,
                created_at,
                updated_at
            FROM vw_signals
            ${buildWhereClause(conditions)}
            ORDER BY publication_date DESC, created_at DESC, id_signal DESC
            LIMIT ${limitParameter};
        `;

        const { rows } = await pool.query(query, values);

        return rows;
    }

    async getTrends(filters = {}) {
        const values = [];
        const conditions = [];

        addTextSearch(
            conditions,
            values,
            ["title", "business_code", "narrative", "implications"],
            filters.q
        );
        addEqualsFilter(conditions, values, "direction_code", filters.direction);
        addEqualsFilter(conditions, values, "maturity_code", filters.maturity);
        addEqualsFilter(conditions, values, "status_code", filters.status);

        values.push(normalizeLimit(filters.limit));
        const limitParameter = `$${values.length}`;

        const query = `
            SELECT
                id_trend,
                business_code,
                title,
                narrative,
                implications,
                first_signal_date,
                direction_code,
                direction,
                maturity_code,
                maturity,
                status_code,
                status,
                analyst,
                total_signals,
                total_actors,
                created_at,
                updated_at
            FROM vw_trends
            ${buildWhereClause(conditions)}
            ORDER BY COALESCE(first_signal_date, created_at::date) DESC,
                created_at DESC,
                id_trend DESC
            LIMIT ${limitParameter};
        `;

        const { rows } = await pool.query(query, values);

        return rows;
    }

    async getAlerts(filters = {}) {
        const values = [];
        const conditions = [];

        addTextSearch(
            conditions,
            values,
            [
                "title",
                "business_code",
                "executive_summary",
                "implications",
                "recommendations"
            ],
            filters.q
        );
        addEqualsFilter(conditions, values, "level_code", filters.level);
        addEqualsFilter(conditions, values, "status_code", filters.status);
        addEqualsFilter(conditions, values, "origin_code", filters.origin);

        values.push(normalizeLimit(filters.limit));
        const limitParameter = `$${values.length}`;

        const query = `
            SELECT
                id_alert,
                business_code,
                title,
                executive_summary,
                implications,
                recommendations,
                generation_date,
                response_deadline,
                level_code,
                level,
                status_code,
                status,
                origin_code,
                origin,
                creator,
                validation_date,
                total_signals,
                total_trends,
                total_audiences,
                created_at,
                updated_at
            FROM vw_alerts
            ${buildWhereClause(conditions)}
            ORDER BY generation_date DESC, created_at DESC, id_alert DESC
            LIMIT ${limitParameter};
        `;

        const { rows } = await pool.query(query, values);

        return rows;
    }

    async getContent(filters = {}) {
        const values = [];
        const conditions = [];

        addTextSearch(
            conditions,
            values,
            [
                "title",
                "slug",
                "summary",
                "content_type",
                "first_name",
                "last_name"
            ],
            filters.q
        );
        addEqualsFilter(
            conditions,
            values,
            "content_type_code",
            filters.contentType
        );
        addEqualsFilter(conditions, values, "status_code", filters.status);

        values.push(normalizeLimit(filters.limit));
        const limitParameter = `$${values.length}`;

        const query = `
            SELECT
                id_content,
                content_type_code,
                content_type,
                status_code,
                status,
                first_name || ' ' || last_name AS author,
                title,
                slug,
                summary,
                published_at,
                created_at,
                updated_at
            FROM vw_content
            ${buildWhereClause(conditions)}
            ORDER BY COALESCE(published_at, created_at) DESC, id_content DESC
            LIMIT ${limitParameter};
        `;

        const { rows } = await pool.query(query, values);

        return rows;
    }

    async getSignalsByMonth() {
        const query = `
            SELECT
                TO_CHAR(month_bucket, 'YYYY-MM') AS label,
                COUNT(*) AS value
            FROM (
                SELECT DATE_TRUNC('month', publication_date)::date AS month_bucket
                FROM vw_signals
                WHERE publication_date >= CURRENT_DATE - INTERVAL '12 months'
            ) signals_by_month
            GROUP BY month_bucket
            ORDER BY month_bucket ASC;
        `;

        const { rows } = await pool.query(query);

        return rows;
    }

    async getSignalsByFactor() {
        const query = `
            SELECT
                COALESCE(fcv, 'Sin factor') AS label,
                COUNT(*) AS value
            FROM vw_signals
            GROUP BY fcv
            ORDER BY COUNT(*) DESC, label ASC
            LIMIT 8;
        `;

        const { rows } = await pool.query(query);

        return rows;
    }

    async getContentByType() {
        const query = `
            SELECT
                COALESCE(content_type, 'Sin tipo') AS label,
                COUNT(*) AS value
            FROM vw_content
            GROUP BY content_type
            ORDER BY COUNT(*) DESC, label ASC
            LIMIT 8;
        `;

        const { rows } = await pool.query(query);

        return rows;
    }

    async getAlertsByLevel() {
        const query = `
            SELECT
                COALESCE(level, 'Sin nivel') AS label,
                COUNT(*) AS value
            FROM vw_alerts
            GROUP BY level
            ORDER BY COUNT(*) DESC, label ASC;
        `;

        const { rows } = await pool.query(query);

        return rows;
    }

    async getTimeline(limit) {
        const query = `
            SELECT
                kind,
                title,
                description,
                occurred_at,
                tag,
                tone
            FROM (
                SELECT
                    'signal' AS kind,
                    title,
                    summary AS description,
                    publication_date::timestamp AS occurred_at,
                    COALESCE(urgency, status, 'Senal') AS tag,
                    CASE
                        WHEN urgency_code = 'HIGH' OR impact_code = 'HIGH'
                            THEN 'danger'
                        WHEN urgency_code = 'MEDIUM' OR impact_code = 'MEDIUM'
                            THEN 'warning'
                        ELSE 'info'
                    END AS tone
                FROM vw_signals

                UNION ALL

                SELECT
                    'trend' AS kind,
                    title,
                    narrative AS description,
                    COALESCE(first_signal_date::timestamp, created_at) AS occurred_at,
                    COALESCE(maturity, status, 'Tendencia') AS tag,
                    CASE
                        WHEN direction_code = 'INCREASING'
                            THEN 'success'
                        WHEN direction_code = 'DISRUPTIVE'
                            THEN 'danger'
                        ELSE 'info'
                    END AS tone
                FROM vw_trends

                UNION ALL

                SELECT
                    'alert' AS kind,
                    title,
                    executive_summary AS description,
                    generation_date::timestamp AS occurred_at,
                    COALESCE(level, status, 'Alerta') AS tag,
                    CASE
                        WHEN level_code = 'RED' THEN 'danger'
                        WHEN level_code = 'ORANGE' THEN 'warning'
                        WHEN level_code = 'YELLOW' THEN 'notice'
                        ELSE 'warning'
                    END AS tone
                FROM vw_alerts

                UNION ALL

                SELECT
                    'content' AS kind,
                    title,
                    summary AS description,
                    COALESCE(published_at, created_at) AS occurred_at,
                    COALESCE(content_type, status, 'Contenido') AS tag,
                    'neutral' AS tone
                FROM vw_content
            ) timeline
            WHERE occurred_at IS NOT NULL
            ORDER BY occurred_at DESC
            LIMIT $1;
        `;

        const { rows } = await pool.query(query, [
            normalizeLimit(limit)
        ]);

        return rows;
    }
}

module.exports = new ObservatoryRepository();
