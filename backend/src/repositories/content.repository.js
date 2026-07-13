const pool = require("../config/database");

const SORT_COLUMNS = Object.freeze({
    title: "cv.title",
    createdAt: "c.created_at",
    updatedAt: "c.updated_at",
    publishedAt: "published_version.published_at"
});

const CONTENT_FIELDS = `
    c.id_content,
    c.slug,
    c.author_id,
    author.first_name || ' ' || author.last_name AS author,
    type.code AS type_code,
    type.name AS type,
    status.code AS status_code,
    status.name AS status,
    c.current_version_id,
    c.published_version_id,
    cv.version_number AS current_version_number,
    cv.title,
    cv.summary,
    cv.featured_media_id,
    media.filename AS featured_media_filename,
    media.mime_type AS featured_media_mime_type,
    cv.created_by AS version_created_by,
    version_author.first_name || ' ' || version_author.last_name
        AS version_created_by_name,
    cv.created_at AS version_created_at,
    cv.change_summary,
    c.approved_by,
    approver.first_name || ' ' || approver.last_name AS approver,
    c.approved_at,
    published_version.published_by,
    publisher.first_name || ' ' || publisher.last_name AS publisher,
    published_version.published_at,
    c.archived_by,
    archiver.first_name || ' ' || archiver.last_name AS archiver,
    c.archived_at,
    c.created_at,
    c.updated_at,
    (SELECT COUNT(*) FROM content_version version
        WHERE version.content_id = c.id_content)::INTEGER AS version_count,
    (SELECT COUNT(*) FROM content_section section
        WHERE section.content_version_id = c.current_version_id)::INTEGER
        AS section_count,
    (SELECT COUNT(*) FROM content_block block
        INNER JOIN content_section section
            ON section.id_content_section = block.section_id
        WHERE section.content_version_id = c.current_version_id)::INTEGER
        AS block_count
`;

const CONTENT_FROM = `
    FROM content c
    INNER JOIN content_types type
        ON type.id_content_type = c.content_type_id
    INNER JOIN content_statuses status
        ON status.id_content_status = c.status_id
    INNER JOIN users author ON author.id_user = c.author_id
    LEFT JOIN content_version cv
        ON cv.id_content_version = c.current_version_id
    LEFT JOIN content_version published_version
        ON published_version.id_content_version = c.published_version_id
    LEFT JOIN media ON media.id_media = cv.featured_media_id
    LEFT JOIN users version_author ON version_author.id_user = cv.created_by
    LEFT JOIN users approver ON approver.id_user = c.approved_by
    LEFT JOIN users publisher
        ON publisher.id_user = published_version.published_by
    LEFT JOIN users archiver ON archiver.id_user = c.archived_by
`;

function applicationError(code, message) {
    const error = new Error(message);
    error.applicationCode = code;
    return error;
}

class ContentRepository {
    buildFilters(filters) {
        const values = [];
        const conditions = [];
        const add = (value, column) => {
            values.push(value);
            conditions.push(`${column} = $${values.length}`);
        };
        if (filters.status !== undefined) add(filters.status, "status.code");
        if (filters.type !== undefined) add(filters.type, "type.code");
        if (filters.authorId !== undefined) add(filters.authorId, "c.author_id");
        if (filters.search !== undefined) {
            values.push(filters.search);
            const value = `$${values.length}`;
            conditions.push(`(
                c.slug ILIKE '%' || ${value} || '%'
                OR cv.title ILIKE '%' || ${value} || '%'
                OR COALESCE(cv.summary, '') ILIKE '%' || ${value} || '%'
            )`);
        }
        return {
            values,
            where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
        };
    }

    async findAll(filters, pagination) {
        const { values, where } = this.buildFilters(filters);
        const sort = SORT_COLUMNS[filters.sortField] ?? SORT_COLUMNS.updatedAt;
        const direction = filters.sortDirection === "ASC" ? "ASC" : "DESC";
        values.push(pagination.limit);
        const limit = `$${values.length}`;
        values.push(pagination.offset);
        const offset = `$${values.length}`;
        const { rows } = await pool.query(`
            SELECT ${CONTENT_FIELDS}, COUNT(*) OVER()::BIGINT AS total_count
            ${CONTENT_FROM}
            ${where}
            ORDER BY ${sort} ${direction} NULLS LAST, c.id_content DESC
            LIMIT ${limit} OFFSET ${offset};
        `, values);
        return {
            rows,
            totalItems: rows.length ? Number(rows[0].total_count) : 0
        };
    }

    async findById(id) {
        const { rows } = await pool.query(`
            SELECT ${CONTENT_FIELDS}
            ${CONTENT_FROM}
            WHERE c.id_content = $1
            LIMIT 1;
        `, [id]);
        return rows[0] ?? null;
    }

    async findVersions(contentId) {
        const { rows } = await pool.query(`
            SELECT
                version.id_content_version,
                version.version_number,
                version.title,
                version.summary,
                version.featured_media_id,
                version.change_summary,
                version.created_by,
                creator.first_name || ' ' || creator.last_name AS creator,
                version.created_at,
                version.approved_by,
                approver.first_name || ' ' || approver.last_name AS approver,
                version.approved_at,
                version.published_by,
                publisher.first_name || ' ' || publisher.last_name AS publisher,
                version.published_at,
                version.id_content_version = content.current_version_id AS is_current,
                version.id_content_version = content.published_version_id AS is_published,
                (SELECT COUNT(*) FROM content_section section
                    WHERE section.content_version_id = version.id_content_version)::INTEGER
                    AS section_count,
                (SELECT COUNT(*) FROM content_block block
                    INNER JOIN content_section section
                        ON section.id_content_section = block.section_id
                    WHERE section.content_version_id = version.id_content_version)::INTEGER
                    AS block_count
            FROM content_version version
            INNER JOIN content ON content.id_content = version.content_id
            INNER JOIN users creator ON creator.id_user = version.created_by
            LEFT JOIN users approver ON approver.id_user = version.approved_by
            LEFT JOIN users publisher ON publisher.id_user = version.published_by
            WHERE version.content_id = $1
            ORDER BY version.version_number DESC, version.id_content_version DESC;
        `, [contentId]);
        return rows;
    }

    async findVersion(contentId, versionId) {
        const { rows } = await pool.query(`
            SELECT
                version.*,
                creator.first_name || ' ' || creator.last_name AS creator,
                approver.first_name || ' ' || approver.last_name AS approver,
                publisher.first_name || ' ' || publisher.last_name AS publisher,
                version.id_content_version = content.current_version_id AS is_current,
                version.id_content_version = content.published_version_id AS is_published
            FROM content_version version
            INNER JOIN content ON content.id_content = version.content_id
            INNER JOIN users creator ON creator.id_user = version.created_by
            LEFT JOIN users approver ON approver.id_user = version.approved_by
            LEFT JOIN users publisher ON publisher.id_user = version.published_by
            WHERE version.content_id = $1 AND version.id_content_version = $2
            LIMIT 1;
        `, [contentId, versionId]);
        if (!rows[0]) return null;

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
                type.code AS type_code,
                type.name AS type,
                section.position,
                section.is_collapsible,
                section.is_visible,
                section.settings
            FROM content_section section
            LEFT JOIN section_types type
                ON type.id_section_type = section.section_type_id
            WHERE section.content_version_id = $1
            ORDER BY section.position, section.id_content_section;
        `, [versionId]);
        if (!sections.length) return [];
        const sectionIds = sections.map((section) => section.id_content_section);
        const { rows: blocks } = await pool.query(`
            SELECT
                block.id_content_block,
                block.section_id,
                type.code AS type_code,
                type.name AS type,
                block.schema_version,
                block.position,
                block.data,
                block.settings,
                block.is_visible,
                block.css_class,
                block.created_at,
                block.updated_at
            FROM content_block block
            INNER JOIN block_type type
                ON type.id_block_type = block.block_type_id
            WHERE block.section_id = ANY($1::BIGINT[])
            ORDER BY block.section_id, block.position, block.id_content_block;
        `, [sectionIds]);
        const bySection = new Map();
        blocks.forEach((block) => {
            const key = Number(block.section_id);
            if (!bySection.has(key)) bySection.set(key, []);
            bySection.get(key).push(block);
        });
        return sections.map((section) => ({
            ...section,
            blocks: bySection.get(Number(section.id_content_section)) ?? []
        }));
    }

    async findRelations(versionId) {
        const queries = [
            pool.query(`SELECT category.id_category AS id, category.name,
                fcv.code AS fcv_code, fcv.name AS fcv
                FROM content_version_category relation
                INNER JOIN categories category ON category.id_category = relation.category_id
                INNER JOIN fcv ON fcv.id_fcv = category.id_fcv
                WHERE relation.content_version_id = $1 ORDER BY category.name;`, [versionId]),
            pool.query(`SELECT signal.id_signal AS id, signal.business_code,
                signal.title, status.code AS status_code, status.name AS status
                FROM content_version_signal relation
                INNER JOIN signals signal ON signal.id_signal = relation.signal_id
                INNER JOIN signal_statuses status
                    ON status.id_signal_status = signal.id_signal_status
                WHERE relation.content_version_id = $1 ORDER BY signal.title;`, [versionId]),
            pool.query(`SELECT trend.id_trend AS id, trend.business_code,
                trend.title, status.code AS status_code, status.name AS status
                FROM content_version_trend relation
                INNER JOIN trends trend ON trend.id_trend = relation.trend_id
                INNER JOIN trend_statuses status
                    ON status.id_trend_status = trend.id_trend_status
                WHERE relation.content_version_id = $1 ORDER BY trend.title;`, [versionId]),
            pool.query(`SELECT alert.id_alert AS id, alert.business_code,
                alert.title, status.code AS status_code, status.name AS status
                FROM content_version_alert relation
                INNER JOIN alerts alert ON alert.id_alert = relation.alert_id
                INNER JOIN alert_statuses status
                    ON status.id_alert_status = alert.id_alert_status
                WHERE relation.content_version_id = $1 ORDER BY alert.title;`, [versionId])
        ];
        const [categories, signals, trends, alerts] = await Promise.all(queries);
        return {
            categories: categories.rows,
            signals: signals.rows,
            trends: trends.rows,
            alerts: alerts.rows
        };
    }

    async findHistory(contentId) {
        const { rows } = await pool.query(`
            SELECT
                history.id_content_status_history,
                history.content_version_id,
                version.version_number,
                previous.code AS from_status_code,
                previous.name AS from_status,
                current.code AS to_status_code,
                current.name AS to_status,
                history.transition_code,
                history.changed_by,
                actor.first_name || ' ' || actor.last_name AS actor,
                history.notes,
                history.changed_at
            FROM content_status_history history
            LEFT JOIN content_version version
                ON version.id_content_version = history.content_version_id
            LEFT JOIN content_statuses previous
                ON previous.id_content_status = history.from_status_id
            INNER JOIN content_statuses current
                ON current.id_content_status = history.to_status_id
            INNER JOIN users actor ON actor.id_user = history.changed_by
            WHERE history.content_id = $1
            ORDER BY history.changed_at, history.id_content_status_history;
        `, [contentId]);
        return rows;
    }

    async findTemplates(typeCode = null) {
        const values = [];
        const where = typeCode === null
            ? "WHERE template.active"
            : "WHERE template.active AND type.code = $1";
        if (typeCode !== null) values.push(typeCode);
        const { rows } = await pool.query(`
            SELECT
                template.id_template,
                template.name,
                template.description,
                type.code AS type_code,
                type.name AS type,
                (SELECT COUNT(*) FROM template_sections section
                    WHERE section.template_id = template.id_template)::INTEGER
                    AS section_count
            FROM content_templates template
            INNER JOIN content_types type
                ON type.id_content_type = template.content_type_id
            ${where}
            ORDER BY type.name, template.name, template.id_template;
        `, values);
        return rows;
    }

    async findTemplateById(id) {
        const { rows } = await pool.query(`
            SELECT template.*, type.code AS type_code, type.name AS type
            FROM content_templates template
            INNER JOIN content_types type
                ON type.id_content_type = template.content_type_id
            WHERE template.id_template = $1 AND template.active
            LIMIT 1;
        `, [id]);
        if (!rows[0]) return null;
        const { rows: sections } = await pool.query(`
            SELECT
                section.id_template_section,
                section.title,
                section.position,
                section.required,
                section.repeatable,
                type.code AS type_code,
                type.name AS type
            FROM template_sections section
            LEFT JOIN section_types type
                ON type.id_section_type = section.section_type_id
            WHERE section.template_id = $1
            ORDER BY section.position, section.id_template_section;
        `, [id]);
        const sectionIds = sections.map((section) => section.id_template_section);
        let blocks = [];
        if (sectionIds.length) {
            const result = await pool.query(`
                SELECT
                    block.id_template_block,
                    block.template_section_id,
                    block.position,
                    block.placeholder,
                    block.required,
                    block.default_data,
                    type.code AS type_code,
                    type.name AS type,
                    type.schema_version,
                    type.active
                FROM template_blocks block
                INNER JOIN block_type type
                    ON type.id_block_type = block.block_type_id
                WHERE block.template_section_id = ANY($1::INTEGER[])
                ORDER BY block.template_section_id, block.position,
                    block.id_template_block;
            `, [sectionIds]);
            blocks = result.rows;
        }
        return {
            ...rows[0],
            sections: sections.map((section) => ({
                ...section,
                blocks: blocks.filter((block) =>
                    block.template_section_id === section.id_template_section)
            }))
        };
    }

    async create(input, authorId, composition = null) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const { rows } = await client.query(`
                SELECT created_content_id, created_version_id
                FROM sp_create_content_v2($1,$2,$3,$4,$5,$6);
            `, [
                input.typeCode, authorId, input.title, input.summary ?? null,
                input.slug ?? null, input.featuredMediaId ?? null
            ]);
            const result = {
                contentId: Number(rows[0].created_content_id),
                versionId: Number(rows[0].created_version_id)
            };
            if (composition) {
                await this.replaceCompositionWithClient(
                    client, result.contentId, result.versionId, composition, null
                );
            }
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async updateMetadata(id, input) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const state = await this.lockEditableContent(client, id, null, input.updatedAt);
            const versionSetters = [];
            const versionValues = [];
            const addVersion = (column, value) => {
                versionValues.push(value);
                versionSetters.push(`${column} = $${versionValues.length}`);
            };
            for (const [field, column] of Object.entries({
                title: "title", summary: "summary", featuredMediaId: "featured_media_id"
            })) {
                if (Object.hasOwn(input, field)) addVersion(column, input[field]);
            }
            if (versionSetters.length) {
                versionValues.push(state.current_version_id);
                await client.query(`UPDATE content_version
                    SET ${versionSetters.join(", ")}
                    WHERE id_content_version = $${versionValues.length};`, versionValues);
            }

            const contentSetters = [];
            const contentValues = [];
            const addContent = (expression, value) => {
                contentValues.push(value);
                contentSetters.push(`${expression} $${contentValues.length}`);
            };
            if (Object.hasOwn(input, "typeCode")) {
                addContent("content_type_id = get_catalog_id('content_types',", input.typeCode);
                contentSetters[contentSetters.length - 1] += ")";
            }
            if (Object.hasOwn(input, "slug")) addContent("slug =", input.slug);
            if (Object.hasOwn(input, "title")) addContent("title =", input.title);
            if (Object.hasOwn(input, "summary")) addContent("summary =", input.summary);
            if (Object.hasOwn(input, "featuredMediaId")) {
                addContent("featured_media_id =", input.featuredMediaId);
            }
            contentSetters.push("updated_at = CURRENT_TIMESTAMP");
            contentValues.push(id);
            await client.query(`UPDATE content SET ${contentSetters.join(", ")}
                WHERE id_content = $${contentValues.length};`, contentValues);
            await client.query("COMMIT");
            return true;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async createVersion(contentId, actorId, changeSummary) {
        const { rows } = await pool.query(
            "SELECT sp_create_content_version($1,$2,$3) AS id_content_version;",
            [contentId, actorId, changeSummary]
        );
        return Number(rows[0].id_content_version);
    }

    async replaceComposition(contentId, versionId, composition) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await this.replaceCompositionWithClient(
                client, contentId, versionId, composition, composition.updatedAt
            );
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async replaceCompositionWithClient(
        client, contentId, versionId, composition, updatedAt
    ) {
        await this.lockEditableContent(client, contentId, versionId, updatedAt);
        await client.query(
            "DELETE FROM content_version_category WHERE content_version_id = $1;",
            [versionId]
        );
        await client.query(
            "DELETE FROM content_version_signal WHERE content_version_id = $1;",
            [versionId]
        );
        await client.query(
            "DELETE FROM content_version_trend WHERE content_version_id = $1;",
            [versionId]
        );
        await client.query(
            "DELETE FROM content_version_alert WHERE content_version_id = $1;",
            [versionId]
        );
        await client.query(
            "DELETE FROM content_section WHERE content_version_id = $1;",
            [versionId]
        );

        for (let sectionIndex = 0; sectionIndex < composition.sections.length; sectionIndex += 1) {
            const section = composition.sections[sectionIndex];
            const { rows } = await client.query(`
                INSERT INTO content_section (
                    content_version_id, title, section_type_id, position,
                    is_collapsible, is_visible, settings
                ) VALUES (
                    $1, $2, get_catalog_id('section_types', $3), $4, $5, $6, $7
                ) RETURNING id_content_section;
            `, [
                versionId, section.title ?? null, section.typeCode,
                sectionIndex + 1, section.isCollapsible, section.isVisible,
                section.settings
            ]);
            const sectionId = rows[0].id_content_section;
            for (let blockIndex = 0; blockIndex < section.blocks.length; blockIndex += 1) {
                const block = section.blocks[blockIndex];
                const inserted = await client.query(`
                    INSERT INTO content_block (
                        section_id, block_type_id, position, data, settings,
                        is_visible, css_class, schema_version
                    )
                    SELECT $1, type.id_block_type, $2, $3, $4, $5, $6, $7
                    FROM block_type type
                    WHERE type.code = $8 AND type.active
                      AND type.schema_version = $7
                    RETURNING id_content_block;
                `, [
                    sectionId, blockIndex + 1, block.data, block.settings,
                    block.isVisible, block.cssClass ?? null,
                    block.schemaVersion, block.type
                ]);
                if (!inserted.rowCount) {
                    throw applicationError(
                        "DOMAIN_RULE", `El bloque ${block.type} no está habilitado.`
                    );
                }
            }
        }

        const relationTables = {
            categoryIds: ["content_version_category", "category_id"],
            signalIds: ["content_version_signal", "signal_id"],
            trendIds: ["content_version_trend", "trend_id"],
            alertIds: ["content_version_alert", "alert_id"]
        };
        for (const [field, [table, column]] of Object.entries(relationTables)) {
            for (const relationId of composition.relations[field]) {
                await client.query(
                    `INSERT INTO ${table} (content_version_id, ${column})
                     VALUES ($1,$2);`,
                    [versionId, relationId]
                );
            }
        }
        await client.query(
            "UPDATE content SET updated_at = CURRENT_TIMESTAMP WHERE id_content = $1;",
            [contentId]
        );
    }

    async lockEditableContent(client, contentId, versionId, updatedAt) {
        const { rows } = await client.query(`
            SELECT
                content.current_version_id,
                status.code AS status_code,
                content.updated_at,
                ($3::TIMESTAMP IS NULL OR
                    date_trunc('milliseconds', content.updated_at) =
                    date_trunc('milliseconds', $3::TIMESTAMP)) AS version_matches
            FROM content
            INNER JOIN content_statuses status
                ON status.id_content_status = content.status_id
            WHERE content.id_content = $1
              AND ($2::BIGINT IS NULL OR content.current_version_id = $2)
            FOR UPDATE OF content;
        `, [contentId, versionId, updatedAt ?? null]);
        if (!rows[0]) {
            throw applicationError("NOT_FOUND", "El contenido o la versión no existe.");
        }
        if (!rows[0].version_matches) {
            throw applicationError("CONCURRENT", "El contenido fue modificado por otra operación.");
        }
        if (rows[0].status_code !== "DRAFT") {
            throw applicationError("DOMAIN_RULE", "Solo puede editarse contenido DRAFT.");
        }
        return rows[0];
    }

    async transition(contentId, transition, actorId, notes) {
        await pool.query("SELECT sp_transition_content($1,$2,$3,$4);", [
            contentId, transition, actorId, notes ?? null
        ]);
    }

    async findExistingMediaIds(ids) {
        if (!ids.length) return [];
        const { rows } = await pool.query(
            "SELECT id_media FROM media WHERE id_media = ANY($1::BIGINT[]);",
            [ids]
        );
        return rows.map((row) => Number(row.id_media));
    }
}

module.exports = new ContentRepository();
