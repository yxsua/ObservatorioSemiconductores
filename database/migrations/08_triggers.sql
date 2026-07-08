------------------------------------------------------------
-- TRIGGERS MINIMOS DEL OBSERVATORIO
------------------------------------------------------------
-- Estos triggers cubren reglas que conviene garantizar aun si la API no llama
-- directamente a los procedimientos de 07_procedures.sql.

------------------------------------------------------------
-- FUNCIONES DE TRIGGER
------------------------------------------------------------

-- Nombre: trg_set_updated_at
-- Descripcion: Actualiza automaticamente la columna updated_at antes de cada UPDATE.
-- Por que usarlo: mantiene una marca temporal confiable para auditoria basica,
-- listados recientes y sincronizacion con el frontend.
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Nombre: trg_validate_signal_dates
-- Descripcion: Valida coherencia temporal en senales de vigilancia.
-- Por que usarlo: evita capturar senales con fecha de publicacion posterior a la
-- fecha de captura o fecha de validacion anterior a la captura.
CREATE OR REPLACE FUNCTION trg_validate_signal_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.publication_date > NEW.capture_date THEN
        RAISE EXCEPTION 'La fecha de publicacion (%) no puede ser posterior a la fecha de captura (%)',
            NEW.publication_date,
            NEW.capture_date;
    END IF;

    IF NEW.validation_date IS NOT NULL AND NEW.validation_date < NEW.capture_date THEN
        RAISE EXCEPTION 'La fecha de validacion (%) no puede ser anterior a la fecha de captura (%)',
            NEW.validation_date,
            NEW.capture_date;
    END IF;

    RETURN NEW;
END;
$$;

-- Nombre: trg_validate_alert_dates
-- Descripcion: Valida coherencia temporal en alertas registradas manualmente.
-- Por que usarlo: el MVP no automatiza alertas tempranas, pero si permite registrar
-- alertas curadas; estas fechas no deben contradecir la fecha de generacion.
CREATE OR REPLACE FUNCTION trg_validate_alert_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.response_deadline IS NOT NULL AND NEW.response_deadline < NEW.generation_date THEN
        RAISE EXCEPTION 'La fecha limite de respuesta (%) no puede ser anterior a la fecha de generacion (%)',
            NEW.response_deadline,
            NEW.generation_date;
    END IF;

    IF NEW.publication_date IS NOT NULL AND NEW.publication_date < NEW.generation_date THEN
        RAISE EXCEPTION 'La fecha de publicacion (%) no puede ser anterior a la fecha de generacion (%)',
            NEW.publication_date,
            NEW.generation_date;
    END IF;

    IF NEW.validation_date IS NOT NULL AND NEW.validation_date < NEW.generation_date THEN
        RAISE EXCEPTION 'La fecha de validacion (%) no puede ser anterior a la fecha de generacion (%)',
            NEW.validation_date,
            NEW.generation_date;
    END IF;

    RETURN NEW;
END;
$$;

-- Nombre: trg_set_content_published_at
-- Descripcion: Asigna published_at cuando un contenido queda en estado PUBLISHED.
-- Por que usarlo: permite publicar desde procedimientos o desde la API sin olvidar
-- la fecha real de publicacion.
CREATE OR REPLACE FUNCTION trg_set_content_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_code TEXT;
BEGIN
    SELECT code
    INTO v_status_code
    FROM content_statuses
    WHERE id_content_status = NEW.status_id;

    IF v_status_code = 'PUBLISHED' AND NEW.published_at IS NULL THEN
        NEW.published_at = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$;

------------------------------------------------------------
-- TRIGGERS DE AUDITORIA BASICA
------------------------------------------------------------

-- Nombre: set_users_updated_at
-- Descripcion: Mantiene users.updated_at actualizado en cada modificacion.
DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

-- Nombre: set_sources_updated_at
-- Descripcion: Mantiene sources.updated_at actualizado en cada modificacion.
DROP TRIGGER IF EXISTS set_sources_updated_at ON sources;
CREATE TRIGGER set_sources_updated_at
BEFORE UPDATE ON sources
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

-- Nombre: set_signals_updated_at
-- Descripcion: Mantiene signals.updated_at actualizado en cada modificacion.
DROP TRIGGER IF EXISTS set_signals_updated_at ON signals;
CREATE TRIGGER set_signals_updated_at
BEFORE UPDATE ON signals
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

-- Nombre: set_trends_updated_at
-- Descripcion: Mantiene trends.updated_at actualizado en cada modificacion.
DROP TRIGGER IF EXISTS set_trends_updated_at ON trends;
CREATE TRIGGER set_trends_updated_at
BEFORE UPDATE ON trends
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

-- Nombre: set_alerts_updated_at
-- Descripcion: Mantiene alerts.updated_at actualizado en cada modificacion.
DROP TRIGGER IF EXISTS set_alerts_updated_at ON alerts;
CREATE TRIGGER set_alerts_updated_at
BEFORE UPDATE ON alerts
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

-- Nombre: set_media_updated_at
-- Descripcion: Mantiene media.updated_at actualizado en cada modificacion.
DROP TRIGGER IF EXISTS set_media_updated_at ON media;
CREATE TRIGGER set_media_updated_at
BEFORE UPDATE ON media
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

-- Nombre: set_content_updated_at
-- Descripcion: Mantiene content.updated_at actualizado en cada modificacion.
DROP TRIGGER IF EXISTS set_content_updated_at ON content;
CREATE TRIGGER set_content_updated_at
BEFORE UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

-- Nombre: set_content_block_updated_at
-- Descripcion: Mantiene content_block.updated_at actualizado en cada modificacion.
DROP TRIGGER IF EXISTS set_content_block_updated_at ON content_block;
CREATE TRIGGER set_content_block_updated_at
BEFORE UPDATE ON content_block
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

------------------------------------------------------------
-- TRIGGERS DE VALIDACION MINIMA
------------------------------------------------------------

-- Nombre: validate_signal_dates_before_write
-- Descripcion: Valida fechas criticas antes de insertar o actualizar senales.
DROP TRIGGER IF EXISTS validate_signal_dates_before_write ON signals;
CREATE TRIGGER validate_signal_dates_before_write
BEFORE INSERT OR UPDATE ON signals
FOR EACH ROW
EXECUTE FUNCTION trg_validate_signal_dates();

-- Nombre: validate_alert_dates_before_write
-- Descripcion: Valida fechas criticas antes de insertar o actualizar alertas.
DROP TRIGGER IF EXISTS validate_alert_dates_before_write ON alerts;
CREATE TRIGGER validate_alert_dates_before_write
BEFORE INSERT OR UPDATE ON alerts
FOR EACH ROW
EXECUTE FUNCTION trg_validate_alert_dates();

-- Nombre: set_content_published_at_before_write
-- Descripcion: Completa published_at si el contenido queda publicado.
-- Ejemplo de efecto:
-- UPDATE content
-- SET status_id = get_catalog_id('content_statuses', 'PUBLISHED')
-- WHERE id_content = 1;
DROP TRIGGER IF EXISTS set_content_published_at_before_write ON content;
CREATE TRIGGER set_content_published_at_before_write
BEFORE INSERT OR UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION trg_set_content_published_at();
