const pool = require("../config/database");

class SourceRepository {
    async findAll(search = null, active = true) {
        const values = [];
        let searchClause = "";

        if (search !== null) {
            values.push(search);
            searchClause = `
                AND (
                    name ILIKE '%' || $1 || '%'
                    OR country ILIKE '%' || $1 || '%'
                )
            `;
        }

        const query = `
            SELECT *
            FROM vw_sources
            WHERE ($${values.length + 1}::BOOLEAN IS NULL OR active = $${values.length + 1})
            ${searchClause}
            ORDER BY name;
        `;
        values.push(active);
        const { rows } = await pool.query(query, values);
        return rows;
    }

    async findById(id) {
        const { rows } = await pool.query(
            "SELECT * FROM vw_sources WHERE id_source = $1 LIMIT 1;", [id]
        );
        return rows[0] ?? null;
    }

    async create(input) {
        const { rows } = await pool.query(
            "SELECT sp_create_source($1,$2,$3,$4,$5,$6,$7) AS id_source;",
            [input.typeCode, input.name, input.website ?? null,
                input.country ?? null, input.rssUrl ?? null, input.apiUrl ?? null,
                input.historicalReliability ?? null]
        );
        return rows[0].id_source;
    }

    async update(id, input) {
        const setters = [];
        const values = [];
        const direct = {
            name: "name", website: "website", country: "country",
            rssUrl: "rss_url", apiUrl: "api_url",
            historicalReliability: "reliability"
        };
        for (const [field, column] of Object.entries(direct)) {
            if (Object.hasOwn(input, field)) {
                values.push(input[field]);
                setters.push(`${column} = $${values.length}`);
            }
        }
        if (Object.hasOwn(input, "typeCode")) {
            values.push(input.typeCode);
            setters.push(`id_source_type = get_catalog_id('source_types', $${values.length})`);
        }
        setters.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);
        const idPosition = values.length;
        values.push(input.updatedAt);
        const result = await pool.query(
            `UPDATE sources SET ${setters.join(", ")}
             WHERE id_source = $${idPosition} AND active = TRUE
               AND date_trunc('milliseconds', updated_at) =
                   date_trunc('milliseconds', $${values.length}::timestamp);`, values
        );
        return result.rowCount;
    }

    async deactivate(id, updatedAt) {
        const result = await pool.query(
            `UPDATE sources SET active = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE id_source = $1 AND active = TRUE
               AND date_trunc('milliseconds', updated_at) =
                   date_trunc('milliseconds', $2::timestamp);`, [id, updatedAt]
        );
        return result.rowCount;
    }
}

module.exports = new SourceRepository();
