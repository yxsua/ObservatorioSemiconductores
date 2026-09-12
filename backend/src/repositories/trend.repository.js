const pool = require("../config/database");

const SORT_COLUMNS = Object.freeze({
    title: "t.title",
    firstSignalDate: "t.first_signal_date",
    updatedAt: "t.updated_at",
    signalCount: "signal_count"
});

const SELECT_FIELDS = `
    t.id_trend,
    t.business_code,
    t.title,
    t.narrative,
    t.implications,
    t.methodology_notes,
    t.assessment,
    t.first_signal_date,
    td.code AS direction_code,
    td.name AS direction,
    tm.code AS maturity_code,
    tm.name AS maturity,
    ts.code AS status_code,
    ts.name AS status,
    analyst.id_user AS analyst_id,
    analyst.first_name || ' ' || analyst.last_name AS analyst,
    validator.id_user AS validator_id,
    validator.first_name || ' ' || validator.last_name AS validator,
    t.validation_date,
    t.created_at,
    t.updated_at,
    (SELECT COUNT(*) FROM signal_trends st WHERE st.id_trend = t.id_trend)::INTEGER
        AS signal_count,
    (
        SELECT COUNT(DISTINCT s.id_source)
        FROM signal_trends st
        INNER JOIN signals s ON s.id_signal = st.id_signal
        WHERE st.id_trend = t.id_trend
    )::INTEGER AS source_count,
    (SELECT COUNT(*) FROM trend_actors ta WHERE ta.id_trend = t.id_trend)::INTEGER
        AS actor_count,
    (
        SELECT COUNT(DISTINCT c.id_fcv)
        FROM signal_trends st
        INNER JOIN signals s ON s.id_signal = st.id_signal
        INNER JOIN categories c ON c.id_category = s.id_category
        WHERE st.id_trend = t.id_trend
    )::INTEGER AS fcv_count,
    (
        SELECT MAX(s.publication_date)
        FROM signal_trends st
        INNER JOIN signals s ON s.id_signal = st.id_signal
        WHERE st.id_trend = t.id_trend
    ) AS last_signal_date,
    COALESCE((
        SELECT json_agg(json_build_object(
            'id', s.id_signal,
            'businessCode', s.business_code,
            'title', s.title,
            'publicationDate', s.publication_date,
            'captureDate', s.capture_date,
            'statusCode', ss.code,
            'status', ss.name,
            'ips', s.ips,
            'sourceId', s.id_source,
            'fcvCode', f.code,
            'fcv', f.name
        ) ORDER BY s.publication_date, s.id_signal)
        FROM signal_trends st
        INNER JOIN signals s ON s.id_signal = st.id_signal
        INNER JOIN signal_statuses ss
            ON ss.id_signal_status = s.id_signal_status
        INNER JOIN categories c ON c.id_category = s.id_category
        INNER JOIN fcv f ON f.id_fcv = c.id_fcv
        WHERE st.id_trend = t.id_trend
    ), '[]'::json) AS signals,
    COALESCE((
        SELECT json_agg(json_build_object(
            'id', a.id_actor,
            'name', a.name,
            'typeCode', at.code,
            'type', at.name,
            'country', a.country,
            'website', a.website
        ) ORDER BY a.name)
        FROM trend_actors ta
        INNER JOIN actors a ON a.id_actor = ta.id_actor
        LEFT JOIN actor_types at ON at.id_actor_type = a.id_actor_type
        WHERE ta.id_trend = t.id_trend
    ), '[]'::json) AS actors
`;

const FROM_CLAUSE = `
    FROM trends t
    LEFT JOIN trend_directions td
        ON td.id_trend_direction = t.id_trend_direction
    LEFT JOIN trend_maturity tm
        ON tm.id_trend_maturity = t.id_trend_maturity
    INNER JOIN trend_statuses ts
        ON ts.id_trend_status = t.id_trend_status
    LEFT JOIN users analyst ON analyst.id_user = t.id_analyst
    LEFT JOIN users validator ON validator.id_user = t.id_validator
`;

class TrendRepository {
    buildFilters(filters, publicOnly) {
        const values = [];
        const conditions = [];
        const add = (value, column) => {
            values.push(value);
            conditions.push(`${column} = $${values.length}`);
        };

        if (publicOnly) {
            conditions.push("ts.code = 'ACTIVE'");
        } else if (filters.status !== undefined) {
            add(filters.status, "ts.code");
        }

        if (filters.direction !== undefined) add(filters.direction, "td.code");
        if (filters.maturity !== undefined) add(filters.maturity, "tm.code");
        if (filters.categoryId !== undefined) {
            values.push(filters.categoryId);
            conditions.push(`EXISTS (
                SELECT 1 FROM signal_trends filter_relation
                INNER JOIN signals filter_signal ON filter_signal.id_signal = filter_relation.id_signal
                WHERE filter_relation.id_trend = t.id_trend
                  AND filter_signal.id_category = $${values.length}
            )`);
        }
        if (filters.from !== undefined) {
            values.push(filters.from);
            conditions.push(`t.first_signal_date >= $${values.length}::DATE`);
        }
        if (filters.to !== undefined) {
            values.push(filters.to);
            conditions.push(`t.first_signal_date < $${values.length}::DATE + INTERVAL '1 day'`);
        }

        if (filters.search !== undefined) {
            values.push(filters.search);
            const p = `$${values.length}`;
            conditions.push(`(
                t.business_code ILIKE '%' || ${p} || '%'
                OR to_tsvector(
                    'spanish',
                    coalesce(t.title, '') || ' ' || coalesce(t.narrative, '') ||
                    ' ' || coalesce(t.implications, '')
                ) @@ plainto_tsquery('spanish', ${p})
            )`);
        }

        return {
            values,
            where: conditions.length
                ? `WHERE ${conditions.join(" AND ")}`
                : ""
        };
    }

    async findAll(filters, pagination, publicOnly) {
        const { values, where } = this.buildFilters(filters, publicOnly);
        const sortColumn = SORT_COLUMNS[filters.sortField]
            ?? SORT_COLUMNS.updatedAt;
        const direction = filters.sortDirection === "ASC" ? "ASC" : "DESC";

        values.push(pagination.limit);
        const limit = `$${values.length}`;
        values.push(pagination.offset);
        const offset = `$${values.length}`;

        const query = `
            SELECT ${SELECT_FIELDS}, COUNT(*) OVER()::BIGINT AS total_count
            ${FROM_CLAUSE}
            ${where}
            ORDER BY ${sortColumn} ${direction}, t.id_trend DESC
            LIMIT ${limit} OFFSET ${offset};
        `;

        const { rows } = await pool.query(query, values);
        return {
            rows,
            totalItems: rows.length ? Number(rows[0].total_count) : 0
        };
    }

    async findById(id, publicOnly = false) {
        const visibility = publicOnly ? "AND ts.code = 'ACTIVE'" : "";
        const { rows } = await pool.query(
            `
                SELECT ${SELECT_FIELDS}
                ${FROM_CLAUSE}
                WHERE t.id_trend = $1 ${visibility}
                LIMIT 1;
            `,
            [id]
        );
        return rows[0] ?? null;
    }

    async create(input, analystId) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const { rows } = await client.query(
                `SELECT sp_create_trend_v2($1,$2,$3,$4,$5,$6,$7) AS id_trend;`,
                [
                    input.title,
                    input.narrative,
                    analystId,
                    input.implications ?? null,
                    input.directionCode ?? null,
                    input.maturityCode ?? null,
                    input.methodologyNotes ?? null
                ]
            );
            const id = rows[0].id_trend;
            await client.query('UPDATE trends SET assessment=$2::jsonb WHERE id_trend=$1',[id,JSON.stringify(input.assessment)]);
            for (const signalId of input.signalIds) {
                await client.query(
                    "SELECT sp_link_signal_to_trend($1, $2);",
                    [signalId, id]
                );
            }
            for (const actorId of input.actorIds) {
                await client.query(
                    "SELECT sp_link_actor_to_trend($1, $2);",
                    [actorId, id]
                );
            }
            await client.query('SELECT refresh_trend_assessment($1)',[id]);
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
            narrative: "narrative",
            implications: "implications",
            methodologyNotes: "methodology_notes",
            assessment: "assessment"
        };

        for (const [field, column] of Object.entries(direct)) {
            if (Object.hasOwn(input, field)) {
                values.push(field === 'assessment' ? JSON.stringify(input[field]) : input[field]);
                setters.push(`${column} = $${values.length}`);
            }
        }

        const catalogs = {
            directionCode: ["id_trend_direction", "trend_directions"],
            maturityCode: ["id_trend_maturity", "trend_maturity"]
        };
        for (const [field, [column, catalog]] of Object.entries(catalogs)) {
            if (Object.hasOwn(input, field)) {
                if (input[field] === null) {
                    setters.push(`${column} = NULL`);
                } else {
                    values.push(input[field]);
                    setters.push(
                        `${column} = get_catalog_id('${catalog}', $${values.length})`
                    );
                }
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
            `UPDATE trends SET ${setters.join(", ")}
             WHERE id_trend = $${idPosition} ${concurrency};`,
            values
        );
        return result.rowCount;
    }

    async linkSignals(id, signalIds) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            for (const signalId of signalIds) {
                await client.query(
                    "SELECT sp_link_signal_to_trend($1, $2);",
                    [signalId, id]
                );
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async unlinkSignal(id, signalId) {
        await pool.query(
            "SELECT sp_unlink_signal_from_trend($1, $2);",
            [signalId, id]
        );
    }

    async linkActors(id, actorIds) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            for (const actorId of actorIds) {
                await client.query(
                    "SELECT sp_link_actor_to_trend($1, $2);",
                    [actorId, id]
                );
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async unlinkActor(id, actorId) {
        await pool.query(
            "SELECT sp_unlink_actor_from_trend($1, $2);",
            [actorId, id]
        );
    }

    async transition(id, transition, actorId, notes) {
        await pool.query(
            "SELECT sp_transition_trend($1, $2, $3, $4);",
            [id, transition, actorId, notes ?? null]
        );
    }

    async findHistory(id) {
        const { rows } = await pool.query(
            `
                SELECT
                    h.id_trend_status_history,
                    previous.code AS from_status_code,
                    previous.name AS from_status,
                    current.code AS to_status_code,
                    current.name AS to_status,
                    h.transition_code,
                    h.changed_by,
                    u.first_name || ' ' || u.last_name AS changed_by_name,
                    h.notes,
                    h.changed_at
                FROM trend_status_history h
                LEFT JOIN trend_statuses previous
                    ON previous.id_trend_status = h.from_status_id
                INNER JOIN trend_statuses current
                    ON current.id_trend_status = h.to_status_id
                INNER JOIN users u ON u.id_user = h.changed_by
                WHERE h.id_trend = $1
                ORDER BY h.changed_at, h.id_trend_status_history;
            `,
            [id]
        );
        return rows;
    }

    async findActors(search = null) {
        const values = [];
        let clause = "";
        if (search !== null) {
            values.push(search);
            clause = "WHERE a.name ILIKE '%' || $1 || '%'";
        }
        const { rows } = await pool.query(
            `
                SELECT
                    a.id_actor,
                    at.code AS type_code,
                    at.name AS type,
                    a.name,
                    a.country,
                    a.website
                FROM actors a
                LEFT JOIN actor_types at ON at.id_actor_type = a.id_actor_type
                ${clause}
                ORDER BY a.name;
            `,
            values
        );
        return rows;
    }
}

module.exports = new TrendRepository();
