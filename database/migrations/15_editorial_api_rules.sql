-- Fase 5.2: precondiciones de publicación para composición editorial.

-- Durante un DELETE CASCADE de sección, PostgreSQL puede retirar la fila padre
-- antes de ejecutar el trigger del bloque. La sección ya fue validada por su
-- propio trigger, por lo que el bloque puede completar ese borrado controlado.
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
        IF v_version_id IS NOT NULL THEN
            PERFORM assert_content_version_is_editable(v_version_id);
        ELSIF TG_OP <> 'DELETE' THEN
            RAISE EXCEPTION 'No existe la sección editorial %', OLD.section_id;
        END IF;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        SELECT content_version_id INTO v_version_id
        FROM content_section
        WHERE id_content_section = NEW.section_id;
        IF v_version_id IS NULL THEN
            RAISE EXCEPTION 'No existe la sección editorial %', NEW.section_id;
        END IF;
        PERFORM assert_content_version_is_editable(v_version_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION assert_content_version_is_publishable(
    p_content_version_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_visible_sections INTEGER;
    v_visible_blocks INTEGER;
    v_invalid_blocks INTEGER;
    v_invalid_signals INTEGER;
    v_invalid_trends INTEGER;
    v_invalid_alerts INTEGER;
    v_invalid_references INTEGER;
    v_invalid_media INTEGER;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM content_version
        WHERE id_content_version = p_content_version_id
    ) THEN
        RAISE EXCEPTION 'No existe la versión editorial %', p_content_version_id;
    END IF;

    SELECT COUNT(*) INTO v_visible_sections
    FROM content_section
    WHERE content_version_id = p_content_version_id AND is_visible;

    SELECT COUNT(*) INTO v_visible_blocks
    FROM content_block block
    INNER JOIN content_section section
        ON section.id_content_section = block.section_id
    WHERE section.content_version_id = p_content_version_id
      AND section.is_visible AND block.is_visible;

    IF v_visible_sections < 1 OR v_visible_blocks < 1 THEN
        RAISE EXCEPTION 'La versión requiere al menos una sección y un bloque visibles';
    END IF;

    SELECT COUNT(*) INTO v_invalid_blocks
    FROM content_block block
    INNER JOIN content_section section
        ON section.id_content_section = block.section_id
    INNER JOIN block_type type
        ON type.id_block_type = block.block_type_id
    WHERE section.content_version_id = p_content_version_id
      AND section.is_visible AND block.is_visible
      AND (
          NOT type.active OR NOT type.public_allowed
          OR block.schema_version <> type.schema_version
          OR jsonb_typeof(block.data) <> 'object'
      );
    IF v_invalid_blocks > 0 THEN
        RAISE EXCEPTION 'La versión contiene bloques no publicables o desactualizados';
    END IF;

    SELECT COUNT(*) INTO v_invalid_signals
    FROM content_version_signal relation
    INNER JOIN signals signal ON signal.id_signal = relation.signal_id
    INNER JOIN signal_statuses status
        ON status.id_signal_status = signal.id_signal_status
    WHERE relation.content_version_id = p_content_version_id
      AND status.code <> 'VALIDATED';

    SELECT COUNT(*) INTO v_invalid_trends
    FROM content_version_trend relation
    INNER JOIN trends trend ON trend.id_trend = relation.trend_id
    INNER JOIN trend_statuses status
        ON status.id_trend_status = trend.id_trend_status
    WHERE relation.content_version_id = p_content_version_id
      AND status.code <> 'ACTIVE';

    SELECT COUNT(*) INTO v_invalid_alerts
    FROM content_version_alert relation
    INNER JOIN alerts alert ON alert.id_alert = relation.alert_id
    INNER JOIN alert_statuses status
        ON status.id_alert_status = alert.id_alert_status
    WHERE relation.content_version_id = p_content_version_id
      AND status.code NOT IN ('PUBLISHED', 'CLOSED');

    IF v_invalid_signals + v_invalid_trends + v_invalid_alerts > 0 THEN
        RAISE EXCEPTION 'Las relaciones de vigilancia deben ser públicamente visibles';
    END IF;

    SELECT COUNT(*) INTO v_invalid_references
    FROM content_block block
    INNER JOIN content_section section
        ON section.id_content_section = block.section_id
    INNER JOIN block_type type
        ON type.id_block_type = block.block_type_id
    WHERE section.content_version_id = p_content_version_id
      AND section.is_visible AND block.is_visible
      AND type.code IN ('signal', 'trend', 'alert')
      AND (
          COALESCE(block.data->>'entityId', '') !~ '^[1-9][0-9]*$'
          OR (
              type.code = 'signal'
              AND NOT EXISTS (
                  SELECT 1 FROM content_version_signal relation
                  WHERE relation.content_version_id = p_content_version_id
                    AND relation.signal_id::TEXT = block.data->>'entityId'
              )
          )
          OR (
              type.code = 'trend'
              AND NOT EXISTS (
                  SELECT 1 FROM content_version_trend relation
                  WHERE relation.content_version_id = p_content_version_id
                    AND relation.trend_id::TEXT = block.data->>'entityId'
              )
          )
          OR (
              type.code = 'alert'
              AND NOT EXISTS (
                  SELECT 1 FROM content_version_alert relation
                  WHERE relation.content_version_id = p_content_version_id
                    AND relation.alert_id::TEXT = block.data->>'entityId'
              )
          )
      );
    IF v_invalid_references > 0 THEN
        RAISE EXCEPTION 'Los bloques de vigilancia requieren relaciones versionadas válidas';
    END IF;

    SELECT COUNT(*) INTO v_invalid_media
    FROM content_block block
    INNER JOIN content_section section
        ON section.id_content_section = block.section_id
    INNER JOIN block_type type
        ON type.id_block_type = block.block_type_id
    WHERE section.content_version_id = p_content_version_id
      AND section.is_visible AND block.is_visible
      AND type.code IN ('image', 'file')
      AND (
          COALESCE(block.data->>'mediaId', '') !~ '^[1-9][0-9]*$'
          OR NOT EXISTS (
              SELECT 1 FROM media
              WHERE id_media::TEXT = block.data->>'mediaId'
                AND is_public
          )
      );
    IF v_invalid_media > 0 THEN
        RAISE EXCEPTION 'Los bloques multimedia requieren archivos públicos válidos';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION trg_validate_published_content_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.published_version_id IS DISTINCT FROM OLD.published_version_id
       AND NEW.published_version_id IS NOT NULL THEN
        PERFORM assert_content_version_is_publishable(
            NEW.published_version_id
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_published_content_version
BEFORE UPDATE OF published_version_id ON content
FOR EACH ROW
EXECUTE FUNCTION trg_validate_published_content_version();
