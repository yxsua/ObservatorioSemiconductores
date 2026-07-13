-- Fase 5.0: versionado editorial confiable e inmutabilidad de publicaciones.

ALTER TABLE block_type
    ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN public_allowed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE block_type
SET
    active = code IN (
        'heading', 'paragraph', 'quote', 'list', 'callout', 'divider',
        'image', 'file', 'table', 'chart', 'signal', 'trend', 'alert'
    ),
    public_allowed = code IN (
        'heading', 'paragraph', 'quote', 'list', 'callout', 'divider',
        'image', 'file', 'table', 'chart', 'signal', 'trend', 'alert'
    ),
    schema_version = 1;

ALTER TABLE content_version
    ADD COLUMN title VARCHAR(250),
    ADD COLUMN summary TEXT,
    ADD COLUMN featured_media_id BIGINT REFERENCES media(id_media),
    ADD COLUMN approved_by BIGINT REFERENCES users(id_user),
    ADD COLUMN approved_at TIMESTAMP,
    ADD COLUMN published_by BIGINT REFERENCES users(id_user),
    ADD COLUMN published_at TIMESTAMP;

UPDATE content_version cv
SET
    title = c.title,
    summary = c.summary,
    featured_media_id = c.featured_media_id,
    published_at = CASE
        WHEN cs.code = 'PUBLISHED' THEN c.published_at
        ELSE NULL
    END
FROM content c
INNER JOIN content_statuses cs ON cs.id_content_status = c.status_id
WHERE c.id_content = cv.content_id;

ALTER TABLE content_version
    ALTER COLUMN title SET NOT NULL;

ALTER TABLE content_block
    ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE content
    ADD COLUMN current_version_id BIGINT,
    ADD COLUMN published_version_id BIGINT,
    ADD COLUMN approved_by BIGINT REFERENCES users(id_user),
    ADD COLUMN approved_at TIMESTAMP,
    ADD COLUMN published_by BIGINT REFERENCES users(id_user),
    ADD COLUMN archived_by BIGINT REFERENCES users(id_user),
    ADD COLUMN archived_at TIMESTAMP;

WITH latest_version AS (
    SELECT DISTINCT ON (content_id)
        content_id,
        id_content_version
    FROM content_version
    ORDER BY content_id, version_number DESC, id_content_version DESC
)
UPDATE content c
SET current_version_id = lv.id_content_version
FROM latest_version lv
WHERE lv.content_id = c.id_content;

UPDATE content c
SET published_version_id = c.current_version_id
FROM content_statuses cs
WHERE cs.id_content_status = c.status_id
  AND cs.code = 'PUBLISHED'
  AND c.current_version_id IS NOT NULL;

ALTER TABLE content_version
    ADD CONSTRAINT uq_content_version_identity
        UNIQUE (content_id, id_content_version);

ALTER TABLE content
    ADD CONSTRAINT fk_content_current_version
        FOREIGN KEY (id_content, current_version_id)
        REFERENCES content_version(content_id, id_content_version)
        DEFERRABLE INITIALLY DEFERRED,
    ADD CONSTRAINT fk_content_published_version
        FOREIGN KEY (id_content, published_version_id)
        REFERENCES content_version(content_id, id_content_version)
        DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE content_status_history (
    id_content_status_history BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES content(id_content) ON DELETE CASCADE,
    content_version_id BIGINT,
    from_status_id SMALLINT REFERENCES content_statuses(id_content_status),
    to_status_id SMALLINT NOT NULL REFERENCES content_statuses(id_content_status),
    transition_code VARCHAR(40) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id_user),
    notes TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id, content_version_id)
        REFERENCES content_version(content_id, id_content_version)
);

INSERT INTO content_status_history (
    content_id,
    content_version_id,
    from_status_id,
    to_status_id,
    transition_code,
    changed_by,
    notes,
    changed_at
)
SELECT
    c.id_content,
    c.current_version_id,
    NULL,
    c.status_id,
    'MIGRATED',
    c.author_id,
    'Estado editorial inicial registrado durante la migración.',
    c.created_at
FROM content c;

CREATE TABLE content_version_category (
    content_version_id BIGINT NOT NULL
        REFERENCES content_version(id_content_version) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id_category),
    PRIMARY KEY (content_version_id, category_id)
);

CREATE TABLE content_version_signal (
    content_version_id BIGINT NOT NULL
        REFERENCES content_version(id_content_version) ON DELETE CASCADE,
    signal_id BIGINT NOT NULL REFERENCES signals(id_signal),
    PRIMARY KEY (content_version_id, signal_id)
);

CREATE TABLE content_version_trend (
    content_version_id BIGINT NOT NULL
        REFERENCES content_version(id_content_version) ON DELETE CASCADE,
    trend_id BIGINT NOT NULL REFERENCES trends(id_trend),
    PRIMARY KEY (content_version_id, trend_id)
);

CREATE TABLE content_version_alert (
    content_version_id BIGINT NOT NULL
        REFERENCES content_version(id_content_version) ON DELETE CASCADE,
    alert_id BIGINT NOT NULL REFERENCES alerts(id_alert),
    PRIMARY KEY (content_version_id, alert_id)
);

INSERT INTO content_version_category (content_version_id, category_id)
SELECT cv.id_content_version, cc.category_id
FROM content_version cv
INNER JOIN content_category cc ON cc.content_id = cv.content_id
ON CONFLICT DO NOTHING;

INSERT INTO content_version_signal (content_version_id, signal_id)
SELECT cv.id_content_version, relation.signal_id
FROM content_version cv
INNER JOIN content_signal relation ON relation.content_id = cv.content_id
ON CONFLICT DO NOTHING;

INSERT INTO content_version_trend (content_version_id, trend_id)
SELECT cv.id_content_version, relation.trend_id
FROM content_version cv
INNER JOIN content_trend relation ON relation.content_id = cv.content_id
ON CONFLICT DO NOTHING;

INSERT INTO content_version_alert (content_version_id, alert_id)
SELECT cv.id_content_version, relation.alert_id
FROM content_version cv
INNER JOIN content_alert relation ON relation.content_id = cv.content_id
ON CONFLICT DO NOTHING;

-- Normaliza posiciones existentes antes de imponer unicidad.
WITH ranked AS (
    SELECT
        id_content_section,
        row_number() OVER (
            PARTITION BY content_version_id
            ORDER BY position, id_content_section
        ) AS normalized_position
    FROM content_section
)
UPDATE content_section section
SET position = ranked.normalized_position
FROM ranked
WHERE ranked.id_content_section = section.id_content_section;

WITH ranked AS (
    SELECT
        id_content_block,
        row_number() OVER (
            PARTITION BY section_id
            ORDER BY position, id_content_block
        ) AS normalized_position
    FROM content_block
)
UPDATE content_block block
SET position = ranked.normalized_position
FROM ranked
WHERE ranked.id_content_block = block.id_content_block;

ALTER TABLE content_section
    ADD CONSTRAINT chk_content_section_position CHECK (position > 0),
    ADD CONSTRAINT chk_content_section_settings_object
        CHECK (jsonb_typeof(settings) = 'object'),
    ADD CONSTRAINT uq_content_section_position
        UNIQUE (content_version_id, position);

ALTER TABLE content_block
    ADD CONSTRAINT chk_content_block_position CHECK (position > 0),
    ADD CONSTRAINT chk_content_block_schema_version CHECK (schema_version > 0),
    ADD CONSTRAINT chk_content_block_data_object
        CHECK (jsonb_typeof(data) = 'object'),
    ADD CONSTRAINT chk_content_block_settings_object
        CHECK (jsonb_typeof(settings) = 'object'),
    ADD CONSTRAINT uq_content_block_position UNIQUE (section_id, position);

CREATE OR REPLACE FUNCTION assert_content_version_is_editable(
    p_content_version_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_published_at TIMESTAMP;
    v_is_published BOOLEAN;
    v_is_current BOOLEAN;
    v_status_code TEXT;
BEGIN
    SELECT
        cv.published_at,
        c.published_version_id = cv.id_content_version,
        c.current_version_id = cv.id_content_version,
        status.code
    INTO v_published_at, v_is_published, v_is_current, v_status_code
    FROM content_version cv
    INNER JOIN content c ON c.id_content = cv.content_id
    INNER JOIN content_statuses status
        ON status.id_content_status = c.status_id
    WHERE cv.id_content_version = p_content_version_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la versión editorial %', p_content_version_id;
    END IF;

    IF v_published_at IS NOT NULL OR v_is_published THEN
        RAISE EXCEPTION 'La versión editorial publicada es inmutable';
    END IF;
    IF NOT v_is_current OR v_status_code <> 'DRAFT' THEN
        RAISE EXCEPTION 'Solo la versión de trabajo en estado DRAFT puede modificarse';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION trg_protect_published_content_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.published_at IS NOT NULL OR EXISTS (
        SELECT 1
        FROM content c
        WHERE c.published_version_id = OLD.id_content_version
    ) THEN
        RAISE EXCEPTION 'La versión editorial publicada es inmutable';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER protect_published_content_version
BEFORE UPDATE OR DELETE ON content_version
FOR EACH ROW
EXECUTE FUNCTION trg_protect_published_content_version();

CREATE OR REPLACE FUNCTION trg_protect_content_section_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        PERFORM assert_content_version_is_editable(OLD.content_version_id);
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        PERFORM assert_content_version_is_editable(NEW.content_version_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER protect_content_section_version
BEFORE INSERT OR UPDATE OR DELETE ON content_section
FOR EACH ROW
EXECUTE FUNCTION trg_protect_content_section_version();

CREATE OR REPLACE FUNCTION trg_protect_content_block_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_version_id BIGINT;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT content_version_id INTO v_version_id
        FROM content_section
        WHERE id_content_section = OLD.section_id;
        PERFORM assert_content_version_is_editable(v_version_id);
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        SELECT content_version_id INTO v_version_id
        FROM content_section
        WHERE id_content_section = NEW.section_id;
        PERFORM assert_content_version_is_editable(v_version_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER protect_content_block_version
BEFORE INSERT OR UPDATE OR DELETE ON content_block
FOR EACH ROW
EXECUTE FUNCTION trg_protect_content_block_version();

CREATE OR REPLACE FUNCTION trg_protect_content_version_relation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        PERFORM assert_content_version_is_editable(OLD.content_version_id);
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        PERFORM assert_content_version_is_editable(NEW.content_version_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER protect_content_version_category
BEFORE INSERT OR UPDATE OR DELETE ON content_version_category
FOR EACH ROW EXECUTE FUNCTION trg_protect_content_version_relation();
CREATE TRIGGER protect_content_version_signal
BEFORE INSERT OR UPDATE OR DELETE ON content_version_signal
FOR EACH ROW EXECUTE FUNCTION trg_protect_content_version_relation();
CREATE TRIGGER protect_content_version_trend
BEFORE INSERT OR UPDATE OR DELETE ON content_version_trend
FOR EACH ROW EXECUTE FUNCTION trg_protect_content_version_relation();
CREATE TRIGGER protect_content_version_alert
BEFORE INSERT OR UPDATE OR DELETE ON content_version_alert
FOR EACH ROW EXECUTE FUNCTION trg_protect_content_version_relation();

CREATE OR REPLACE FUNCTION sp_create_content_v2(
    p_content_type_code TEXT,
    p_author_id BIGINT,
    p_title TEXT,
    p_summary TEXT DEFAULT NULL,
    p_slug TEXT DEFAULT NULL,
    p_featured_media_id BIGINT DEFAULT NULL
)
RETURNS TABLE (created_content_id BIGINT, created_version_id BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_content_id BIGINT;
    v_version_id BIGINT;
    v_slug TEXT;
    v_draft_status_id SMALLINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id_user = p_author_id AND active
    ) THEN
        RAISE EXCEPTION 'El autor indicado no existe o está inactivo';
    END IF;
    IF NULLIF(btrim(COALESCE(p_title, '')), '') IS NULL THEN
        RAISE EXCEPTION 'El título editorial es obligatorio';
    END IF;

    v_content_id := nextval(pg_get_serial_sequence('content', 'id_content'));
    v_slug := normalize_slug(COALESCE(NULLIF(btrim(p_slug), ''), p_title));
    IF v_slug = '' THEN
        v_slug := 'contenido-' || v_content_id::TEXT;
    END IF;
    IF EXISTS (SELECT 1 FROM content WHERE slug = v_slug) THEN
        v_slug := v_slug || '-' || v_content_id::TEXT;
    END IF;
    v_draft_status_id := get_catalog_id('content_statuses', 'DRAFT');

    INSERT INTO content (
        id_content, content_type_id, status_id, author_id, title, slug,
        summary, featured_media_id
    ) VALUES (
        v_content_id,
        get_catalog_id('content_types', p_content_type_code),
        v_draft_status_id,
        p_author_id,
        btrim(p_title),
        v_slug,
        NULLIF(btrim(COALESCE(p_summary, '')), ''),
        p_featured_media_id
    );

    INSERT INTO content_version (
        content_id, version_number, created_by, change_summary,
        title, summary, featured_media_id
    ) VALUES (
        v_content_id, 1, p_author_id, 'Versión inicial',
        btrim(p_title), NULLIF(btrim(COALESCE(p_summary, '')), ''),
        p_featured_media_id
    ) RETURNING id_content_version INTO v_version_id;

    UPDATE content
    SET current_version_id = v_version_id
    WHERE id_content = v_content_id;

    INSERT INTO content_status_history (
        content_id, content_version_id, from_status_id, to_status_id,
        transition_code, changed_by
    ) VALUES (
        v_content_id, v_version_id, NULL, v_draft_status_id,
        'CREATED', p_author_id
    );

    RETURN QUERY SELECT v_content_id, v_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_content(
    p_content_type_code TEXT,
    p_status_code TEXT,
    p_author_id BIGINT,
    p_title TEXT,
    p_summary TEXT DEFAULT NULL,
    p_slug TEXT DEFAULT NULL,
    p_featured_media_id BIGINT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_content_id BIGINT;
BEGIN
    IF upper(btrim(COALESCE(p_status_code, 'DRAFT'))) <> 'DRAFT' THEN
        RAISE EXCEPTION 'El contenido editorial debe crearse en estado DRAFT';
    END IF;
    SELECT created_content_id INTO v_content_id
    FROM sp_create_content_v2(
        p_content_type_code, p_author_id, p_title, p_summary,
        p_slug, p_featured_media_id
    );
    RETURN v_content_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_content_version(
    p_content_id BIGINT,
    p_created_by BIGINT,
    p_change_summary TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_content content%ROWTYPE;
    v_source content_version%ROWTYPE;
    v_new_version_id BIGINT;
    v_new_section_id BIGINT;
    v_version_number INTEGER;
    v_section RECORD;
    v_from_status_id SMALLINT;
    v_from_status_code TEXT;
    v_draft_status_id SMALLINT;
BEGIN
    SELECT * INTO v_content
    FROM content
    WHERE id_content = p_content_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe el contenido %', p_content_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE id_user = p_created_by AND active) THEN
        RAISE EXCEPTION 'El editor indicado no existe o está inactivo';
    END IF;
    SELECT code INTO v_from_status_code
    FROM content_statuses
    WHERE id_content_status = v_content.status_id;
    IF v_from_status_code <> 'PUBLISHED' THEN
        RAISE EXCEPTION 'Solo puede crearse una revisión desde contenido publicado';
    END IF;

    IF v_content.current_version_id IS NOT NULL THEN
        SELECT * INTO v_source
        FROM content_version
        WHERE id_content_version = v_content.current_version_id;
    END IF;

    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM content_version
    WHERE content_id = p_content_id;

    INSERT INTO content_version (
        content_id, version_number, created_by, change_summary,
        title, summary, featured_media_id
    ) VALUES (
        p_content_id,
        v_version_number,
        p_created_by,
        NULLIF(btrim(COALESCE(p_change_summary, '')), ''),
        COALESCE(v_source.title, v_content.title),
        COALESCE(v_source.summary, v_content.summary),
        COALESCE(v_source.featured_media_id, v_content.featured_media_id)
    ) RETURNING id_content_version INTO v_new_version_id;

    v_from_status_id := v_content.status_id;
    v_draft_status_id := get_catalog_id('content_statuses', 'DRAFT');
    UPDATE content
    SET
        current_version_id = v_new_version_id,
        status_id = v_draft_status_id,
        approved_by = NULL,
        approved_at = NULL,
        published_by = NULL,
        archived_by = NULL,
        archived_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_content = p_content_id;

    FOR v_section IN
        SELECT * FROM content_section
        WHERE content_version_id = v_content.current_version_id
        ORDER BY position, id_content_section
    LOOP
        INSERT INTO content_section (
            content_version_id, title, section_type_id, position,
            is_collapsible, is_visible, settings
        ) VALUES (
            v_new_version_id, v_section.title, v_section.section_type_id,
            v_section.position, v_section.is_collapsible,
            v_section.is_visible, v_section.settings
        ) RETURNING id_content_section INTO v_new_section_id;

        INSERT INTO content_block (
            section_id, block_type_id, position, data, settings,
            is_visible, css_class, schema_version
        )
        SELECT
            v_new_section_id, block_type_id, position, data, settings,
            is_visible, css_class, schema_version
        FROM content_block
        WHERE section_id = v_section.id_content_section
        ORDER BY position, id_content_block;
    END LOOP;

    INSERT INTO content_version_category
    SELECT v_new_version_id, category_id
    FROM content_version_category
    WHERE content_version_id = v_content.current_version_id;
    INSERT INTO content_version_signal
    SELECT v_new_version_id, signal_id
    FROM content_version_signal
    WHERE content_version_id = v_content.current_version_id;
    INSERT INTO content_version_trend
    SELECT v_new_version_id, trend_id
    FROM content_version_trend
    WHERE content_version_id = v_content.current_version_id;
    INSERT INTO content_version_alert
    SELECT v_new_version_id, alert_id
    FROM content_version_alert
    WHERE content_version_id = v_content.current_version_id;

    INSERT INTO content_status_history (
        content_id, content_version_id, from_status_id, to_status_id,
        transition_code, changed_by, notes
    ) VALUES (
        p_content_id, v_new_version_id, v_from_status_id, v_draft_status_id,
        'CREATE_REVISION', p_created_by,
        NULLIF(btrim(COALESCE(p_change_summary, '')), '')
    );
    RETURN v_new_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_add_content_section(
    p_content_version_id BIGINT,
    p_section_type_code TEXT,
    p_title TEXT DEFAULT NULL,
    p_position INTEGER DEFAULT NULL,
    p_is_collapsible BOOLEAN DEFAULT FALSE,
    p_is_visible BOOLEAN DEFAULT TRUE,
    p_settings JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_section_id BIGINT;
    v_position INTEGER;
BEGIN
    PERFORM assert_content_version_is_editable(p_content_version_id);
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
    FROM content_section WHERE content_version_id = p_content_version_id;
    INSERT INTO content_section (
        content_version_id, title, section_type_id, position,
        is_collapsible, is_visible, settings
    ) VALUES (
        p_content_version_id,
        NULLIF(btrim(COALESCE(p_title, '')), ''),
        get_catalog_id('section_types', p_section_type_code),
        COALESCE(p_position, v_position),
        p_is_collapsible,
        p_is_visible,
        COALESCE(p_settings, '{}'::jsonb)
    ) RETURNING id_content_section INTO v_section_id;
    RETURN v_section_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_add_content_block_v2(
    p_section_id BIGINT,
    p_block_type_code TEXT,
    p_schema_version INTEGER,
    p_data JSONB,
    p_position INTEGER DEFAULT NULL,
    p_settings JSONB DEFAULT '{}'::jsonb,
    p_is_visible BOOLEAN DEFAULT TRUE,
    p_css_class TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_block_id BIGINT;
    v_block_type_id INTEGER;
    v_current_schema_version INTEGER;
    v_position INTEGER;
    v_content_version_id BIGINT;
BEGIN
    SELECT content_version_id INTO v_content_version_id
    FROM content_section WHERE id_content_section = p_section_id;
    IF v_content_version_id IS NULL THEN
        RAISE EXCEPTION 'No existe la sección editorial %', p_section_id;
    END IF;
    PERFORM assert_content_version_is_editable(v_content_version_id);

    SELECT id_block_type, schema_version
    INTO v_block_type_id, v_current_schema_version
    FROM block_type
    WHERE code = lower(btrim(p_block_type_code)) AND active;
    IF v_block_type_id IS NULL THEN
        RAISE EXCEPTION 'El tipo de bloque % no está habilitado', p_block_type_code;
    END IF;
    IF p_schema_version <> v_current_schema_version THEN
        RAISE EXCEPTION 'La versión de esquema % no es válida para el bloque %',
            p_schema_version, p_block_type_code;
    END IF;
    IF jsonb_typeof(p_data) <> 'object' THEN
        RAISE EXCEPTION 'Los datos del bloque deben ser un objeto JSON';
    END IF;

    SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
    FROM content_block WHERE section_id = p_section_id;
    INSERT INTO content_block (
        section_id, block_type_id, position, data, settings,
        is_visible, css_class, schema_version
    ) VALUES (
        p_section_id, v_block_type_id, COALESCE(p_position, v_position),
        p_data, COALESCE(p_settings, '{}'::jsonb), p_is_visible,
        NULLIF(btrim(COALESCE(p_css_class, '')), ''), p_schema_version
    ) RETURNING id_content_block INTO v_block_id;
    RETURN v_block_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_add_content_block(
    p_section_id BIGINT,
    p_block_type_code TEXT,
    p_data JSONB,
    p_position INTEGER DEFAULT NULL,
    p_settings JSONB DEFAULT '{}'::jsonb,
    p_is_visible BOOLEAN DEFAULT TRUE,
    p_css_class TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_schema_version INTEGER;
BEGIN
    SELECT schema_version INTO v_schema_version
    FROM block_type
    WHERE code = lower(btrim(p_block_type_code)) AND active;
    IF v_schema_version IS NULL THEN
        RAISE EXCEPTION 'El tipo de bloque % no está habilitado', p_block_type_code;
    END IF;
    RETURN sp_add_content_block_v2(
        p_section_id, p_block_type_code, v_schema_version, p_data,
        p_position, p_settings, p_is_visible, p_css_class
    );
END;
$$;

CREATE OR REPLACE FUNCTION sp_transition_content(
    p_content_id BIGINT,
    p_transition_code TEXT,
    p_actor_id BIGINT,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_content content%ROWTYPE;
    v_version content_version%ROWTYPE;
    v_from_code TEXT;
    v_to_code TEXT;
    v_transition TEXT;
    v_to_status_id SMALLINT;
    v_visible_sections INTEGER;
    v_visible_blocks INTEGER;
    v_invalid_blocks INTEGER;
BEGIN
    SELECT * INTO v_content FROM content
    WHERE id_content = p_content_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'No existe el contenido %', p_content_id; END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE id_user = p_actor_id AND active) THEN
        RAISE EXCEPTION 'El usuario de la transición no existe o está inactivo';
    END IF;
    IF v_content.current_version_id IS NULL THEN
        RAISE EXCEPTION 'El contenido no tiene una versión de trabajo';
    END IF;
    SELECT * INTO v_version FROM content_version
    WHERE id_content_version = v_content.current_version_id;
    SELECT code INTO v_from_code FROM content_statuses
    WHERE id_content_status = v_content.status_id;

    v_transition := upper(btrim(p_transition_code));
    v_to_code := CASE
        WHEN v_transition = 'SUBMIT_FOR_REVIEW' AND v_from_code = 'DRAFT'
            THEN 'UNDER_REVIEW'
        WHEN v_transition = 'REQUEST_CHANGES' AND v_from_code = 'UNDER_REVIEW'
            THEN 'DRAFT'
        WHEN v_transition = 'APPROVE' AND v_from_code = 'UNDER_REVIEW'
            THEN 'APPROVED'
        WHEN v_transition = 'REOPEN' AND v_from_code = 'APPROVED'
            THEN 'UNDER_REVIEW'
        WHEN v_transition = 'PUBLISH' AND v_from_code = 'APPROVED'
            THEN 'PUBLISHED'
        WHEN v_transition = 'ARCHIVE' AND v_from_code = 'PUBLISHED'
            THEN 'ARCHIVED'
        ELSE NULL
    END;
    IF v_to_code IS NULL THEN
        RAISE EXCEPTION 'Transición % no permitida desde el estado %',
            v_transition, v_from_code;
    END IF;

    IF v_transition = 'SUBMIT_FOR_REVIEW' THEN
        SELECT COUNT(*) INTO v_visible_sections
        FROM content_section
        WHERE content_version_id = v_content.current_version_id AND is_visible;
        SELECT COUNT(*) INTO v_visible_blocks
        FROM content_block block
        INNER JOIN content_section section
            ON section.id_content_section = block.section_id
        WHERE section.content_version_id = v_content.current_version_id
          AND section.is_visible AND block.is_visible;
        IF v_visible_sections < 1 OR v_visible_blocks < 1 THEN
            RAISE EXCEPTION 'La versión requiere al menos una sección y un bloque visibles';
        END IF;
    END IF;

    IF v_transition = 'APPROVE' AND v_version.created_by = p_actor_id THEN
        RAISE EXCEPTION 'El aprobador debe ser distinto del editor de la versión';
    END IF;

    IF v_transition = 'PUBLISH' THEN
        SELECT COUNT(*) INTO v_invalid_blocks
        FROM content_block block
        INNER JOIN content_section section
            ON section.id_content_section = block.section_id
        INNER JOIN block_type type
            ON type.id_block_type = block.block_type_id
        WHERE section.content_version_id = v_content.current_version_id
          AND section.is_visible AND block.is_visible
          AND (
              NOT type.active OR NOT type.public_allowed
              OR block.schema_version <> type.schema_version
          );
        IF v_invalid_blocks > 0 THEN
            RAISE EXCEPTION 'La versión contiene bloques no publicables o desactualizados';
        END IF;
    END IF;

    v_to_status_id := get_catalog_id('content_statuses', v_to_code);

    IF v_transition IN ('REQUEST_CHANGES', 'REOPEN') THEN
        UPDATE content_version
        SET approved_by = NULL, approved_at = NULL
        WHERE id_content_version = v_content.current_version_id;
    ELSIF v_transition = 'APPROVE' THEN
        UPDATE content_version
        SET approved_by = p_actor_id, approved_at = CURRENT_TIMESTAMP
        WHERE id_content_version = v_content.current_version_id;
    ELSIF v_transition = 'PUBLISH' THEN
        UPDATE content_version
        SET published_by = p_actor_id, published_at = CURRENT_TIMESTAMP
        WHERE id_content_version = v_content.current_version_id;
    END IF;

    UPDATE content
    SET
        status_id = v_to_status_id,
        published_version_id = CASE
            WHEN v_transition = 'PUBLISH' THEN current_version_id
            ELSE published_version_id
        END,
        approved_by = CASE
            WHEN v_transition = 'APPROVE' THEN p_actor_id
            WHEN v_transition IN ('REQUEST_CHANGES', 'REOPEN') THEN NULL
            ELSE approved_by
        END,
        approved_at = CASE
            WHEN v_transition = 'APPROVE' THEN CURRENT_TIMESTAMP
            WHEN v_transition IN ('REQUEST_CHANGES', 'REOPEN') THEN NULL
            ELSE approved_at
        END,
        published_by = CASE
            WHEN v_transition = 'PUBLISH' THEN p_actor_id
            ELSE published_by
        END,
        published_at = CASE
            WHEN v_transition = 'PUBLISH' THEN CURRENT_TIMESTAMP
            ELSE published_at
        END,
        archived_by = CASE
            WHEN v_transition = 'ARCHIVE' THEN p_actor_id
            ELSE archived_by
        END,
        archived_at = CASE
            WHEN v_transition = 'ARCHIVE' THEN CURRENT_TIMESTAMP
            ELSE archived_at
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_content = p_content_id;

    INSERT INTO content_status_history (
        content_id, content_version_id, from_status_id, to_status_id,
        transition_code, changed_by, notes
    ) VALUES (
        p_content_id, v_content.current_version_id, v_content.status_id,
        v_to_status_id, v_transition, p_actor_id,
        NULLIF(btrim(COALESCE(p_notes, '')), '')
    );
END;
$$;

CREATE OR REPLACE FUNCTION sp_publish_content(p_content_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Use sp_transition_content para publicar contenido editorial';
END;
$$;

CREATE OR REPLACE VIEW vw_block_types AS
SELECT
    id_block_type,
    code,
    name,
    icon,
    description,
    supports_children,
    schema,
    schema_version,
    active,
    public_allowed
FROM block_type;

CREATE INDEX idx_content_current_version ON content (current_version_id);
CREATE INDEX idx_content_published_version
    ON content (published_version_id) WHERE published_version_id IS NOT NULL;
CREATE INDEX idx_content_status_history_content_changed
    ON content_status_history (content_id, changed_at DESC);
CREATE INDEX idx_content_status_history_actor
    ON content_status_history (changed_by);
CREATE INDEX idx_content_version_category_category
    ON content_version_category (category_id);
CREATE INDEX idx_content_version_signal_signal
    ON content_version_signal (signal_id);
CREATE INDEX idx_content_version_trend_trend
    ON content_version_trend (trend_id);
CREATE INDEX idx_content_version_alert_alert
    ON content_version_alert (alert_id);
