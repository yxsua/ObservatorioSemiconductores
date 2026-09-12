const pool = require("../config/database");

async function queryIfIds(ids, sql) {
    if (!ids.length) return [];
    const { rows } = await pool.query(sql, [ids]);
    return rows;
}

class BlockResolverRepository {
    async resolve(references) {
        const [media, signals, trends, alerts] = await Promise.all([
            this.findMedia(references.mediaIds),
            this.findSignals(references.signalIds),
            this.findTrends(references.trendIds),
            this.findAlerts(references.alertIds)
        ]);
        return { media, signals, trends, alerts };
    }

    findMedia(ids) {
        return queryIfIds(ids, `
            SELECT id_media, filename, original_filename, mime_type,
                extension, size_bytes, storage_path
            FROM media
            WHERE id_media = ANY($1::BIGINT[]) AND is_public;
        `);
    }

    findSignals(ids) {
        return queryIfIds(ids, `
            SELECT
                signal.id_signal,
                signal.business_code,
                signal.title,
                signal.summary,
                signal.publication_date,
                signal.ips,
                CASE
                    WHEN signal.ips <= 9 THEN 'LOW'
                    WHEN signal.ips <= 18 THEN 'MEDIUM'
                    ELSE 'HIGH'
                END AS priority_code,
                category.id_category,
                category.name AS category_name,
                fcv.code AS fcv_code,
                fcv.name AS fcv_name,
                source.id_source,
                source.name AS source_name,
                signal_type.code AS signal_type_code,
                signal_type.name AS signal_type_name,
                impact.code AS impact_code,
                impact.name AS impact_name,
                urgency.code AS urgency_code,
                urgency.name AS urgency_name,
                reliability.code AS reliability_code,
                reliability.name AS reliability_name,
                scope.code AS scope_code,
                scope.name AS scope_name,
                EXISTS (
                    SELECT 1 FROM signal_trends relation
                    WHERE relation.id_signal = signal.id_signal
                ) AS linked_to_trend,
                EXISTS (
                    SELECT 1 FROM alert_signals relation
                    WHERE relation.id_signal = signal.id_signal
                ) AS linked_to_alert,
                COALESCE((
                    SELECT jsonb_agg(keyword.name ORDER BY keyword.name)
                    FROM signal_keywords relation
                    INNER JOIN keywords keyword
                        ON keyword.id_keyword = relation.id_keyword
                    WHERE relation.id_signal = signal.id_signal
                ), '[]'::JSONB) AS keywords
            FROM signals signal
            INNER JOIN signal_statuses status
                ON status.id_signal_status = signal.id_signal_status
            INNER JOIN categories category
                ON category.id_category = signal.id_category
            INNER JOIN fcv ON fcv.id_fcv = category.id_fcv
            INNER JOIN sources source ON source.id_source = signal.id_source
            INNER JOIN signal_types signal_type
                ON signal_type.id_signal_type = signal.id_signal_type
            INNER JOIN impacts impact ON impact.id_impact = signal.id_impact
            INNER JOIN urgencies urgency ON urgency.id_urgency = signal.id_urgency
            INNER JOIN reliability_levels reliability
                ON reliability.id_reliability = signal.id_reliability
            INNER JOIN scopes scope ON scope.id_scope = signal.id_scope
            WHERE signal.id_signal = ANY($1::BIGINT[])
              AND status.code = 'VALIDATED';
        `);
    }

    findTrends(ids) {
        return queryIfIds(ids, `
            SELECT
                trend.id_trend,
                trend.business_code,
                trend.title,
                trend.narrative AS summary,
                trend.implications,
                direction.code AS direction_code,
                direction.name AS direction_name,
                maturity.code AS maturity_code,
                maturity.name AS maturity_name,
                (
                    SELECT MIN(signal.publication_date)
                    FROM signal_trends relation
                    INNER JOIN signals signal
                        ON signal.id_signal = relation.id_signal
                    INNER JOIN signal_statuses signal_status
                        ON signal_status.id_signal_status = signal.id_signal_status
                    WHERE relation.id_trend = trend.id_trend
                      AND signal_status.code = 'VALIDATED'
                ) AS first_signal_date,
                (
                    SELECT MAX(signal.publication_date)
                    FROM signal_trends relation
                    INNER JOIN signals signal
                        ON signal.id_signal = relation.id_signal
                    INNER JOIN signal_statuses signal_status
                        ON signal_status.id_signal_status = signal.id_signal_status
                    WHERE relation.id_trend = trend.id_trend
                      AND signal_status.code = 'VALIDATED'
                ) AS last_signal_date,
                COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', signal.id_signal,
                        'businessCode', signal.business_code,
                        'title', signal.title
                    ) ORDER BY signal.publication_date, signal.id_signal)
                    FROM signal_trends relation
                    INNER JOIN signals signal
                        ON signal.id_signal = relation.id_signal
                    INNER JOIN signal_statuses signal_status
                        ON signal_status.id_signal_status = signal.id_signal_status
                    WHERE relation.id_trend = trend.id_trend
                      AND signal_status.code = 'VALIDATED'
                ), '[]'::JSONB) AS signals,
                COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', actor.id_actor,
                        'name', actor.name,
                        'typeCode', actor_type.code,
                        'type', actor_type.name,
                        'country', actor.country
                    ) ORDER BY actor.name)
                    FROM trend_actors relation
                    INNER JOIN actors actor ON actor.id_actor = relation.id_actor
                    LEFT JOIN actor_types actor_type
                        ON actor_type.id_actor_type = actor.id_actor_type
                    WHERE relation.id_trend = trend.id_trend
                ), '[]'::JSONB) AS actors
            FROM trends trend
            INNER JOIN trend_statuses status
                ON status.id_trend_status = trend.id_trend_status
            LEFT JOIN trend_directions direction
                ON direction.id_trend_direction = trend.id_trend_direction
            LEFT JOIN trend_maturity maturity
                ON maturity.id_trend_maturity = trend.id_trend_maturity
            WHERE trend.id_trend = ANY($1::BIGINT[])
              AND status.code = 'ACTIVE';
        `);
    }

    findAlerts(ids) {
        return queryIfIds(ids, `
            SELECT
                alert.id_alert,
                alert.business_code,
                alert.title,
                alert.executive_summary AS summary,
                alert.implications,
                alert.recommendations,
                alert.generation_date,
                alert.publication_date,
                alert.response_deadline,
                level.code AS level_code,
                level.name AS level_name,
                level.color AS level_color,
                COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', signal.id_signal,
                        'businessCode', signal.business_code,
                        'title', signal.title
                    ) ORDER BY signal.publication_date, signal.id_signal)
                    FROM alert_signals relation
                    INNER JOIN signals signal
                        ON signal.id_signal = relation.id_signal
                    INNER JOIN signal_statuses signal_status
                        ON signal_status.id_signal_status = signal.id_signal_status
                    WHERE relation.id_alert = alert.id_alert
                      AND signal_status.code = 'VALIDATED'
                ), '[]'::JSONB) AS signals,
                COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', trend.id_trend,
                        'businessCode', trend.business_code,
                        'title', trend.title
                    ) ORDER BY trend.title)
                    FROM alert_trends relation
                    INNER JOIN trends trend ON trend.id_trend = relation.id_trend
                    INNER JOIN trend_statuses trend_status
                        ON trend_status.id_trend_status = trend.id_trend_status
                    WHERE relation.id_alert = alert.id_alert
                      AND trend_status.code = 'ACTIVE'
                ), '[]'::JSONB) AS trends,
                COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'code', audience.code,
                        'name', audience.name
                    ) ORDER BY audience.name)
                    FROM alert_audiences relation
                    INNER JOIN audiences audience
                        ON audience.id_audience = relation.id_audience
                    WHERE relation.id_alert = alert.id_alert
                ), '[]'::JSONB) AS audiences
            FROM alerts alert
            INNER JOIN alert_statuses status
                ON status.id_alert_status = alert.id_alert_status
            LEFT JOIN alert_levels level
                ON level.id_alert_level = alert.id_alert_level
            WHERE alert.id_alert = ANY($1::BIGINT[])
              AND status.code IN ('PUBLISHED', 'CLOSED');
        `);
    }
}

module.exports = new BlockResolverRepository();
