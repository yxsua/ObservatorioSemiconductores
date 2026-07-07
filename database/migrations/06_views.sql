-- VISTAS DE CATALOGOS
CREATE VIEW vw_source_types AS
SELECT
    id_source_type,
    code,
    name,
    description
FROM
    source_types;

CREATE VIEW vw_categories AS
SELECT
    c.id_category,
    c.name,
    c.description,
    c.active,
    f.id_fcv,
    f.code AS fcv_code,
    f.name AS fcv,
    p.id_category AS parent_category_id,
    p.name AS parent_category
FROM
    categories c
    INNER JOIN fcv f ON f.id_fcv = c.id_fcv
    LEFT JOIN categories p ON p.id_category = c.parent_category_id;

CREATE VIEW vw_fcv AS
SELECT
    id_fcv,
    code,
    name,
    description,
    active
FROM
    fcv;

CREATE VIEW vw_block_types AS
SELECT
    id_block_type,
    code,
    name,
    icon,
    description,
    supports_children,
    schema
FROM
    block_type;

CREATE VIEW vw_signal_types AS
SELECT
    id_signal_type,
    code,
    name,
    description
FROM
    signal_types;

CREATE VIEW vw_impacts AS
SELECT
    id_impact,
    code,
    name,
    weight
FROM
    impacts;

CREATE VIEW vw_urgencies AS
SELECT
    id_urgency,
    code,
    name,
    weight
FROM
    urgencies;

CREATE VIEW vw_scopes AS
SELECT
    id_scope,
    code,
    name
FROM
    scopes;

CREATE VIEW vw_signal_statuses AS
SELECT
    id_signal_status,
    code,
    name,
    description
FROM
    signal_statuses;

CREATE VIEW vw_trend_maturity AS
SELECT
    id_trend_maturity,
    code,
    name,
    description
FROM
    trend_maturity;

CREATE VIEW vw_trend_statuses AS
SELECT
    id_trend_status,
    code,
    name
FROM
    trend_statuses;

CREATE VIEW vw_trend_directions AS
SELECT
    id_trend_direction,
    code,
    name
FROM
    trend_directions;

CREATE VIEW vw_alert_levels AS
SELECT
    id_alert_level,
    code,
    name,
    color
FROM
    alert_levels;

CREATE VIEW vw_alert_statuses AS
SELECT
    id_alert_status,
    code,
    name
FROM
    alert_statuses;

CREATE VIEW vw_alert_origins AS
SELECT
    id_alert_origin,
    code,
    name
FROM
    alert_origins;

CREATE VIEW vw_audiences AS
SELECT
    id_audience,
    code,
    name
FROM
    audiences;

CREATE VIEW vw_content_types AS
SELECT
    id_content_type,
    code,
    name
FROM
    content_types;

CREATE VIEW vw_content_statuses AS
SELECT
    id_content_status,
    code,
    name
FROM
    content_statuses;

CREATE VIEW vw_file_types AS
SELECT
    id_file_type,
    code,
    name
FROM
    file_types;

CREATE VIEW vw_actor_types AS
SELECT
    id_actor_type,
    code,
    name
FROM
    actor_types;

CREATE VIEW vw_content_relation_types AS
SELECT
    id_content_relation_type,
    code,
    name,
    description
FROM
    content_relation_types;

CREATE VIEW vw_section_types AS
SELECT
    id_section_type,
    code,
    name
FROM
    section_types;

-- VISTAS DE USUARIOS
CREATE VIEW vw_users AS
SELECT
    u.id_user,
    u.first_name,
    u.last_name,
    u.first_name || ' ' || u.last_name AS full_name,
    u.email,
    u.occupation,
    u.active,
    u.last_login,
    u.created_at,
    COUNT(ur.id_role) total_roles
FROM
    users u
    LEFT JOIN user_roles ur ON ur.id_user = u.id_user
GROUP BY
    u.id_user,
    u.first_name,
    u.last_name,
    u.email,
    u.occupation,
    u.active,
    u.last_login,
    u.created_at;

CREATE VIEW vw_user_roles AS
SELECT
    u.id_user,
    u.email,
    r.id_role,
    r.name,
    r.description
FROM
    users u
    INNER JOIN user_roles ur ON ur.id_user = u.id_user
    INNER JOIN roles r ON r.id_role = ur.id_role;

CREATE VIEW vw_role_permissions AS
SELECT
    r.id_role,
    r.name AS role_name,
    p.id_permission,
    p.code AS permission_code,
    p.description AS permission_description
FROM
    roles r
    INNER JOIN role_permissions rp ON rp.id_role = r.id_role
    INNER JOIN permissions p ON p.id_permission = rp.id_permission;

CREATE VIEW vw_user_permissions AS
SELECT
    u.id_user,
    u.email,
    p.id_permission,
    p.code AS permission_code,
    p.description AS permission_description
FROM
    users u
    INNER JOIN user_roles ur ON ur.id_user = u.id_user
    INNER JOIN role_permissions rp ON rp.id_role = ur.id_role
    INNER JOIN permissions p ON p.id_permission = rp.id_permission;

CREATE VIEW vw_roles AS
SELECT
    id_role,
    name,
    description,
    COUNT(ur.id_user) AS total_users
FROM
    roles r
    LEFT JOIN user_roles ur ON ur.id_role = r.id_role
GROUP BY
    r.id_role,
    r.name,
    r.description;

-- VISTAS DE VIGILANCIA
CREATE
OR REPLACE VIEW vw_sources AS
SELECT
    s.id_source,
    st.code AS source_type_code,
    st.name AS source_type,
    s.name,
    s.website,
    s.country,
    s.rss_url,
    s.api_url,
    s.reliability,
    s.active,
    s.created_at,
    s.updated_at
FROM
    sources s
    INNER JOIN source_types st ON st.id_source_type = s.id_source_type;

CREATE
OR REPLACE VIEW vw_keywords AS
SELECT
    id_keyword,
    name
FROM
    keywords;

CREATE VIEW vw_actors AS
SELECT
    a.id_actor,
    at.code,
    at.name AS actor_type,
    a.name,
    a.country,
    a.website,
    a.description,
    a.created_at
FROM
    actors a
    LEFT JOIN actor_types at ON at.id_actor_type = a.id_actor_type;

CREATE VIEW vw_signals AS
SELECT
    sig.id_signal,
    sig.business_code,
    sig.title,
    sig.summary,
    sig.publication_date,
    sig.capture_date,
    sig.evidence_url,
    sig.ips,
    cat.id_category,
    cat.name category,
    fcv.code fcv_code,
    fcv.name fcv,
    src.id_source,
    src.name source,
    st.code signal_type_code,
    st.name signal_type,
    imp.code impact_code,
    imp.name impact,
    urg.code urgency_code,
    urg.name urgency,
    scp.code scope_code,
    scp.name scope,
    ss.code status_code,
    ss.name status,
    analyst.id_user analyst_id,
    analyst.first_name || ' ' || analyst.last_name analyst,
    validator.id_user validator_id,
    validator.first_name || ' ' || validator.last_name validator,
    sig.validation_date,
    sig.notes,
    sig.created_at,
    sig.updated_at
FROM
    signals sig
    INNER JOIN categories cat ON cat.id_category = sig.id_category
    INNER JOIN fcv ON fcv.id_fcv = cat.id_fcv
    INNER JOIN sources src ON src.id_source = sig.id_source
    INNER JOIN signal_types st ON st.id_signal_type = sig.id_signal_type
    INNER JOIN impacts imp ON imp.id_impact = sig.id_impact
    INNER JOIN urgencies urg ON urg.id_urgency = sig.id_urgency
    INNER JOIN scopes scp ON scp.id_scope = sig.id_scope
    INNER JOIN signal_statuses ss ON ss.id_signal_status = sig.id_signal_status
    INNER JOIN users analyst ON analyst.id_user = sig.id_analyst
    LEFT JOIN users validator ON validator.id_user = sig.id_validator;

CREATE
OR REPLACE VIEW vw_signal_keywords AS
SELECT
    sk.id_signal,
    k.id_keyword,
    k.name AS keyword
FROM
    signal_keywords sk
    INNER JOIN keywords k ON k.id_keyword = sk.id_keyword;

CREATE
OR REPLACE VIEW vw_signal_search AS
SELECT
    sig.id_signal,
    sig.business_code,
    sig.title,
    cat.name AS category,
    fcv.name AS fcv,
    imp.name AS impact,
    urg.name AS urgency,
    ss.name AS status,
    analyst.first_name || ' ' || analyst.last_name AS analyst,
    sig.publication_date,
    sig.capture_date,
    sig.ips
FROM
    signals sig
    INNER JOIN categories cat ON cat.id_category = sig.id_category
    INNER JOIN fcv ON fcv.id_fcv = cat.id_fcv
    INNER JOIN impacts imp ON imp.id_impact = sig.id_impact
    INNER JOIN urgencies urg ON urg.id_urgency = sig.id_urgency
    INNER JOIN signal_statuses ss ON ss.id_signal_status = sig.id_signal_status
    INNER JOIN users analyst ON analyst.id_user = sig.id_analyst;

CREATE
OR REPLACE VIEW vw_trends AS
SELECT
    t.id_trend,
    t.business_code,
    t.title,
    t.narrative,
    t.implications,
    t.first_signal_date,
    td.code AS direction_code,
    td.name AS direction,
    tm.code AS maturity_code,
    tm.name AS maturity,
    ts.code AS status_code,
    ts.name AS status,
    u.id_user AS analyst_id,
    u.first_name || ' ' || u.last_name AS analyst,
    COUNT(DISTINCT st.id_signal) AS total_signals,
    COUNT(DISTINCT ta.id_actor) AS total_actors,
    t.created_at,
    t.updated_at
FROM
    trends t
    LEFT JOIN trend_directions td ON td.id_trend_direction = t.id_trend_direction
    LEFT JOIN trend_maturity tm ON tm.id_trend_maturity = t.id_trend_maturity
    LEFT JOIN trend_statuses ts ON ts.id_trend_status = t.id_trend_status
    LEFT JOIN users u ON u.id_user = t.id_analyst
    LEFT JOIN signal_trends st ON st.id_trend = t.id_trend
    LEFT JOIN trend_actors ta ON ta.id_trend = t.id_trend
GROUP BY
    t.id_trend,
    td.code,
    td.name,
    tm.code,
    tm.name,
    ts.code,
    ts.name,
    u.id_user,
    u.first_name,
    u.last_name;

CREATE
OR REPLACE VIEW vw_trend_search AS
SELECT
    id_trend,
    business_code,
    title,
    direction,
    maturity,
    status,
    analyst,
    total_signals,
    total_actors
FROM
    vw_trends;

CREATE
OR REPLACE VIEW vw_trend_signals AS
SELECT
    st.id_trend,
    s.id_signal,
    s.business_code,
    s.title,
    ss.name AS status,
    imp.name AS impact,
    urg.name AS urgency,
    s.ips
FROM
    signal_trends st
    INNER JOIN signals s ON s.id_signal = st.id_signal
    INNER JOIN signal_statuses ss ON ss.id_signal_status = s.id_signal_status
    INNER JOIN impacts imp ON imp.id_impact = s.id_impact
    INNER JOIN urgencies urg ON urg.id_urgency = s.id_urgency;

CREATE
OR REPLACE VIEW vw_trend_actors AS
SELECT
    ta.id_trend,
    a.id_actor,
    a.name,
    at.name AS actor_type,
    a.country,
    a.website
FROM
    trend_actors ta
    INNER JOIN actors a ON a.id_actor = ta.id_actor
    LEFT JOIN actor_types at ON at.id_actor_type = a.id_actor_type;

CREATE
OR REPLACE VIEW vw_alerts AS
SELECT
    a.id_alert,
    a.business_code,
    a.title,
    a.executive_summary,
    a.implications,
    a.recommendations,
    a.generation_date,
    a.response_deadline,
    al.code AS level_code,
    al.name AS level,
    ast.code AS status_code,
    ast.name AS status,
    ao.code AS origin_code,
    ao.name AS origin,
    creator.id_user AS creator_id,
    creator.first_name || ' ' || creator.last_name AS creator,
    validator.id_user AS validator_id,
    validator.first_name || ' ' || validator.last_name AS validator,
    a.validation_date,
    COUNT(DISTINCT als.id_signal) AS total_signals,
    COUNT(DISTINCT alt.id_trend) AS total_trends,
    COUNT(DISTINCT aa.id_audience) AS total_audiences,
    a.created_at,
    a.updated_at
FROM
    alerts a
    LEFT JOIN alert_levels al ON al.id_alert_level = a.id_alert_level
    LEFT JOIN alert_statuses ast ON ast.id_alert_status = a.id_alert_status
    LEFT JOIN alert_origins ao ON ao.id_alert_origin = a.id_alert_origin
    LEFT JOIN users creator ON creator.id_user = a.id_creator
    LEFT JOIN users validator ON validator.id_user = a.id_validator
    LEFT JOIN alert_signals als ON als.id_alert = a.id_alert
    LEFT JOIN alert_trends alt ON alt.id_alert = a.id_alert
    LEFT JOIN alert_audiences aa ON aa.id_alert = a.id_alert
GROUP BY
    a.id_alert,
    al.code,
    al.name,
    ast.code,
    ast.name,
    ao.code,
    ao.name,
    creator.id_user,
    creator.first_name,
    creator.last_name,
    validator.id_user,
    validator.first_name,
    validator.last_name;

CREATE
OR REPLACE VIEW vw_alert_search AS
SELECT
    id_alert,
    business_code,
    title,
    level,
    status,
    origin,
    generation_date,
    creator,
    validation_date,
    total_signals,
    total_trends
FROM
    vw_alerts;

CREATE
OR REPLACE VIEW vw_alert_signals AS
SELECT
    als.id_alert,
    s.id_signal,
    s.business_code,
    s.title,
    ss.name AS status,
    s.ips
FROM
    alert_signals als
    INNER JOIN signals s ON s.id_signal = als.id_signal
    INNER JOIN signal_statuses ss ON ss.id_signal_status = s.id_signal_status;

CREATE
OR REPLACE VIEW vw_alert_trends AS
SELECT
    at.id_alert,
    t.id_trend,
    t.business_code,
    t.title,
    tm.name AS maturity,
    ts.name AS status
FROM
    alert_trends at
    INNER JOIN trends t ON t.id_trend = at.id_trend
    LEFT JOIN trend_maturity tm ON tm.id_trend_maturity = t.id_trend_maturity
    LEFT JOIN trend_statuses ts ON ts.id_trend_status = t.id_trend_status;

CREATE
OR REPLACE VIEW vw_alert_audiences AS
SELECT
    aa.id_alert,
    aud.id_audience,
    aud.code,
    aud.name
FROM
    alert_audiences aa
    INNER JOIN audiences aud ON aud.id_audience = aa.id_audience;

CREATE
OR REPLACE VIEW vw_signal_detail AS
SELECT
    sig.id_signal,
    sig.business_code,
    sig.title,
    sig.summary,
    sig.publication_date,
    sig.capture_date,
    sig.evidence_url,
    sig.ips,
    cat.id_category,
    cat.code AS category_code,
    cat.name AS category,
    fcv.id_fcv,
    fcv.code AS fcv_code,
    fcv.name AS fcv,
    src.id_source,
    src.name AS source,
    src.website,
    st.code AS signal_type_code,
    st.name AS signal_type,
    imp.code AS impact_code,
    imp.name AS impact,
    urg.code AS urgency_code,
    urg.name AS urgency,
    scp.code AS scope_code,
    scp.name AS scope,
    ss.code AS status_code,
    ss.name AS status,
    analyst.id_user,
    analyst.first_name,
    analyst.last_name,
    validator.id_user AS validator_id,
    validator.first_name AS validator_first_name,
    validator.last_name AS validator_last_name,
    sig.validation_date,
    sig.notes,
    sig.created_at,
    sig.updated_at,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object('id', k.id_keyword, 'name', k.name)
                    ORDER BY
                        k.name
                )
            FROM
                signal_keywords sk
                JOIN keywords k ON k.id_keyword = sk.id_keyword
            WHERE
                sk.id_signal = sig.id_signal
        ),
        '[]' :: json
    ) AS keywords,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'id',
                        t.id_trend,
                        'code',
                        t.business_code,
                        'title',
                        t.title
                    )
                    ORDER BY
                        t.title
                )
            FROM
                signal_trends st2
                JOIN trends t ON t.id_trend = st2.id_trend
            WHERE
                st2.id_signal = sig.id_signal
        ),
        '[]' :: json
    ) AS trends,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'id',
                        a.id_alert,
                        'code',
                        a.business_code,
                        'title',
                        a.title,
                        'level',
                        al.name
                    )
                    ORDER BY
                        a.generation_date DESC
                )
            FROM
                alert_signals als
                JOIN alerts a ON a.id_alert = als.id_alert
                LEFT JOIN alert_levels al ON al.id_alert_level = a.id_alert_level
            WHERE
                als.id_signal = sig.id_signal
        ),
        '[]' :: json
    ) AS alerts
FROM
    signals sig
    JOIN categories cat ON cat.id_category = sig.id_category
    JOIN fcv ON fcv.id_fcv = cat.id_fcv
    JOIN sources src ON src.id_source = sig.id_source
    JOIN signal_types st ON st.id_signal_type = sig.id_signal_type
    JOIN impacts imp ON imp.id_impact = sig.id_impact
    JOIN urgencies urg ON urg.id_urgency = sig.id_urgency
    JOIN scopes scp ON scp.id_scope = sig.id_scope
    JOIN signal_statuses ss ON ss.id_signal_status = sig.id_signal_status
    JOIN users analyst ON analyst.id_user = sig.id_analyst
    LEFT JOIN users validator ON validator.id_user = sig.id_validator;

CREATE
OR REPLACE VIEW vw_trend_detail AS
SELECT
    t.id_trend,
    t.business_code,
    t.title,
    t.narrative,
    t.implications,
    t.first_signal_date,
    td.id_trend_direction,
    td.code AS direction_code,
    td.name AS direction,
    tm.id_trend_maturity,
    tm.code AS maturity_code,
    tm.name AS maturity,
    ts.id_trend_status,
    ts.code AS status_code,
    ts.name AS status,
    analyst.id_user AS analyst_id,
    analyst.first_name,
    analyst.last_name,
    t.created_at,
    t.updated_at,
    (
        SELECT
            COUNT(*)
        FROM
            signal_trends st
        WHERE
            st.id_trend = t.id_trend
    ) AS signal_count,
    (
        SELECT
            COUNT(*)
        FROM
            trend_actors ta
        WHERE
            ta.id_trend = t.id_trend
    ) AS actor_count,
    (
        SELECT
            COUNT(*)
        FROM
            alert_trends at
        WHERE
            at.id_trend = t.id_trend
    ) AS alert_count,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'id',
                        s.id_signal,
                        'code',
                        s.business_code,
                        'title',
                        s.title,
                        'publication_date',
                        s.publication_date,
                        'impact',
                        imp.name,
                        'urgency',
                        urg.name,
                        'status',
                        ss.name,
                        'ips',
                        s.ips
                    )
                    ORDER BY
                        s.publication_date DESC
                )
            FROM
                signal_trends st
                INNER JOIN signals s ON s.id_signal = st.id_signal
                INNER JOIN impacts imp ON imp.id_impact = s.id_impact
                INNER JOIN urgencies urg ON urg.id_urgency = s.id_urgency
                INNER JOIN signal_statuses ss ON ss.id_signal_status = s.id_signal_status
            WHERE
                st.id_trend = t.id_trend
        ),
        '[]' :: json
    ) AS signals,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'id',
                        a.id_actor,
                        'name',
                        a.name,
                        'country',
                        a.country,
                        'website',
                        a.website,
                        'type',
                        at.name
                    )
                    ORDER BY
                        a.name
                )
            FROM
                trend_actors ta
                INNER JOIN actors a ON a.id_actor = ta.id_actor
                LEFT JOIN actor_types at ON at.id_actor_type = a.id_actor_type
            WHERE
                ta.id_trend = t.id_trend
        ),
        '[]' :: json
    ) AS actors,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'id',
                        al.id_alert,
                        'code',
                        al.business_code,
                        'title',
                        al.title,
                        'level',
                        lvl.name,
                        'status',
                        ast.name
                    )
                    ORDER BY
                        al.generation_date DESC
                )
            FROM
                alert_trends atr
                INNER JOIN alerts al ON al.id_alert = atr.id_alert
                LEFT JOIN alert_levels lvl ON lvl.id_alert_level = al.id_alert_level
                LEFT JOIN alert_statuses ast ON ast.id_alert_status = al.id_alert_status
            WHERE
                atr.id_trend = t.id_trend
        ),
        '[]' :: json
    ) AS alerts
FROM
    trends t
    LEFT JOIN trend_directions td ON td.id_trend_direction = t.id_trend_direction
    LEFT JOIN trend_maturity tm ON tm.id_trend_maturity = t.id_trend_maturity
    LEFT JOIN trend_statuses ts ON ts.id_trend_status = t.id_trend_status
    LEFT JOIN users analyst ON analyst.id_user = t.id_analyst;

CREATE
OR REPLACE VIEW vw_alert_detail AS
SELECT
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
    lvl.id_alert_level,
    lvl.code AS level_code,
    lvl.name AS level,
    lvl.color,
    ast.id_alert_status,
    ast.code AS status_code,
    ast.name AS status,
    ao.id_alert_origin,
    ao.code AS origin_code,
    ao.name AS origin,
    creator.id_user AS creator_id,
    creator.first_name,
    creator.last_name,
    validator.id_user AS validator_id,
    validator.first_name AS validator_first_name,
    validator.last_name AS validator_last_name,
    a.validation_date,
    a.created_at,
    a.updated_at,
    (
        SELECT
            COUNT(*)
        FROM
            alert_signals s
        WHERE
            s.id_alert = a.id_alert
    ) AS signal_count,
    (
        SELECT
            COUNT(*)
        FROM
            alert_trends t
        WHERE
            t.id_alert = a.id_alert
    ) AS trend_count,
    (
        SELECT
            COUNT(*)
        FROM
            alert_audiences au
        WHERE
            au.id_alert = a.id_alert
    ) AS audience_count,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'id',
                        s.id_signal,
                        'code',
                        s.business_code,
                        'title',
                        s.title,
                        'ips',
                        s.ips,
                        'status',
                        ss.name
                    )
                    ORDER BY
                        s.publication_date DESC
                )
            FROM
                alert_signals als
                INNER JOIN signals s ON s.id_signal = als.id_signal
                INNER JOIN signal_statuses ss ON ss.id_signal_status = s.id_signal_status
            WHERE
                als.id_alert = a.id_alert
        ),
        '[]' :: json
    ) AS signals,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'id',
                        t.id_trend,
                        'code',
                        t.business_code,
                        'title',
                        t.title,
                        'maturity',
                        tm.name,
                        'status',
                        ts.name
                    )
                    ORDER BY
                        t.title
                )
            FROM
                alert_trends at
                INNER JOIN trends t ON t.id_trend = at.id_trend
                LEFT JOIN trend_maturity tm ON tm.id_trend_maturity = t.id_trend_maturity
                LEFT JOIN trend_statuses ts ON ts.id_trend_status = t.id_trend_status
            WHERE
                at.id_alert = a.id_alert
        ),
        '[]' :: json
    ) AS trends,
    COALESCE(
        (
            SELECT
                json_agg(
                    json_build_object(
                        'id',
                        aud.id_audience,
                        'code',
                        aud.code,
                        'name',
                        aud.name
                    )
                    ORDER BY
                        aud.name
                )
            FROM
                alert_audiences aa
                INNER JOIN audiences aud ON aud.id_audience = aa.id_audience
            WHERE
                aa.id_alert = a.id_alert
        ),
        '[]' :: json
    ) AS audiences
FROM
    alerts a
    LEFT JOIN alert_levels lvl ON lvl.id_alert_level = a.id_alert_level
    LEFT JOIN alert_statuses ast ON ast.id_alert_status = a.id_alert_status
    LEFT JOIN alert_origins ao ON ao.id_alert_origin = a.id_alert_origin
    LEFT JOIN users creator ON creator.id_user = a.id_creator
    LEFT JOIN users validator ON validator.id_user = a.id_validator;

-- VISTAS DE CONTENIDO
CREATE
OR REPLACE VIEW vw_media AS
SELECT
    m.id_media,
    m.filename,
    m.original_filename,
    m.mime_type,
    m.extension,
    m.storage_path,
    m.size_bytes,
    m.checksum,
    m.is_public,
    m.storage_provider,
    m.storage_bucket,
    uploader.id_user AS uploaded_by_id,
    uploader.first_name || ' ' || uploader.last_name AS uploaded_by,
    creator.id_user AS created_by_id,
    creator.first_name || ' ' || creator.last_name AS created_by,
    m.created_at,
    m.updated_at
FROM
    media m
    LEFT JOIN users uploader ON uploader.id_user = m.uploaded_by
    LEFT JOIN users creator ON creator.id_user = m.created_by;

CREATE
OR REPLACE VIEW vw_content AS
SELECT
    c.id_content,
    ct.code AS content_type_code,
    ct.name AS content_type,
    cs.code AS status_code,
    cs.name AS status,
    author.id_user,
    author.first_name,
    author.last_name,
    c.title,
    c.slug,
    c.summary,
    m.id_media,
    m.filename,
    m.storage_path,
    c.published_at,
    c.created_at,
    c.updated_at
FROM
    content c
    INNER JOIN content_types ct ON ct.id_content_type = c.content_type_id
    INNER JOIN content_statuses cs ON cs.id_content_status = c.status_id
    INNER JOIN users author ON author.id_user = c.author_id
    LEFT JOIN media m ON m.id_media = c.featured_media_id;

CREATE
OR REPLACE VIEW vw_content_versions AS
SELECT
    v.id_content_version,
    v.version_number,
    v.change_summary,
    editor.id_user,
    editor.first_name,
    editor.last_name,
    v.created_at,
    s.id_content_section,
    s.title
FROM
    content_version v
    INNER JOIN users editor ON editor.id_user = v.created_by
    INNER JOIN content_section s ON s.content_version_id = v.id_content_version;

CREATE
OR REPLACE VIEW vw_content_sections AS
SELECT
    s.id_content_section,
    s.content_version_id,
    s.position,
    s.title,
    st.code,
    st.name,
    s.is_collapsible,
    s.is_visible,
    s.settings
FROM
    content_section s
    LEFT JOIN section_types st ON st.id_section_type = s.section_type_id;

CREATE
OR REPLACE VIEW vw_content_blocks AS
SELECT
    b.id_content_block,
    b.section_id,
    b.position,
    bt.code,
    bt.name,
    bt.icon,
    bt.supports_children,
    b.data,
    b.settings,
    b.css_class,
    b.is_visible,
    b.created_at,
    b.updated_at
FROM
    content_block b
    INNER JOIN block_type bt ON bt.id_block_type = b.block_type_id;

CREATE
OR REPLACE VIEW vw_content_categories AS
SELECT
    cc.content_id,
    cat.id_category,
    cat.code,
    cat.name,
    fcv.code AS fcv_code,
    fcv.name AS fcv
FROM
    content_category cc
    INNER JOIN categories cat ON cat.id_category = cc.category_id
    INNER JOIN fcv ON fcv.id_fcv = cat.id_fcv;

CREATE
OR REPLACE VIEW vw_content_relations AS
SELECT
    cr.source_content_id,
    src.title AS source_title,
    cr.target_content_id,
    dst.title AS target_title,
    rt.code,
    rt.name
FROM
    content_relation cr
    INNER JOIN content src ON src.id_content = cr.source_content_id
    INNER JOIN content dst ON dst.id_content = cr.target_content_id
    INNER JOIN content_relation_types rt ON rt.id_content_relation_type = cr.relation_type_id;

CREATE
OR REPLACE VIEW vw_content_signals AS
SELECT
    cs.content_id,
    s.id_signal,
    s.business_code,
    s.title,
    ss.name AS status
FROM
    content_signal cs
    INNER JOIN signals s ON s.id_signal = cs.signal_id
    INNER JOIN signal_statuses ss ON ss.id_signal_status = s.id_signal_status;

CREATE
OR REPLACE VIEW vw_content_trends AS
SELECT
    ct.content_id,
    t.id_trend,
    t.business_code,
    t.title,
    tm.name AS maturity
FROM
    content_trend ct
    INNER JOIN trends t ON t.id_trend = ct.trend_id
    LEFT JOIN trend_maturity tm ON tm.id_trend_maturity = t.id_trend_maturity;

CREATE
OR REPLACE VIEW vw_content_alerts AS
SELECT
    ca.content_id,
    a.id_alert,
    a.business_code,
    a.title,
    lvl.name AS level
FROM
    content_alert ca
    INNER JOIN alerts a ON a.id_alert = ca.alert_id
    LEFT JOIN alert_levels lvl ON lvl.id_alert_level = a.id_alert_level;

CREATE
OR REPLACE VIEW vw_content_search AS
SELECT
    id_content,
    title,
    slug,
    content_type,
    status,
    published_at,
    first_name || ' ' || last_name AS author
FROM
    vw_content;

CREATE
OR REPLACE VIEW vw_content_detail AS
SELECT
    --------------------------------------------------
    -- Información general
    --------------------------------------------------
    c.id_content,
    c.slug,
    c.title,
    c.summary,
    ct.code AS content_type_code,
    ct.name AS content_type,
    cs.code AS status_code,
    cs.name AS status,
    c.published_at,
    c.created_at,
    c.updated_at,
    --------------------------------------------------
    -- Autor
    --------------------------------------------------
    u.id_user AS author_id,
    u.first_name,
    u.last_name,
    u.email,
    --------------------------------------------------
    -- Imagen principal
    --------------------------------------------------
    m.id_media,
    m.filename,
    m.original_filename,
    m.mime_type,
    m.storage_path,
    --------------------------------------------------
    -- Categorías
    --------------------------------------------------
    (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'id',
                    cat.id_category,
                    'code',
                    cat.code,
                    'name',
                    cat.name,
                    'fcv',
                    fcv.name
                )
                ORDER BY
                    cat.name
            )
        FROM
            content_category cc
            JOIN categories cat ON cat.id_category = cc.category_id
            JOIN fcv ON fcv.id_fcv = cat.id_fcv
        WHERE
            cc.content_id = c.id_content
    ) AS categories,
    --------------------------------------------------
    -- Señales
    --------------------------------------------------
    (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'id',
                    s.id_signal,
                    'code',
                    s.business_code,
                    'title',
                    s.title
                )
                ORDER BY
                    s.title
            )
        FROM
            content_signal csg
            JOIN signals s ON s.id_signal = csg.signal_id
        WHERE
            csg.content_id = c.id_content
    ) AS signals,
    --------------------------------------------------
    -- Tendencias
    --------------------------------------------------
    (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'id',
                    t.id_trend,
                    'code',
                    t.business_code,
                    'title',
                    t.title
                )
            )
        FROM
            content_trend ctg
            JOIN trends t ON t.id_trend = ctg.trend_id
        WHERE
            ctg.content_id = c.id_content
    ) AS trends,
    --------------------------------------------------
    -- Alertas
    --------------------------------------------------
    (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'id',
                    a.id_alert,
                    'code',
                    a.business_code,
                    'title',
                    a.title
                )
            )
        FROM
            content_alert ca
            JOIN alerts a ON a.id_alert = ca.alert_id
        WHERE
            ca.content_id = c.id_content
    ) AS alerts,
    --------------------------------------------------
    -- Contenido
    --------------------------------------------------
    (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'version',
                    cv.version_number,
                    'created_at',
                    cv.created_at,
                    'sections',
                    (
                        SELECT
                            jsonb_agg(
                                jsonb_build_object(
                                    'id',
                                    sec.id_content_section,
                                    'title',
                                    sec.title,
                                    'position',
                                    sec.position,
                                    'visible',
                                    sec.is_visible,
                                    'collapsible',
                                    sec.is_collapsible,
                                    'type',
                                    st.code,
                                    'settings',
                                    sec.settings,
                                    'blocks',
                                    (
                                        SELECT
                                            jsonb_agg(
                                                jsonb_build_object(
                                                    'id',
                                                    b.id_content_block,
                                                    'position',
                                                    b.position,
                                                    'type',
                                                    bt.code,
                                                    'cssClass',
                                                    b.css_class,
                                                    'visible',
                                                    b.is_visible,
                                                    'settings',
                                                    b.settings,
                                                    'data',
                                                    b.data
                                                )
                                                ORDER BY
                                                    b.position
                                            )
                                        FROM
                                            content_block b
                                            JOIN block_type bt ON bt.id_block_type = b.block_type_id
                                        WHERE
                                            b.section_id = sec.id_content_section
                                    )
                                )
                                ORDER BY
                                    sec.position
                            )
                        FROM
                            content_section sec
                            LEFT JOIN section_types st ON st.id_section_type = sec.section_type_id
                        WHERE
                            sec.content_version_id = cv.id_content_version
                    )
                )
                ORDER BY
                    cv.version_number DESC
            )
        FROM
            content_version cv
        WHERE
            cv.content_id = c.id_content
        ORDER BY
            cv.version_number DESC
        LIMIT
            1
    ) AS versions
FROM
    content c
    JOIN content_types ct ON ct.id_content_type = c.content_type_id
    JOIN content_statuses cs ON cs.id_content_status = c.status_id
    JOIN users u ON u.id_user = c.author_id
    LEFT JOIN media m ON m.id_media = c.featured_media_id;

CREATE VIEW vw_content_history AS
SELECT
    c.id_content,
    c.title,
    cv.id_content_version,
    cv.version_number,
    cv.created_at,
    cv.change_summary,
    u.id_user,
    u.first_name,
    u.last_name
FROM
    content c
    JOIN content_version cv ON cv.content_id = c.id_content
    JOIN users u ON u.id_user = cv.created_by;

-- VISTAS DE PLANTILLAS