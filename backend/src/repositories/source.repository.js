const pool = require("../config/database");

class SourceRepository {
    async findActive(search = null) {
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
            SELECT
                id_source,
                source_type_code,
                source_type,
                name,
                website,
                country,
                reliability
            FROM vw_sources
            WHERE active = TRUE
            ${searchClause}
            ORDER BY name;
        `;

        const { rows } = await pool.query(query, values);
        return rows;
    }
}

module.exports = new SourceRepository();
