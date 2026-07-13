\set ON_ERROR_STOP on

BEGIN;

INSERT INTO users (first_name, last_name, email, password_hash) VALUES
    ('Elena', 'Editora', 'editor-phase5@example.com', 'test'),
    ('Pablo', 'Publicador', 'publisher-phase5@example.com', 'test');

DO $$
DECLARE
    v_editor_id BIGINT;
    v_publisher_id BIGINT;
    v_content_id BIGINT;
    v_version_id BIGINT;
    v_section_id BIGINT;
    v_block_id BIGINT;
    v_revision_id BIGINT;
    v_published_version_id BIGINT;
    v_status_code TEXT;
    v_history_count INTEGER;
    v_mutation_blocked BOOLEAN := FALSE;
    v_review_mutation_blocked BOOLEAN := FALSE;
BEGIN
    SELECT id_user INTO v_editor_id
    FROM users WHERE email = 'editor-phase5@example.com';
    SELECT id_user INTO v_publisher_id
    FROM users WHERE email = 'publisher-phase5@example.com';

    SELECT created_content_id, created_version_id
    INTO v_content_id, v_version_id
    FROM sp_create_content_v2(
        'REPORT', v_editor_id, 'Reporte editorial E2E',
        'Resumen', 'reporte-editorial-e2e', NULL
    );

    v_section_id := sp_add_content_section(
        v_version_id, 'body', 'Desarrollo'
    );
    v_block_id := sp_add_content_block_v2(
        v_section_id,
        'paragraph',
        1,
        jsonb_build_object(
            'text', 'Contenido validado',
            'format', 'plain'
        )
    );

    PERFORM sp_transition_content(
        v_content_id, 'SUBMIT_FOR_REVIEW', v_editor_id, 'Listo'
    );

    BEGIN
        PERFORM sp_add_content_section(
            v_version_id, 'body', 'Cambio fuera de borrador'
        );
    EXCEPTION WHEN OTHERS THEN
        v_review_mutation_blocked := TRUE;
    END;
    IF NOT v_review_mutation_blocked THEN
        RAISE EXCEPTION 'La composición se modificó durante la revisión';
    END IF;

    BEGIN
        PERFORM sp_transition_content(
            v_content_id, 'APPROVE', v_editor_id, NULL
        );
        RAISE EXCEPTION 'El editor logró autoaprobar su versión';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'El editor logró autoaprobar su versión' THEN
            RAISE;
        END IF;
    END;

    PERFORM sp_transition_content(
        v_content_id, 'APPROVE', v_publisher_id, 'Aprobado'
    );
    PERFORM sp_transition_content(
        v_content_id, 'PUBLISH', v_publisher_id, 'Publicado'
    );

    SELECT published_version_id INTO v_published_version_id
    FROM content WHERE id_content = v_content_id;
    IF v_published_version_id <> v_version_id THEN
        RAISE EXCEPTION 'El puntero de publicación no señala la versión aprobada';
    END IF;

    BEGIN
        UPDATE content_block
        SET data = jsonb_build_object('text', 'Mutación indebida')
        WHERE id_content_block = v_block_id;
    EXCEPTION WHEN OTHERS THEN
        v_mutation_blocked := TRUE;
    END;
    IF NOT v_mutation_blocked THEN
        RAISE EXCEPTION 'La versión publicada pudo modificarse';
    END IF;

    v_revision_id := sp_create_content_version(
        v_content_id, v_editor_id, 'Segunda edición'
    );
    IF v_revision_id = v_published_version_id THEN
        RAISE EXCEPTION 'La revisión reemplazó la versión publicada';
    END IF;

    SELECT status.code, content.published_version_id
    INTO v_status_code, v_published_version_id
    FROM content
    INNER JOIN content_statuses status
        ON status.id_content_status = content.status_id
    WHERE content.id_content = v_content_id;

    IF v_status_code <> 'DRAFT' OR v_published_version_id <> v_version_id THEN
        RAISE EXCEPTION 'La nueva revisión alteró la publicación vigente';
    END IF;

    UPDATE content_block
    SET data = jsonb_build_object(
        'text', 'Contenido de la revisión',
        'format', 'plain'
    )
    WHERE section_id IN (
        SELECT id_content_section
        FROM content_section
        WHERE content_version_id = v_revision_id
    );

    SELECT COUNT(*) INTO v_history_count
    FROM content_status_history
    WHERE content_id = v_content_id;
    IF v_history_count <> 5 THEN
        RAISE EXCEPTION 'Historial inesperado: %', v_history_count;
    END IF;

    RAISE NOTICE 'OK content=%, published=%, revision=%, history=%',
        v_content_id, v_version_id, v_revision_id, v_history_count;
END;
$$;

DO $$
DECLARE
    v_enabled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_enabled_count
    FROM block_type
    WHERE active AND public_allowed AND schema_version = 1;
    IF v_enabled_count <> 13 THEN
        RAISE EXCEPTION 'Se esperaban 13 bloques MVP y se encontraron %',
            v_enabled_count;
    END IF;
END;
$$;

ROLLBACK;
