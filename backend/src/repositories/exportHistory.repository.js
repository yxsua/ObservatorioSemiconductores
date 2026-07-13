const pool = require("../config/database");

class ExportHistoryRepository {
    async create(entry) {
        const { rows } = await pool.query(`
            INSERT INTO export_history (
                user_id, resource_code, format_code, filters,
                row_count, size_bytes, checksum
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING id_export, created_at;
        `, [
            entry.userId,
            entry.resource,
            entry.format,
            entry.filters,
            entry.rowCount,
            entry.sizeBytes,
            entry.checksum
        ]);
        return rows[0];
    }

    async findByUser(userId, pagination) {
        const { rows } = await pool.query(`
            SELECT
                id_export,
                resource_code,
                format_code,
                filters,
                row_count,
                size_bytes,
                checksum,
                created_at,
                COUNT(*) OVER()::BIGINT AS total_count
            FROM export_history
            WHERE user_id = $1
            ORDER BY created_at DESC, id_export DESC
            LIMIT $2 OFFSET $3;
        `, [userId, pagination.limit, pagination.offset]);
        return {
            rows,
            totalItems: rows.length ? Number(rows[0].total_count) : 0
        };
    }
}

module.exports = new ExportHistoryRepository();

