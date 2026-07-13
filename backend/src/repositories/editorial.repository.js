const pool = require("../config/database");

class EditorialRepository {
    async findEnabledBlockTypes() {
        const { rows } = await pool.query(`
            SELECT
                id_block_type,
                code,
                name,
                icon,
                description,
                supports_children,
                schema_version,
                public_allowed
            FROM block_type
            WHERE active
            ORDER BY name, id_block_type;
        `);
        return rows;
    }
}

module.exports = new EditorialRepository();
