const pool = require("../config/database");

const PUBLIC_RESOURCE_QUERIES = Object.freeze({
    content: "SELECT 1 FROM vw_public_content WHERE id_content = $1",
    signal: `SELECT 1 FROM signals s INNER JOIN signal_statuses status
        ON status.id_signal_status = s.id_signal_status
        WHERE s.id_signal = $1 AND status.code = 'VALIDATED'`,
    trend: `SELECT 1 FROM trends t INNER JOIN trend_statuses status
        ON status.id_trend_status = t.id_trend_status
        WHERE t.id_trend = $1 AND status.code = 'ACTIVE'`,
    alert: `SELECT 1 FROM alerts a INNER JOIN alert_statuses status
        ON status.id_alert_status = a.id_alert_status
        WHERE a.id_alert = $1 AND status.code IN ('PUBLISHED', 'CLOSED')`
});

class PublicViewRepository {
    async isPublic(resourceType, resourceId) {
        const { rowCount } = await pool.query(
            PUBLIC_RESOURCE_QUERIES[resourceType],
            [resourceId]
        );
        return rowCount > 0;
    }

    async get(resourceType, resourceId) {
        const { rows } = await pool.query(
            `SELECT view_count FROM public_view_counts
             WHERE resource_type = $1 AND resource_id = $2;`,
            [resourceType, resourceId]
        );
        return Number(rows[0]?.view_count ?? 0);
    }

    async increment(resourceType, resourceId) {
        const { rows } = await pool.query(
            `INSERT INTO public_view_counts (resource_type, resource_id, view_count)
             VALUES ($1, $2, 1)
             ON CONFLICT (resource_type, resource_id) DO UPDATE
             SET view_count = public_view_counts.view_count + 1,
                 updated_at = CURRENT_TIMESTAMP
             RETURNING view_count;`,
            [resourceType, resourceId]
        );
        return Number(rows[0].view_count);
    }
}

module.exports = new PublicViewRepository();
