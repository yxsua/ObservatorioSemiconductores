\set ON_ERROR_STOP on

BEGIN;

INSERT INTO users (first_name, last_name, email, password_hash) VALUES
    ('Editor', 'Público', 'editor-public-content@example.com', 'test'),
    ('Publicador', 'Público', 'publisher-public-content@example.com', 'test');

DO $$
DECLARE
    v_editor_id BIGINT;
    v_publisher_id BIGINT;
    v_content_id BIGINT;
    v_version_id BIGINT;
    v_revision_id BIGINT;
    v_section_id BIGINT;
    v_public_version_id BIGINT;
    v_public_title TEXT;
BEGIN
    SELECT id_user INTO v_editor_id FROM users
    WHERE email = 'editor-public-content@example.com';
    SELECT id_user INTO v_publisher_id FROM users
    WHERE email = 'publisher-public-content@example.com';

    SELECT created_content_id, created_version_id
    INTO v_content_id, v_version_id
    FROM sp_create_content_v2(
        'REPORT', v_editor_id, 'Título publicado', 'Resumen público',
        'frontera-publica-sql', NULL
    );

    IF EXISTS (SELECT 1 FROM vw_public_content WHERE id_content = v_content_id) THEN
        RAISE EXCEPTION 'Un DRAFT apareció en la vista pública';
    END IF;

    INSERT INTO content_section (
        content_version_id, section_type_id, title, position,
        is_collapsible, is_visible, settings
    ) VALUES (
        v_version_id, get_catalog_id('section_types', 'body'),
        'Cuerpo', 1, FALSE, TRUE, '{}'::JSONB
    ) RETURNING id_content_section INTO v_section_id;

    INSERT INTO content_block (
        section_id, block_type_id, position, data, settings,
        is_visible, schema_version
    ) VALUES (
        v_section_id, get_catalog_id('block_type', 'paragraph'), 1,
        '{"text":"Visible","format":"plain"}'::JSONB,
        '{}'::JSONB, TRUE, 1
    );

    PERFORM sp_transition_content(
        v_content_id, 'SUBMIT_FOR_REVIEW', v_editor_id, NULL
    );
    PERFORM sp_transition_content(
        v_content_id, 'APPROVE', v_publisher_id, NULL
    );
    PERFORM sp_transition_content(
        v_content_id, 'PUBLISH', v_publisher_id, NULL
    );

    SELECT published_version_id, title
    INTO v_public_version_id, v_public_title
    FROM vw_public_content WHERE id_content = v_content_id;
    IF v_public_version_id <> v_version_id OR v_public_title <> 'Título publicado' THEN
        RAISE EXCEPTION 'La vista pública no apuntó a la versión publicada';
    END IF;

    v_revision_id := sp_create_content_version(
        v_content_id, v_editor_id, 'Revisión privada'
    );
    UPDATE content_version SET title = 'Título todavía privado'
    WHERE id_content_version = v_revision_id;

    SELECT published_version_id, title
    INTO v_public_version_id, v_public_title
    FROM vw_public_content WHERE id_content = v_content_id;
    IF v_public_version_id <> v_version_id OR v_public_title <> 'Título publicado' THEN
        RAISE EXCEPTION 'La revisión DRAFT sustituyó datos públicos';
    END IF;

    PERFORM sp_transition_content(
        v_content_id, 'SUBMIT_FOR_REVIEW', v_editor_id, NULL
    );
    PERFORM sp_transition_content(
        v_content_id, 'APPROVE', v_publisher_id, NULL
    );
    PERFORM sp_transition_content(
        v_content_id, 'PUBLISH', v_publisher_id, NULL
    );
    PERFORM sp_transition_content(
        v_content_id, 'ARCHIVE', v_publisher_id, NULL
    );
    IF EXISTS (SELECT 1 FROM vw_public_content WHERE id_content = v_content_id) THEN
        RAISE EXCEPTION 'El contenido archivado permaneció en la vista pública';
    END IF;

    RAISE NOTICE 'OK content=%, published=%, revision=%',
        v_content_id, v_version_id, v_revision_id;
END;
$$;

ROLLBACK;
