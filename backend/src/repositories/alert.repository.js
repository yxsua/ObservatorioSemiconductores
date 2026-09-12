const pool = require("../config/database");

const SORT_COLUMNS = Object.freeze({
    generationDate: "a.generation_date",
    responseDeadline: "a.response_deadline",
    level: "al.id_alert_level",
    title: "a.title",
    updatedAt: "a.updated_at"
});

const SELECT_FIELDS = `
    a.id_alert,
    a.business_code,
    a.title,
    a.executive_summary,
    a.implications,
    a.recommendations,
    a.generation_date,
    a.response_deadline,
    a.publication_date,
    a.activation_rule,
    a.notes,
    a.assessment,
    al.code AS level_code,
    al.name AS level,
    al.color AS level_color,
    ast.code AS status_code,
    ast.name AS status,
    ao.code AS origin_code,
    ao.name AS origin,
    creator.id_user AS creator_id,
    creator.first_name || ' ' || creator.last_name AS creator,
    validator.id_user AS validator_id,
    validator.first_name || ' ' || validator.last_name AS validator,
    publisher.id_user AS publisher_id,
    publisher.first_name || ' ' || publisher.last_name AS publisher,
    a.validation_date,
    a.created_at,
    a.updated_at,
    (SELECT COUNT(*) FROM alert_signals x WHERE x.id_alert = a.id_alert)::INTEGER
        AS signal_count,
    (SELECT COUNT(*) FROM alert_trends x WHERE x.id_alert = a.id_alert)::INTEGER
        AS trend_count,
    (SELECT COUNT(*) FROM alert_audiences x WHERE x.id_alert = a.id_alert)::INTEGER
        AS audience_count,
    COALESCE((
        SELECT json_agg(json_build_object(
            'id', s.id_signal,
            'businessCode', s.business_code,
            'title', s.title,
            'statusCode', ss.code,
            'status', ss.name,
            'ips', s.ips
        ) ORDER BY s.publication_date, s.id_signal)
        FROM alert_signals x
        INNER JOIN signals s ON s.id_signal = x.id_signal
        INNER JOIN signal_statuses ss ON ss.id_signal_status = s.id_signal_status
        WHERE x.id_alert = a.id_alert
    ), '[]'::json) AS signals,
    COALESCE((
        SELECT json_agg(json_build_object(
            'id', t.id_trend,
            'businessCode', t.business_code,
            'title', t.title,
            'statusCode', ts.code,
            'status', ts.name,
            'maturityCode', tm.code,
            'maturity', tm.name
        ) ORDER BY t.title)
        FROM alert_trends x
        INNER JOIN trends t ON t.id_trend = x.id_trend
        INNER JOIN trend_statuses ts ON ts.id_trend_status = t.id_trend_status
        LEFT JOIN trend_maturity tm ON tm.id_trend_maturity = t.id_trend_maturity
        WHERE x.id_alert = a.id_alert
    ), '[]'::json) AS trends,
    COALESCE((
        SELECT json_agg(json_build_object(
            'code', aud.code,
            'name', aud.name
        ) ORDER BY aud.name)
        FROM alert_audiences x
        INNER JOIN audiences aud ON aud.id_audience = x.id_audience
        WHERE x.id_alert = a.id_alert
    ), '[]'::json) AS audiences
`;

const FROM_CLAUSE = `
    FROM alerts a
    LEFT JOIN alert_levels al ON al.id_alert_level = a.id_alert_level
    INNER JOIN alert_statuses ast ON ast.id_alert_status = a.id_alert_status
    INNER JOIN alert_origins ao ON ao.id_alert_origin = a.id_alert_origin
    LEFT JOIN users creator ON creator.id_user = a.id_creator
    LEFT JOIN users validator ON validator.id_user = a.id_validator
    LEFT JOIN users publisher ON publisher.id_user = a.id_publisher
`;

class AlertRepository {
    buildFilters(filters, publicOnly) {
        const values = [];
        const conditions = [];
        const add = (value, column) => {
            values.push(value);
            conditions.push(`${column} = $${values.length}`);
        };

        if (publicOnly) {
            conditions.push("ast.code IN ('PUBLISHED', 'CLOSED')");
        } else if (filters.status !== undefined) {
            add(filters.status, "ast.code");
        }
        if (filters.level !== undefined) add(filters.level, "al.code");
        if (filters.audience !== undefined) {
            values.push(filters.audience);
            conditions.push(`EXISTS (
                SELECT 1 FROM alert_audiences aa
                INNER JOIN audiences aud ON aud.id_audience = aa.id_audience
                WHERE aa.id_alert = a.id_alert AND aud.code = $${values.length}
            )`);
        }
        if (filters.categoryId !== undefined) {
            values.push(filters.categoryId);
            const category = `$${values.length}`;
            conditions.push(`(
                EXISTS (
                    SELECT 1 FROM alert_signals filter_alert_signal
                    INNER JOIN signals filter_signal ON filter_signal.id_signal = filter_alert_signal.id_signal
                    WHERE filter_alert_signal.id_alert = a.id_alert
                      AND filter_signal.id_category = ${category}
                ) OR EXISTS (
                    SELECT 1 FROM alert_trends filter_alert_trend
                    INNER JOIN signal_trends filter_trend_signal ON filter_trend_signal.id_trend = filter_alert_trend.id_trend
                    INNER JOIN signals filter_signal ON filter_signal.id_signal = filter_trend_signal.id_signal
                    WHERE filter_alert_trend.id_alert = a.id_alert
                      AND filter_signal.id_category = ${category}
                )
            )`);
        }
        if (filters.from !== undefined) {
            values.push(filters.from);
            conditions.push(`a.generation_date >= $${values.length}::DATE`);
        }
        if (filters.to !== undefined) {
            values.push(filters.to);
            conditions.push(`a.generation_date < $${values.length}::DATE + INTERVAL '1 day'`);
        }
        if (filters.search !== undefined) {
            values.push(filters.search);
            const p = `$${values.length}`;
            conditions.push(`(
                a.business_code ILIKE '%' || ${p} || '%'
                OR to_tsvector(
                    'spanish',
                    coalesce(a.title, '') || ' ' || coalesce(a.executive_summary, '') ||
                    ' ' || coalesce(a.implications, '') || ' ' ||
                    coalesce(a.recommendations, '')
                ) @@ plainto_tsquery('spanish', ${p})
            )`);
        }
        return {
            values,
            where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
        };
    }

    async findAll(filters, pagination, publicOnly) {
        const { values, where } = this.buildFilters(filters, publicOnly);
        const sort = SORT_COLUMNS[filters.sortField] ?? SORT_COLUMNS.updatedAt;
        const direction = filters.sortDirection === "ASC" ? "ASC" : "DESC";
        values.push(pagination.limit);
        const limit = `$${values.length}`;
        values.push(pagination.offset);
        const offset = `$${values.length}`;
        const { rows } = await pool.query(
            `SELECT ${SELECT_FIELDS}, COUNT(*) OVER()::BIGINT AS total_count
             ${FROM_CLAUSE} ${where}
             ORDER BY ${sort} ${direction}, a.id_alert DESC
             LIMIT ${limit} OFFSET ${offset};`,
            values
        );
        return {
            rows,
            totalItems: rows.length ? Number(rows[0].total_count) : 0
        };
    }

    async findById(id, publicOnly = false) {
        const visibility = publicOnly
            ? "AND ast.code IN ('PUBLISHED', 'CLOSED')"
            : "";
        const { rows } = await pool.query(
            `SELECT ${SELECT_FIELDS} ${FROM_CLAUSE}
             WHERE a.id_alert = $1 ${visibility} LIMIT 1;`,
            [id]
        );
        return rows[0] ?? null;
    }

    async create(input, creatorId) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const { rows } = await client.query(
                "SELECT sp_create_manual_alert_v2($1,$2,$3,$4,$5,$6,$7,$8,$9) AS id_alert;",
                [
                    input.title,
                    input.executiveSummary,
                    creatorId,
                    input.levelCode ?? null,
                    input.implications ?? null,
                    input.recommendations ?? null,
                    input.responseDeadline ?? null,
                    input.activationRule ?? null,
                    input.notes ?? null
                ]
            );
            const id = rows[0].id_alert;
            await client.query('UPDATE alerts SET assessment=$2::jsonb WHERE id_alert=$1',[id,JSON.stringify(input.assessment)]);
            await this.linkAll(client, id, input.signalIds, "signal");
            await this.linkAll(client, id, input.trendIds, "trend");
            await this.linkAll(client, id, input.audienceCodes, "audience");
            await client.query("COMMIT");
            return id;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async update(id, input) {
        const setters = [];
        const values = [];
        const direct = {
            title: "title",
            executiveSummary: "executive_summary",
            implications: "implications",
            recommendations: "recommendations",
            responseDeadline: "response_deadline",
            activationRule: "activation_rule",
            notes: "notes",
            assessment: "assessment"
        };
        for (const [field, column] of Object.entries(direct)) {
            if (Object.hasOwn(input, field)) {
                values.push(field === 'assessment' ? JSON.stringify(input[field]) : input[field]);
                setters.push(`${column} = $${values.length}`);
            }
        }
        if (Object.hasOwn(input, "levelCode")) {
            if (input.levelCode === null) {
                setters.push("id_alert_level = NULL");
            } else {
                values.push(input.levelCode);
                setters.push(
                    `id_alert_level = get_catalog_id('alert_levels', $${values.length})`
                );
            }
        }
        setters.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);
        const idPosition = values.length;
        let concurrency = "";
        if (input.updatedAt !== undefined) {
            values.push(input.updatedAt);
            concurrency = `AND date_trunc('milliseconds', updated_at) =
                date_trunc('milliseconds', $${values.length}::timestamp)`;
        }
        const result = await pool.query(
            `UPDATE alerts SET ${setters.join(", ")}
             WHERE id_alert = $${idPosition} ${concurrency};`,
            values
        );
        return result.rowCount;
    }

    async linkAll(client, id, values, relation) {
        const functions = {
            signal: "sp_link_signal_to_alert",
            trend: "sp_link_trend_to_alert",
            audience: "sp_link_audience_to_alert"
        };
        for (const value of values) {
            await client.query(
                `SELECT ${functions[relation]}($1, $2);`,
                [value, id]
            );
        }
    }

    async link(id, values, relation) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await this.linkAll(client, id, values, relation);
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async unlink(id, value, relation) {
        const functions = {
            signal: "sp_unlink_signal_from_alert",
            trend: "sp_unlink_trend_from_alert",
            audience: "sp_unlink_audience_from_alert"
        };
        await pool.query(`SELECT ${functions[relation]}($1, $2);`, [value, id]);
    }

    async transition(id, transition, actorId, notes) {
        await pool.query(
            "SELECT sp_transition_alert($1, $2, $3, $4);",
            [id, transition, actorId, notes ?? null]
        );
    }

    async findHistory(id) {
        const { rows } = await pool.query(
            `SELECT
                h.id_alert_status_history,
                previous.code AS from_status_code,
                previous.name AS from_status,
                current.code AS to_status_code,
                current.name AS to_status,
                h.transition_code,
                h.changed_by,
                u.first_name || ' ' || u.last_name AS changed_by_name,
                h.notes,
                h.changed_at
             FROM alert_status_history h
             LEFT JOIN alert_statuses previous
                ON previous.id_alert_status = h.from_status_id
             INNER JOIN alert_statuses current
                ON current.id_alert_status = h.to_status_id
             INNER JOIN users u ON u.id_user = h.changed_by
             WHERE h.id_alert = $1
             ORDER BY h.changed_at, h.id_alert_status_history;`,
            [id]
        );
        return rows;
    }
}

module.exports = new AlertRepository();
