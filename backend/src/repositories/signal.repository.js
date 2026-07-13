const pool = require("../config/database");

const SORT_COLUMNS = Object.freeze({
    publicationDate: "s.publication_date",
    captureDate: "s.capture_date",
    ips: "s.ips",
    title: "s.title",
    updatedAt: "s.updated_at"
});

const SELECT_FIELDS = `
    s.id_signal,
    s.business_code,
    s.title,
    s.summary,
    s.publication_date,
    s.capture_date,
    s.evidence_url,
    s.ips,
    CASE
        WHEN s.ips <= 7 THEN 'LOW'
        WHEN s.ips <= 17 THEN 'MEDIUM'
        ELSE 'HIGH'
    END AS priority_code,
    c.id_category,
    c.name AS category,
    f.code AS fcv_code,
    f.name AS fcv,
    src.id_source,
    src.name AS source,
    st.code AS signal_type_code,
    st.name AS signal_type,
    i.code AS impact_code,
    i.name AS impact,
    u.code AS urgency_code,
    u.name AS urgency,
    rl.code AS reliability_code,
    rl.name AS reliability,
    sc.code AS scope_code,
    sc.name AS scope,
    ss.code AS status_code,
    ss.name AS status,
    analyst.id_user AS analyst_id,
    analyst.first_name || ' ' || analyst.last_name AS analyst,
    validator.id_user AS validator_id,
    validator.first_name || ' ' || validator.last_name AS validator,
    s.validation_date,
    s.notes,
    s.created_at,
    s.updated_at,
    EXISTS (
        SELECT 1 FROM signal_trends rel WHERE rel.id_signal = s.id_signal
    ) AS linked_to_trend,
    EXISTS (
        SELECT 1 FROM alert_signals rel WHERE rel.id_signal = s.id_signal
    ) AS linked_to_alert,
    COALESCE((
        SELECT json_agg(
            json_build_object('id', k.id_keyword, 'name', k.name)
            ORDER BY k.name
        )
        FROM signal_keywords sk
        INNER JOIN keywords k ON k.id_keyword = sk.id_keyword
        WHERE sk.id_signal = s.id_signal
    ), '[]'::json) AS keywords
`;

const FROM_CLAUSE = `
    FROM signals s
    INNER JOIN categories c ON c.id_category = s.id_category
    INNER JOIN fcv f ON f.id_fcv = c.id_fcv
    INNER JOIN sources src ON src.id_source = s.id_source
    INNER JOIN signal_types st ON st.id_signal_type = s.id_signal_type
    INNER JOIN impacts i ON i.id_impact = s.id_impact
    INNER JOIN urgencies u ON u.id_urgency = s.id_urgency
    INNER JOIN reliability_levels rl
        ON rl.id_reliability = s.id_reliability
    INNER JOIN scopes sc ON sc.id_scope = s.id_scope
    INNER JOIN signal_statuses ss
        ON ss.id_signal_status = s.id_signal_status
    INNER JOIN users analyst ON analyst.id_user = s.id_analyst
    LEFT JOIN users validator ON validator.id_user = s.id_validator
`;

function addFilter(filters, values, conditions, key, column) {
    if (filters[key] !== undefined) {
        values.push(filters[key]);
        conditions.push(`${column} = $${values.length}`);
    }
}

class SignalRepository {
    buildFilters(filters, publicOnly) {
        const values = [];
        const conditions = [];

        if (publicOnly) {
            conditions.push("ss.code = 'VALIDATED'");
        } else {
            addFilter(filters, values, conditions, "status", "ss.code");
        }

        addFilter(filters, values, conditions, "categoryId", "s.id_category");
        addFilter(filters, values, conditions, "fcv", "f.code");
        addFilter(filters, values, conditions, "impact", "i.code");
        addFilter(filters, values, conditions, "urgency", "u.code");
        addFilter(filters, values, conditions, "reliability", "rl.code");
        addFilter(filters, values, conditions, "scope", "sc.code");

        if (filters.from !== undefined) {
            values.push(filters.from);
            conditions.push(`s.publication_date >= $${values.length}`);
        }

        if (filters.to !== undefined) {
            values.push(filters.to);
            conditions.push(`s.publication_date <= $${values.length}`);
        }

        if (filters.search !== undefined) {
            values.push(filters.search);
            const parameter = `$${values.length}`;
            conditions.push(`(
                s.business_code ILIKE '%' || ${parameter} || '%'
                OR to_tsvector(
                    'spanish',
                    coalesce(s.title, '') || ' ' || coalesce(s.summary, '')
                ) @@ plainto_tsquery('spanish', ${parameter})
            )`);
        }

        return {
            values,
            where: conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : ""
        };
    }

    async findAll(filters, pagination, publicOnly) {
        const { values, where } = this.buildFilters(filters, publicOnly);
        const sortColumn = SORT_COLUMNS[filters.sortField]
            ?? SORT_COLUMNS.publicationDate;
        const sortDirection = filters.sortDirection === "ASC"
            ? "ASC"
            : "DESC";

        values.push(pagination.limit);
        const limitParameter = `$${values.length}`;
        values.push(pagination.offset);
        const offsetParameter = `$${values.length}`;

        const query = `
            SELECT
                ${SELECT_FIELDS},
                COUNT(*) OVER()::BIGINT AS total_count
            ${FROM_CLAUSE}
            ${where}
            ORDER BY ${sortColumn} ${sortDirection}, s.id_signal DESC
            LIMIT ${limitParameter}
            OFFSET ${offsetParameter};
        `;

        const { rows } = await pool.query(query, values);

        return {
            rows,
            totalItems: rows.length > 0
                ? Number(rows[0].total_count)
                : 0
        };
    }

    async findById(id, publicOnly = false) {
        const visibility = publicOnly
            ? "AND ss.code = 'VALIDATED'"
            : "";

        const query = `
            SELECT ${SELECT_FIELDS}
            ${FROM_CLAUSE}
            WHERE s.id_signal = $1
            ${visibility}
            LIMIT 1;
        `;

        const { rows } = await pool.query(query, [id]);
        return rows[0] ?? null;
    }

    async create(input, analystId) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const { rows } = await client.query(
                `
                    SELECT sp_create_signal_v2(
                        $1, $2, $3, $4, $5, $6,
                        $7, $8, $9, $10, $11, $12, $13
                    ) AS id_signal;
                `,
                [
                    input.title,
                    input.summary,
                    input.publicationDate,
                    input.evidenceUrl,
                    input.categoryId,
                    input.sourceId,
                    input.signalTypeCode,
                    input.impactCode,
                    input.urgencyCode,
                    input.reliabilityCode,
                    input.scopeCode,
                    analystId,
                    input.notes ?? null
                ]
            );

            const signalId = rows[0].id_signal;
            await this.replaceKeywords(client, signalId, input.keywords);
            await client.query("COMMIT");

            return signalId;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async replaceKeywords(client, signalId, keywords) {
        await client.query(
            "DELETE FROM signal_keywords WHERE id_signal = $1;",
            [signalId]
        );

        for (const keyword of keywords) {
            const keywordResult = await client.query(
                `
                    INSERT INTO keywords (name)
                    VALUES ($1)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id_keyword;
                `,
                [keyword]
            );

            await client.query(
                `
                    INSERT INTO signal_keywords (id_signal, id_keyword)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING;
                `,
                [signalId, keywordResult.rows[0].id_keyword]
            );
        }
    }

    async update(id, input) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const setters = [];
            const values = [];

            const directColumns = {
                title: "title",
                summary: "summary",
                publicationDate: "publication_date",
                evidenceUrl: "evidence_url",
                notes: "notes"
            };

            for (const [field, column] of Object.entries(directColumns)) {
                if (Object.hasOwn(input, field)) {
                    values.push(input[field]);
                    setters.push(`${column} = $${values.length}`);
                }
            }

            if (Object.hasOwn(input, "categoryId")) {
                values.push(input.categoryId);
                setters.push(
                    `id_category = (
                        SELECT id_category FROM categories
                        WHERE id_category = $${values.length} AND active
                    )`
                );
            }

            if (Object.hasOwn(input, "sourceId")) {
                values.push(input.sourceId);
                setters.push(
                    `id_source = (
                        SELECT id_source FROM sources
                        WHERE id_source = $${values.length} AND active
                    )`
                );
            }

            const catalogColumns = {
                signalTypeCode: ["id_signal_type", "signal_types"],
                impactCode: ["id_impact", "impacts"],
                urgencyCode: ["id_urgency", "urgencies"],
                scopeCode: ["id_scope", "scopes"]
            };

            for (const [field, [column, catalog]] of Object.entries(
                catalogColumns
            )) {
                if (Object.hasOwn(input, field)) {
                    values.push(input[field]);
                    setters.push(
                        `${column} = get_catalog_id('${catalog}', $${values.length})`
                    );
                }
            }

            if (Object.hasOwn(input, "reliabilityCode")) {
                values.push(input.reliabilityCode);
                setters.push(
                    `id_reliability = get_reliability_id($${values.length})`
                );
            }

            if (setters.length > 0) {
                setters.push("updated_at = CURRENT_TIMESTAMP");
                values.push(id);

                let concurrency = "";
                if (input.updatedAt !== undefined) {
                    values.push(input.updatedAt);
                    concurrency = `
                        AND date_trunc('milliseconds', updated_at) =
                            date_trunc('milliseconds', $${values.length}::timestamp)
                    `;
                }

                const updateResult = await client.query(
                    `
                        UPDATE signals
                        SET ${setters.join(", ")}
                        WHERE id_signal = $${values.length - (input.updatedAt !== undefined ? 1 : 0)}
                        ${concurrency};
                    `,
                    values
                );

                if (updateResult.rowCount !== 1) {
                    const error = new Error("CONCURRENT_MODIFICATION");
                    error.applicationCode = "CONCURRENT_MODIFICATION";
                    throw error;
                }
            }

            if (input.keywords !== undefined) {
                await this.replaceKeywords(client, id, input.keywords);
            }

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async transition(id, transition, actorId, notes) {
        await pool.query(
            "SELECT sp_transition_signal($1, $2, $3, $4);",
            [id, transition, actorId, notes ?? null]
        );
    }

    async findHistory(id) {
        const query = `
            SELECT
                h.id_signal_status_history,
                previous.code AS from_status_code,
                previous.name AS from_status,
                current.code AS to_status_code,
                current.name AS to_status,
                h.transition_code,
                h.changed_by,
                u.first_name || ' ' || u.last_name AS changed_by_name,
                h.notes,
                h.changed_at
            FROM signal_status_history h
            LEFT JOIN signal_statuses previous
                ON previous.id_signal_status = h.from_status_id
            INNER JOIN signal_statuses current
                ON current.id_signal_status = h.to_status_id
            INNER JOIN users u ON u.id_user = h.changed_by
            WHERE h.id_signal = $1
            ORDER BY h.changed_at, h.id_signal_status_history;
        `;

        const { rows } = await pool.query(query, [id]);
        return rows;
    }
}

module.exports = new SignalRepository();
