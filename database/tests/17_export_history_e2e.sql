\set ON_ERROR_STOP on

BEGIN;

INSERT INTO users (first_name, last_name, email, password_hash)
VALUES ('Miembro', 'Exportación', 'member-export-sql@example.com', 'test');

DO $$
DECLARE
    v_user_id BIGINT;
    v_export_id BIGINT;
BEGIN
    SELECT id_user INTO v_user_id
    FROM users WHERE email = 'member-export-sql@example.com';

    INSERT INTO export_history (
        user_id, resource_code, format_code, filters,
        row_count, size_bytes, checksum
    ) VALUES (
        v_user_id, 'signals', 'csv', '{"fcv":"TECHNOLOGICAL"}'::JSONB,
        3, 512, repeat('a', 64)
    ) RETURNING id_export INTO v_export_id;

    IF NOT EXISTS (
        SELECT 1 FROM export_history
        WHERE id_export = v_export_id
          AND user_id = v_user_id
          AND row_count = 3
    ) THEN
        RAISE EXCEPTION 'No se registró la exportación esperada';
    END IF;

    BEGIN
        INSERT INTO export_history (
            user_id, resource_code, format_code, filters,
            row_count, size_bytes, checksum
        ) VALUES (
            v_user_id, 'private', 'csv', '{}'::JSONB,
            0, 0, repeat('b', 64)
        );
        RAISE EXCEPTION 'Se aceptó un recurso de exportación privado';
    EXCEPTION WHEN check_violation THEN
        NULL;
    END;

    BEGIN
        INSERT INTO export_history (
            user_id, resource_code, format_code, filters,
            row_count, size_bytes, checksum
        ) VALUES (
            v_user_id, 'content', 'json', '[]'::JSONB,
            0, 0, 'no-es-sha256'
        );
        RAISE EXCEPTION 'Se aceptó auditoría inválida';
    EXCEPTION WHEN check_violation THEN
        NULL;
    END;

    RAISE NOTICE 'OK export_history=% user=%', v_export_id, v_user_id;
END;
$$;

ROLLBACK;
