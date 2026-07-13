\set ON_ERROR_STOP on

BEGIN;

INSERT INTO users (first_name, last_name, email, password_hash) VALUES
    ('Editor', 'Reglas', 'editor-rules@example.com', 'test'),
    ('Publicador', 'Reglas', 'publisher-rules@example.com', 'test');

INSERT INTO sources (
    id_source_type, name, website, reliability
)
SELECT id_source_type, 'Fuente reglas editoriales',
    'https://example.com/editorial-rules', 0.90
FROM source_types WHERE code = 'SCIENTIFIC_ARTICLE';

DO $$
DECLARE
    v_editor_id BIGINT;
    v_publisher_id BIGINT;
    v_source_id BIGINT;
    v_signal_id BIGINT;
    v_content_id BIGINT;
    v_version_id BIGINT;
    v_section_id BIGINT;
    v_publish_blocked BOOLEAN := FALSE;
BEGIN
    SELECT id_user INTO v_editor_id FROM users
    WHERE email = 'editor-rules@example.com';
    SELECT id_user INTO v_publisher_id FROM users
    WHERE email = 'publisher-rules@example.com';
    SELECT id_source INTO v_source_id FROM sources
    WHERE name = 'Fuente reglas editoriales';

    v_signal_id := sp_create_signal_v2(
        'Señal editorial no validada',
        'Evidencia creada para verificar la publicación.',
        CURRENT_DATE,
        'https://example.com/evidence',
        1::SMALLINT,
        v_source_id,
        'STRONG', 'HIGH', 'HIGH', 'HIGH', 'GLOBAL',
        v_editor_id
    );

    SELECT created_content_id, created_version_id
    INTO v_content_id, v_version_id
    FROM sp_create_content_v2(
        'REPORT', v_editor_id, 'Contenido con referencia',
        'Prueba de reglas de publicación', NULL, NULL
    );
    v_section_id := sp_add_content_section(
        v_version_id, 'signals', 'Señales relacionadas'
    );
    PERFORM sp_add_content_block_v2(
        v_section_id,
        'signal',
        1,
        jsonb_build_object(
            'entityId', v_signal_id,
            'variant', 'card',
            'fields', '{}'::jsonb
        )
    );
    INSERT INTO content_version_signal (content_version_id, signal_id)
    VALUES (v_version_id, v_signal_id);

    PERFORM sp_transition_content(
        v_content_id, 'SUBMIT_FOR_REVIEW', v_editor_id, NULL
    );
    PERFORM sp_transition_content(
        v_content_id, 'APPROVE', v_publisher_id, NULL
    );

    BEGIN
        PERFORM sp_transition_content(
            v_content_id, 'PUBLISH', v_publisher_id, NULL
        );
    EXCEPTION WHEN OTHERS THEN
        v_publish_blocked := TRUE;
    END;
    IF NOT v_publish_blocked THEN
        RAISE EXCEPTION 'Se publicó contenido con una señal no validada';
    END IF;

    PERFORM sp_transition_signal(
        v_signal_id, 'SUBMIT_FOR_REVIEW', v_editor_id, NULL
    );
    PERFORM sp_transition_signal(
        v_signal_id, 'VALIDATE', v_publisher_id, NULL
    );
    PERFORM sp_transition_content(
        v_content_id, 'PUBLISH', v_publisher_id, NULL
    );

    IF NOT EXISTS (
        SELECT 1 FROM content
        WHERE id_content = v_content_id
          AND published_version_id = v_version_id
    ) THEN
        RAISE EXCEPTION 'La versión validada no quedó publicada';
    END IF;

    RAISE NOTICE 'OK content=%, version=%, signal=%',
        v_content_id, v_version_id, v_signal_id;
END;
$$;

ROLLBACK;
