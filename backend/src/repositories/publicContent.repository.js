const pool = require("../config/database");

const SORT_COLUMNS = Object.freeze({
    publishedAt: "public_content.published_at",
    title: "public_content.title"
});

const ELIGIBLE_BLOCK = `
    type.active
    AND type.public_allowed
    AND block.schema_version = type.schema_version
    AND CASE type.code
        WHEN 'signal' THEN EXISTS (
            SELECT 1
            FROM signals signal
            INNER JOIN signal_statuses status
                ON status.id_signal_status = signal.id_signal_status
            WHERE signal.id_signal::TEXT = block.data ->> 'entityId'
              AND status.code = 'VALIDATED'
        )
        WHEN 'trend' THEN EXISTS (
            SELECT 1
            FROM trends trend
            INNER JOIN trend_statuses status
                ON status.id_trend_status = trend.id_trend_status
            WHERE trend.id_trend::TEXT = block.data ->> 'entityId'
              AND status.code = 'ACTIVE'
        )
        WHEN 'alert' THEN EXISTS (
            SELECT 1
            FROM alerts alert
            INNER JOIN alert_statuses status
                ON status.id_alert_status = alert.id_alert_status
            WHERE alert.id_alert::TEXT = block.data ->> 'entityId'
              AND status.code IN ('PUBLISHED', 'CLOSED')
        )
        WHEN 'image' THEN EXISTS (
            SELECT 1 FROM media
            WHERE media.id_media::TEXT = block.data ->> 'mediaId'
              AND media.is_public
        )
        WHEN 'file' THEN EXISTS (
            SELECT 1 FROM media
            WHERE media.id_media::TEXT = block.data ->> 'mediaId'
              AND media.is_public
        )
        ELSE TRUE
    END
`;

class PublicContentRepository {
    buildFilters(filters) {
        const values = [];
        const conditions = [];
        const add = (value, expression) => {
            values.push(value);
            conditions.push(`${expression} $${values.length}`);
        };

        if (filters.type !== undefined) add(filters.type, "public_content.type_code =");
        if (filters.categoryIds?.length || filters.categoryId !== undefined) {
            values.push(filters.categoryIds?.length ? filters.categoryIds : filters.categoryId);
            conditions.push(`EXISTS (
                SELECT 1 FROM content_version_category relation
                WHERE relation.content_version_id = public_content.published_version_id
                  AND relation.category_id ${filters.categoryIds?.length ? `= ANY($${values.length}::bigint[])` : `= $${values.length}`}
            )`);
        }
        if (filters.fcvCodes?.length || filters.fcv !== undefined) {
            values.push(filters.fcvCodes?.length ? filters.fcvCodes : filters.fcv);
            conditions.push(`EXISTS (
                SELECT 1
                FROM content_version_category relation
                INNER JOIN categories category
                    ON category.id_category = relation.category_id
                INNER JOIN fcv ON fcv.id_fcv = category.id_fcv
                WHERE relation.content_version_id = public_content.published_version_id
                  AND fcv.code ${filters.fcvCodes?.length ? `= ANY($${values.length}::text[])` : `= $${values.length}`}
            )`);
        }
        if (filters.from !== undefined) add(filters.from, "public_content.published_at >=");
        if (filters.to !== undefined) {
            values.push(filters.to);
            conditions.push(
                `public_content.published_at < $${values.length}::DATE + INTERVAL '1 day'`
            );
        }
        if (filters.search !== undefined) {
            values.push(filters.search);
            const parameter = `$${values.length}`;
            conditions.push(`(
                public_content.slug ILIKE '%' || ${parameter} || '%'
                OR to_tsvector(
                    'spanish',
                    COALESCE(public_content.title, '') || ' '
                    || COALESCE(public_content.summary, '')
                ) @@ plainto_tsquery('spanish', ${parameter})
            )`);
        }

        return {
            values,
            where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
        };
    }

    async findAll(filters, pagination) {
        const { values, where } = this.buildFilters(filters);
        const sort = SORT_COLUMNS[filters.sortField] ?? SORT_COLUMNS.publishedAt;
        const direction = filters.sortDirection === "ASC" ? "ASC" : "DESC";
        values.push(pagination.limit);
        const limit = `$${values.length}`;
        values.push(pagination.offset);
        const offset = `$${values.length}`;
        const { rows } = await pool.query(`
            SELECT
                public_content.*,
                COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', category.id_category,
                        'name', category.name,
                        'fcvCode', fcv.code,
                        'fcvName', fcv.name
                    ) ORDER BY category.name)
                    FROM content_version_category relation
                    INNER JOIN categories category
                        ON category.id_category = relation.category_id
                    INNER JOIN fcv ON fcv.id_fcv = category.id_fcv
                    WHERE relation.content_version_id = public_content.published_version_id
                ), '[]'::JSONB) AS categories,
                COUNT(*) OVER()::BIGINT AS total_count
            FROM vw_public_content public_content
            ${where}
            ORDER BY ${sort} ${direction}, public_content.id_content DESC
            LIMIT ${limit} OFFSET ${offset};
        `, values);
        return {
            rows,
            totalItems: rows.length ? Number(rows[0].total_count) : 0
        };
    }

    async findBySlug(slug) {
        const { rows } = await pool.query(`
            SELECT * FROM vw_public_content WHERE slug = $1 LIMIT 1;
        `, [slug]);
        if (!rows[0]) return null;
        const versionId = rows[0].published_version_id;
        const [sections, relations] = await Promise.all([
            this.findSections(versionId),
            this.findRelations(versionId)
        ]);
        return { ...rows[0], sections, relations };
    }

    async findSections(versionId) {
        const { rows: sections } = await pool.query(`
            SELECT
                section.id_content_section,
                section.title,
                section.position,
                section.is_collapsible,
                section.settings,
                section_type.code AS type_code,
                section_type.name AS type_name
            FROM content_section section
            LEFT JOIN section_types section_type
                ON section_type.id_section_type = section.section_type_id
            WHERE section.content_version_id = $1
              AND section.is_visible
              AND EXISTS (
                  SELECT 1
                  FROM content_block block
                  INNER JOIN block_type type
                      ON type.id_block_type = block.block_type_id
                  WHERE block.section_id = section.id_content_section
                    AND block.is_visible
                    AND ${ELIGIBLE_BLOCK}
              )
            ORDER BY section.position, section.id_content_section;
        `, [versionId]);
        if (!sections.length) return [];
        const sectionIds = sections.map((section) => section.id_content_section);
        const { rows: blocks } = await pool.query(`
            SELECT
                block.id_content_block,
                block.section_id,
                block.position,
                block.data,
                block.settings,
                block.css_class,
                block.schema_version,
                type.code AS type_code,
                type.name AS type_name
            FROM content_block block
            INNER JOIN block_type type
                ON type.id_block_type = block.block_type_id
            WHERE block.section_id = ANY($1::BIGINT[])
              AND block.is_visible
              AND ${ELIGIBLE_BLOCK}
            ORDER BY block.section_id, block.position, block.id_content_block;
        `, [sectionIds]);
        const bySection = new Map();
        blocks.forEach((block) => {
            const sectionId = Number(block.section_id);
            if (!bySection.has(sectionId)) bySection.set(sectionId, []);
            bySection.get(sectionId).push(block);
        });
        return sections.map((section) => ({
            ...section,
            blocks: bySection.get(Number(section.id_content_section)) ?? []
        }));
    }

    async findRelations(versionId) {
        const [categories, signals, trends, alerts] = await Promise.all([
            pool.query(`
                SELECT category.id_category AS id, category.name,
                    fcv.code AS fcv_code, fcv.name AS fcv_name
                FROM content_version_category relation
                INNER JOIN categories category
                    ON category.id_category = relation.category_id
                INNER JOIN fcv ON fcv.id_fcv = category.id_fcv
                WHERE relation.content_version_id = $1
                ORDER BY category.name;
            `, [versionId]),
            pool.query(`
                SELECT signal.id_signal AS id, signal.business_code, signal.title
                FROM content_version_signal relation
                INNER JOIN signals signal ON signal.id_signal = relation.signal_id
                INNER JOIN signal_statuses status
                    ON status.id_signal_status = signal.id_signal_status
                WHERE relation.content_version_id = $1
                  AND status.code = 'VALIDATED'
                ORDER BY signal.title;
            `, [versionId]),
            pool.query(`
                SELECT trend.id_trend AS id, trend.business_code, trend.title
                FROM content_version_trend relation
                INNER JOIN trends trend ON trend.id_trend = relation.trend_id
                INNER JOIN trend_statuses status
                    ON status.id_trend_status = trend.id_trend_status
                WHERE relation.content_version_id = $1
                  AND status.code = 'ACTIVE'
                ORDER BY trend.title;
            `, [versionId]),
            pool.query(`
                SELECT alert.id_alert AS id, alert.business_code, alert.title
                FROM content_version_alert relation
                INNER JOIN alerts alert ON alert.id_alert = relation.alert_id
                INNER JOIN alert_statuses status
                    ON status.id_alert_status = alert.id_alert_status
                WHERE relation.content_version_id = $1
                  AND status.code IN ('PUBLISHED', 'CLOSED')
                ORDER BY alert.title;
            `, [versionId])
        ]);
        return {
            categories: categories.rows,
            signals: signals.rows,
            trends: trends.rows,
            alerts: alerts.rows
        };
    }
}

module.exports = new PublicContentRepository();
