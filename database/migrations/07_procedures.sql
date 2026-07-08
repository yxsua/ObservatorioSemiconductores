------------------------------------------------------------
-- PROCEDIMIENTOS GENERALES DEL OBSERVATORIO
------------------------------------------------------------
-- PostgreSQL implementa procedimientos con CREATE PROCEDURE y funciones
-- retornables con CREATE FUNCTION. Para la API REST conviene usar funciones
-- porque pueden consultarse con SELECT desde la capa de repositorios.

------------------------------------------------------------
-- UTILIDADES GENERALES
------------------------------------------------------------

-- Descripcion: Normaliza un texto para usarlo como slug de contenido editorial.
-- Convierte a minusculas, remueve acentos comunes y reemplaza separadores por guiones.
CREATE OR REPLACE FUNCTION normalize_slug(value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    normalized TEXT;
BEGIN
    normalized := lower(btrim(COALESCE(value, '')));
    normalized := translate(
        normalized,
        U&'\00E1\00E0\00E4\00E2\00E3\00E9\00E8\00EB\00EA\00ED\00EC\00EF\00EE\00F3\00F2\00F6\00F4\00F5\00FA\00F9\00FC\00FB\00F1\00E7',
        'aaaaaeeeeiiiiooooouuuunc'
    );
    normalized := regexp_replace(normalized, '[^a-z0-9]+', '-', 'g');
    normalized := regexp_replace(normalized, '(^-|-$)', '', 'g');

    RETURN normalized;
END;
$$;

-- Descripcion: Obtiene el identificador interno de un catalogo a partir de su codigo.
-- Por que usarlo: evita repetir consultas a catalogos en cada procedimiento del backend.
-- Ejemplo:
-- SELECT get_catalog_id('content_statuses', 'PUBLISHED');
CREATE OR REPLACE FUNCTION get_catalog_id(catalog_name TEXT, catalog_code TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    clean_catalog TEXT;
    clean_code TEXT;
    result_id INTEGER;
BEGIN
    clean_catalog := lower(btrim(COALESCE(catalog_name, '')));
    clean_code := btrim(COALESCE(catalog_code, ''));

    IF clean_code = '' THEN
        RAISE EXCEPTION 'El codigo de catalogo no puede estar vacio';
    END IF;

    CASE clean_catalog
        WHEN 'fcv' THEN
            SELECT id_fcv INTO result_id
            FROM fcv
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'source_types' THEN
            SELECT id_source_type INTO result_id
            FROM source_types
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'signal_types' THEN
            SELECT id_signal_type INTO result_id
            FROM signal_types
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'impacts' THEN
            SELECT id_impact INTO result_id
            FROM impacts
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'urgencies' THEN
            SELECT id_urgency INTO result_id
            FROM urgencies
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'scopes' THEN
            SELECT id_scope INTO result_id
            FROM scopes
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'signal_statuses' THEN
            SELECT id_signal_status INTO result_id
            FROM signal_statuses
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'trend_directions' THEN
            SELECT id_trend_direction INTO result_id
            FROM trend_directions
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'trend_maturity' THEN
            SELECT id_trend_maturity INTO result_id
            FROM trend_maturity
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'trend_statuses' THEN
            SELECT id_trend_status INTO result_id
            FROM trend_statuses
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'alert_levels' THEN
            SELECT id_alert_level INTO result_id
            FROM alert_levels
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'alert_statuses' THEN
            SELECT id_alert_status INTO result_id
            FROM alert_statuses
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'alert_origins' THEN
            SELECT id_alert_origin INTO result_id
            FROM alert_origins
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'content_types' THEN
            SELECT id_content_type INTO result_id
            FROM content_types
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'content_statuses' THEN
            SELECT id_content_status INTO result_id
            FROM content_statuses
            WHERE code IN (clean_code, upper(clean_code));
        WHEN 'section_types' THEN
            SELECT id_section_type INTO result_id
            FROM section_types
            WHERE code IN (clean_code, lower(clean_code), upper(clean_code));
        WHEN 'block_type' THEN
            SELECT id_block_type INTO result_id
            FROM block_type
            WHERE code IN (clean_code, lower(clean_code), upper(clean_code));
        ELSE
            RAISE EXCEPTION 'Catalogo no soportado: %', catalog_name;
    END CASE;

    IF result_id IS NULL THEN
        RAISE EXCEPTION 'No existe el codigo "%" en el catalogo "%"', catalog_code, catalog_name;
    END IF;

    RETURN result_id;
END;
$$;

------------------------------------------------------------
-- CATALOGOS EDITABLES
------------------------------------------------------------

-- Descripcion: Crea una categoria de vigilancia asociada a un FCV.
-- Inspirado en sp_insertar_categoria del proyecto de referencia, adaptado a PostgreSQL
-- y al modelo normalizado del observatorio.
-- Ejemplo:
-- SELECT sp_create_category('TEC', 'Fotolitografia', 'Procesos y equipos de litografia');
CREATE OR REPLACE FUNCTION sp_create_category(
    p_fcv_code TEXT,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_parent_category_id SMALLINT DEFAULT NULL
)
RETURNS SMALLINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_category_id SMALLINT;
BEGIN
    INSERT INTO categories (
        id_fcv,
        name,
        description,
        parent_category_id
    )
    VALUES (
        get_catalog_id('fcv', p_fcv_code),
        btrim(p_name),
        p_description,
        p_parent_category_id
    )
    RETURNING id_category INTO v_category_id;

    RETURN v_category_id;
END;
$$;

-- Descripcion: Actualiza nombre, descripcion y categoria padre de una categoria activa.
-- Por que usarlo: mantiene la regla de no editar categorias dadas de baja logicamente.
CREATE OR REPLACE FUNCTION sp_update_category(
    p_category_id SMALLINT,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_parent_category_id SMALLINT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE categories
    SET
        name = btrim(p_name),
        description = p_description,
        parent_category_id = p_parent_category_id
    WHERE id_category = p_category_id
      AND active IS TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Categoria no encontrada o inactiva';
    END IF;
END;
$$;

-- Descripcion: Desactiva una categoria sin borrar sus relaciones historicas.
-- Por que usarlo: equivale a la baja logica del ejemplo Oracle, pero usando BOOLEAN.
CREATE OR REPLACE FUNCTION sp_deactivate_category(
    p_category_id SMALLINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE categories
    SET active = FALSE
    WHERE id_category = p_category_id
      AND active IS TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Categoria no encontrada o ya inactiva';
    END IF;
END;
$$;

------------------------------------------------------------
-- SEGURIDAD Y ACCESOS
------------------------------------------------------------

-- Descripcion: Crea un usuario del observatorio.
-- Este procedimiento unifica la idea de clientes/agentes del proyecto de referencia
-- en la tabla users, donde el rol se asigna por separado con sp_assign_role_to_user.
-- Ejemplo:
-- SELECT sp_create_user('Ana', 'Lopez', 'ana@example.com', 'Analista', '<hash>');
CREATE OR REPLACE FUNCTION sp_create_user(
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_occupation TEXT DEFAULT NULL,
    p_password_hash TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    IF NULLIF(btrim(COALESCE(p_password_hash, '')), '') IS NULL THEN
        RAISE EXCEPTION 'El password_hash es obligatorio';
    END IF;

    INSERT INTO users (
        first_name,
        last_name,
        email,
        occupation,
        password_hash
    )
    VALUES (
        btrim(p_first_name),
        btrim(p_last_name),
        lower(btrim(p_email)),
        NULLIF(btrim(COALESCE(p_occupation, '')), ''),
        p_password_hash
    )
    RETURNING id_user INTO v_user_id;

    RETURN v_user_id;
END;
$$;

-- Descripcion: Actualiza datos basicos de un usuario activo.
-- Si p_password_hash llega nulo, conserva la contrasena actual.
CREATE OR REPLACE FUNCTION sp_update_user(
    p_user_id BIGINT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_occupation TEXT DEFAULT NULL,
    p_password_hash TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET
        first_name = btrim(p_first_name),
        last_name = btrim(p_last_name),
        email = lower(btrim(p_email)),
        occupation = NULLIF(btrim(COALESCE(p_occupation, '')), ''),
        password_hash = COALESCE(NULLIF(p_password_hash, ''), password_hash),
        updated_at = CURRENT_TIMESTAMP
    WHERE id_user = p_user_id
      AND active IS TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado o inactivo';
    END IF;
END;
$$;

-- Descripcion: Obtiene los datos necesarios para validar login desde el backend.
-- Por que usarlo: centraliza el filtro de usuarios activos y devuelve roles en la misma consulta.
-- Ejemplo:
-- SELECT * FROM sp_get_user_login('ana@example.com');
CREATE OR REPLACE FUNCTION sp_get_user_login(
    p_email TEXT
)
RETURNS TABLE (
    id_user BIGINT,
    full_name TEXT,
    email TEXT,
    password_hash TEXT,
    roles TEXT[]
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id_user,
        concat_ws(' ', u.first_name, u.last_name) AS full_name,
        u.email::TEXT,
        u.password_hash,
        COALESCE(array_agg(r.name::TEXT ORDER BY r.name) FILTER (WHERE r.id_role IS NOT NULL), ARRAY[]::TEXT[]) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.id_user = u.id_user
    LEFT JOIN roles r ON r.id_role = ur.id_role
    WHERE u.email = lower(btrim(p_email))
      AND u.active IS TRUE
    GROUP BY u.id_user, u.first_name, u.last_name, u.email, u.password_hash;
END;
$$;

-- Descripcion: Desactiva un usuario sin eliminar sus relaciones historicas.
-- Por que usarlo: conserva autoria de senales, contenidos y validaciones.
CREATE OR REPLACE FUNCTION sp_deactivate_user(
    p_user_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET
        active = FALSE,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_user = p_user_id
      AND active IS TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado o ya inactivo';
    END IF;
END;
$$;



-- Descripcion: Registra el momento del ultimo login exitoso.
-- Debe llamarse despues de validar la contrasena en el backend.

CREATE OR REPLACE FUNCTION sp_register_user_login(
    p_user_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET
        last_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_user = p_user_id
      AND active IS TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado o inactivo';
    END IF;
END;
$$;



-- Descripcion: Asigna un rol existente a un usuario existente.
-- Por que usarlo: encapsula el alta en user_roles y evita duplicados con ON CONFLICT.
CREATE OR REPLACE FUNCTION sp_assign_role_to_user(
    p_user_id BIGINT,
    p_role_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_role_id SMALLINT;
BEGIN
    SELECT id_role
    INTO v_role_id
    FROM roles
    WHERE name = btrim(p_role_name);

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'No existe el rol "%"', p_role_name;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id_user = p_user_id) THEN
        RAISE EXCEPTION 'No existe el usuario %', p_user_id;
    END IF;

    INSERT INTO user_roles (id_user, id_role)
    VALUES (p_user_id, v_role_id)
    ON CONFLICT DO NOTHING;
END;
$$;



-- Descripcion: Asigna un permiso existente a un rol existente.
-- Por que usarlo: mantiene la gestion RBAC dentro de la base sin repetir joins en la API.
CREATE OR REPLACE FUNCTION sp_grant_permission_to_role(
    p_role_name TEXT,
    p_permission_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_role_id SMALLINT;
    v_permission_id SMALLINT;
BEGIN
    SELECT id_role
    INTO v_role_id
    FROM roles
    WHERE name = btrim(p_role_name);

    SELECT id_permission
    INTO v_permission_id
    FROM permissions
    WHERE code = btrim(p_permission_code);

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'No existe el rol "%"', p_role_name;
    END IF;

    IF v_permission_id IS NULL THEN
        RAISE EXCEPTION 'No existe el permiso "%"', p_permission_code;
    END IF;

    INSERT INTO role_permissions (id_role, id_permission)
    VALUES (v_role_id, v_permission_id)
    ON CONFLICT DO NOTHING;
END;
$$;



------------------------------------------------------------
-- FUENTES Y VIGILANCIA TECNOLOGICA
------------------------------------------------------------



-- Descripcion: Registra una fuente de informacion para vigilancia tecnologica.
-- Ejemplo:
-- SELECT sp_create_source('NEWS', 'Semiconductor Today', 'https://example.com');
CREATE OR REPLACE FUNCTION sp_create_source(
    p_source_type_code TEXT,
    p_name TEXT,
    p_website TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_rss_url TEXT DEFAULT NULL,
    p_api_url TEXT DEFAULT NULL,
    p_reliability NUMERIC DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_id BIGINT;
BEGIN
    INSERT INTO sources (
        id_source_type,
        name,
        website,
        country,
        rss_url,
        api_url,
        reliability
    )
    VALUES (
        get_catalog_id('source_types', p_source_type_code),
        btrim(p_name),
        NULLIF(btrim(COALESCE(p_website, '')), ''),
        NULLIF(btrim(COALESCE(p_country, '')), ''),
        NULLIF(btrim(COALESCE(p_rss_url, '')), ''),
        NULLIF(btrim(COALESCE(p_api_url, '')), ''),
        p_reliability
    )
    RETURNING id_source INTO v_source_id;

    RETURN v_source_id;
END;
$$;



-- Descripcion: Actualiza una fuente activa.
-- Por que usarlo: replica el patron de actualizar registros activos del archivo de referencia.
CREATE OR REPLACE FUNCTION sp_update_source(
    p_source_id BIGINT,
    p_source_type_code TEXT,
    p_name TEXT,
    p_website TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_rss_url TEXT DEFAULT NULL,
    p_api_url TEXT DEFAULT NULL,
    p_reliability NUMERIC DEFAULT NULL,
    p_active BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sources
    SET
        id_source_type = get_catalog_id('source_types', p_source_type_code),
        name = btrim(p_name),
        website = NULLIF(btrim(COALESCE(p_website, '')), ''),
        country = NULLIF(btrim(COALESCE(p_country, '')), ''),
        rss_url = NULLIF(btrim(COALESCE(p_rss_url, '')), ''),
        api_url = NULLIF(btrim(COALESCE(p_api_url, '')), ''),
        reliability = p_reliability,
        active = p_active,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_source = p_source_id
      AND active IS TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fuente no encontrada o inactiva';
    END IF;
END;
$$;



-- Descripcion: Desactiva una fuente sin borrar senales capturadas desde ella.
CREATE OR REPLACE FUNCTION sp_deactivate_source(
    p_source_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sources
    SET
        active = FALSE,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_source = p_source_id
      AND active IS TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fuente no encontrada o ya inactiva';
    END IF;
END;
$$;



-- Descripcion: Crea una senal de vigilancia tecnologica con codigos de catalogo legibles.
-- Por que usarlo: el backend puede enviar codigos como 'WEAK', 'HIGH' o 'GLOBAL'
-- sin resolver manualmente los IDs de catalogo.
-- Ejemplo:
-- SELECT sp_create_signal(
--     'Nueva inversion en empaque avanzado',
--     'Anuncio de expansion con impacto regional',
--     '2026-07-08',
--     'https://fuente.example/noticia',
--     2,
--     1,
--     'STRONG',
--     'HIGH',
--     'MEDIUM',
--     'NATIONAL',
--     1
-- );
CREATE OR REPLACE FUNCTION sp_create_signal(
    p_title TEXT,
    p_summary TEXT,
    p_publication_date DATE,
    p_evidence_url TEXT,
    p_category_id SMALLINT,
    p_source_id BIGINT,
    p_signal_type_code TEXT,
    p_impact_code TEXT,
    p_urgency_code TEXT,
    p_scope_code TEXT,
    p_analyst_id BIGINT,
    p_capture_date DATE DEFAULT CURRENT_DATE,
    p_business_code TEXT DEFAULT NULL,
    p_ips NUMERIC DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_status_code TEXT DEFAULT 'NEW'
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_signal_id BIGINT;
    v_business_code TEXT;
BEGIN
    p_capture_date := COALESCE(p_capture_date, CURRENT_DATE);

    IF p_publication_date > p_capture_date THEN
        RAISE EXCEPTION 'La fecha de publicacion no puede ser posterior a la fecha de captura';
    END IF;

    v_signal_id := nextval(pg_get_serial_sequence('signals', 'id_signal'));
    v_business_code := COALESCE(
        NULLIF(btrim(COALESCE(p_business_code, '')), ''),
        'SIG-' || to_char(p_capture_date, 'YYYY') || '-' || lpad(v_signal_id::TEXT, 6, '0')
    );

    INSERT INTO signals (
        id_signal,
        business_code,
        title,
        summary,
        publication_date,
        capture_date,
        evidence_url,
        ips,
        id_category,
        id_source,
        id_signal_type,
        id_impact,
        id_urgency,
        id_scope,
        id_signal_status,
        id_analyst,
        notes
    )
    VALUES (
        v_signal_id,
        v_business_code,
        btrim(p_title),
        p_summary,
        p_publication_date,
        p_capture_date,
        btrim(p_evidence_url),
        p_ips,
        p_category_id,
        p_source_id,
        get_catalog_id('signal_types', p_signal_type_code),
        get_catalog_id('impacts', p_impact_code),
        get_catalog_id('urgencies', p_urgency_code),
        get_catalog_id('scopes', p_scope_code),
        get_catalog_id('signal_statuses', p_status_code),
        p_analyst_id,
        p_notes
    );

    RETURN v_signal_id;
END;
$$;



-- Descripcion: Cambia el estado de una senal y registra validador/fecha cuando aplica.
-- Similar al cambio de estado de tickets, pero sin historial dedicado porque aun no existe
-- una tabla de auditoria de estados en este esquema.
CREATE OR REPLACE FUNCTION sp_update_signal_status(
    p_signal_id BIGINT,
    p_status_code TEXT,
    p_validator_id BIGINT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_id SMALLINT;
    v_status_code TEXT;
BEGIN
    v_status_code := upper(btrim(p_status_code));
    v_status_id := get_catalog_id('signal_statuses', v_status_code);

    UPDATE signals
    SET
        id_signal_status = v_status_id,
        id_validator = COALESCE(p_validator_id, id_validator),
        validation_date = CASE
            WHEN v_status_code IN ('VALIDATED', 'LINKED_TO_TREND', 'ESCALATED_TO_ALERT')
                THEN COALESCE(validation_date, CURRENT_DATE)
            ELSE validation_date
        END,
        notes = COALESCE(p_notes, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE id_signal = p_signal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la senal %', p_signal_id;
    END IF;
END;
$$;



-- Descripcion: Crea una tendencia para agrupar senales relacionadas.
-- Por que usarlo: permite mantener el flujo del MVP de vigilancia tecnologica sin
-- automatizar aun la generacion de tendencias.
CREATE OR REPLACE FUNCTION sp_create_trend(
    p_title TEXT,
    p_narrative TEXT,
    p_analyst_id BIGINT DEFAULT NULL,
    p_implications TEXT DEFAULT NULL,
    p_first_signal_date DATE DEFAULT NULL,
    p_direction_code TEXT DEFAULT NULL,
    p_maturity_code TEXT DEFAULT NULL,
    p_status_code TEXT DEFAULT 'NEW',
    p_business_code TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_trend_id BIGINT;
    v_business_code TEXT;
BEGIN
    v_trend_id := nextval(pg_get_serial_sequence('trends', 'id_trend'));
    v_business_code := COALESCE(
        NULLIF(btrim(COALESCE(p_business_code, '')), ''),
        'TRE-' || to_char(COALESCE(p_first_signal_date, CURRENT_DATE), 'YYYY') || '-' || lpad(v_trend_id::TEXT, 6, '0')
    );

    INSERT INTO trends (
        id_trend,
        business_code,
        title,
        narrative,
        implications,
        first_signal_date,
        id_trend_direction,
        id_trend_maturity,
        id_trend_status,
        id_analyst
    )
    VALUES (
        v_trend_id,
        v_business_code,
        btrim(p_title),
        p_narrative,
        p_implications,
        p_first_signal_date,
        CASE WHEN p_direction_code IS NULL THEN NULL ELSE get_catalog_id('trend_directions', p_direction_code) END,
        CASE WHEN p_maturity_code IS NULL THEN NULL ELSE get_catalog_id('trend_maturity', p_maturity_code) END,
        get_catalog_id('trend_statuses', p_status_code),
        p_analyst_id
    );

    RETURN v_trend_id;
END;
$$;



-- Descripcion: Cambia el estado de una tendencia existente.
-- Ejemplo:
-- SELECT sp_update_trend_status(3, 'VALIDATED');
CREATE OR REPLACE FUNCTION sp_update_trend_status(
    p_trend_id BIGINT,
    p_status_code TEXT,
    p_implications TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE trends
    SET
        id_trend_status = get_catalog_id('trend_statuses', p_status_code),
        implications = COALESCE(p_implications, implications),
        updated_at = CURRENT_TIMESTAMP
    WHERE id_trend = p_trend_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tendencia no encontrada';
    END IF;
END;
$$;



-- Descripcion: Vincula una senal con una tendencia y recalcula la primera fecha observada.
-- Por que usarlo: expresa la regla central de vigilancia del observatorio:
-- varias senales pueden sostener una tendencia.
-- Ejemplo:
-- SELECT sp_link_signal_to_trend(10, 3);
CREATE OR REPLACE FUNCTION sp_link_signal_to_trend(
    p_signal_id BIGINT,
    p_trend_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_linked_status_id SMALLINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM signals WHERE id_signal = p_signal_id) THEN
        RAISE EXCEPTION 'No existe la senal %', p_signal_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM trends WHERE id_trend = p_trend_id) THEN
        RAISE EXCEPTION 'No existe la tendencia %', p_trend_id;
    END IF;

    INSERT INTO signal_trends (id_signal, id_trend)
    VALUES (p_signal_id, p_trend_id)
    ON CONFLICT DO NOTHING;

    UPDATE trends
    SET
        first_signal_date = (
            SELECT MIN(s.publication_date)
            FROM signal_trends st
            INNER JOIN signals s ON s.id_signal = st.id_signal
            WHERE st.id_trend = p_trend_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id_trend = p_trend_id;

    v_linked_status_id := get_catalog_id('signal_statuses', 'LINKED_TO_TREND');

    UPDATE signals
    SET
        id_signal_status = v_linked_status_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_signal = p_signal_id;
END;
$$;



-- Descripcion: Crea una alerta manual, sin automatizacion de alerta temprana.
-- Por que usarlo: el MVP contempla alertas como entidad, pero la automatizacion queda
-- para una fase posterior; este procedimiento permite registro curado por analistas.
CREATE OR REPLACE FUNCTION sp_create_manual_alert(
    p_title TEXT,
    p_executive_summary TEXT,
    p_generation_date DATE,
    p_creator_id BIGINT,
    p_level_code TEXT DEFAULT NULL,
    p_status_code TEXT DEFAULT 'NEW',
    p_implications TEXT DEFAULT NULL,
    p_recommendations TEXT DEFAULT NULL,
    p_response_deadline DATE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_business_code TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_alert_id BIGINT;
    v_business_code TEXT;
BEGIN
    IF p_response_deadline IS NOT NULL AND p_response_deadline < p_generation_date THEN
        RAISE EXCEPTION 'La fecha limite de respuesta no puede ser anterior a la fecha de generacion';
    END IF;

    v_alert_id := nextval(pg_get_serial_sequence('alerts', 'id_alert'));
    v_business_code := COALESCE(
        NULLIF(btrim(COALESCE(p_business_code, '')), ''),
        'ALT-' || to_char(p_generation_date, 'YYYY') || '-' || lpad(v_alert_id::TEXT, 6, '0')
    );

    INSERT INTO alerts (
        id_alert,
        business_code,
        title,
        executive_summary,
        implications,
        recommendations,
        generation_date,
        response_deadline,
        id_alert_level,
        id_alert_status,
        id_alert_origin,
        notes,
        id_creator
    )
    VALUES (
        v_alert_id,
        v_business_code,
        btrim(p_title),
        p_executive_summary,
        p_implications,
        p_recommendations,
        p_generation_date,
        p_response_deadline,
        CASE WHEN p_level_code IS NULL THEN NULL ELSE get_catalog_id('alert_levels', p_level_code) END,
        get_catalog_id('alert_statuses', p_status_code),
        get_catalog_id('alert_origins', 'MANUAL'),
        p_notes,
        p_creator_id
    );

    RETURN v_alert_id;
END;
$$;



-- Descripcion: Cambia el estado de una alerta y completa fechas de validacion/publicacion.
-- Ejemplo:
-- SELECT sp_update_alert_status(5, 'PUBLISHED', 2, 'Lista para boletin');

CREATE OR REPLACE FUNCTION sp_update_alert_status(
    p_alert_id BIGINT,
    p_status_code TEXT,
    p_validator_id BIGINT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_code TEXT;
BEGIN
    v_status_code := upper(btrim(p_status_code));

    UPDATE alerts
    SET
        id_alert_status = get_catalog_id('alert_statuses', v_status_code),
        id_validator = COALESCE(p_validator_id, id_validator),
        validation_date = CASE
            WHEN v_status_code IN ('VALIDATED', 'PUBLISHED', 'CLOSED')
                THEN COALESCE(validation_date, CURRENT_DATE)
            ELSE validation_date
        END,
        publication_date = CASE
            WHEN v_status_code = 'PUBLISHED'
                THEN COALESCE(publication_date, CURRENT_DATE)
            ELSE publication_date
        END,
        notes = COALESCE(p_notes, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE id_alert = p_alert_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alerta no encontrada';
    END IF;
END;
$$;

------------------------------------------------------------
-- CMS EDITORIAL
------------------------------------------------------------

-- Descripcion: Registra un archivo del CMS, como imagen, documento, dataset o recurso.
-- Por que usarlo: centraliza validaciones simples de archivos antes de asociarlos a contenido.
CREATE OR REPLACE FUNCTION sp_create_media(
    p_filename TEXT,
    p_storage_path TEXT,
    p_original_filename TEXT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL,
    p_extension TEXT DEFAULT NULL,
    p_size_bytes BIGINT DEFAULT NULL,
    p_checksum TEXT DEFAULT NULL,
    p_uploaded_by BIGINT DEFAULT NULL,
    p_is_public BOOLEAN DEFAULT TRUE,
    p_storage_provider TEXT DEFAULT NULL,
    p_storage_bucket TEXT DEFAULT NULL,
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_media_id BIGINT;
BEGIN
    IF p_size_bytes IS NOT NULL AND p_size_bytes < 0 THEN
        RAISE EXCEPTION 'El tamano del archivo no puede ser negativo';
    END IF;

    INSERT INTO media (
        filename,
        original_filename,
        mime_type,
        extension,
        storage_path,
        size_bytes,
        checksum,
        uploaded_by,
        is_public,
        storage_provider,
        storage_bucket,
        created_by
    )
    VALUES (
        btrim(p_filename),
        NULLIF(btrim(COALESCE(p_original_filename, '')), ''),
        NULLIF(btrim(COALESCE(p_mime_type, '')), ''),
        NULLIF(lower(ltrim(btrim(COALESCE(p_extension, '')), '.')), ''),
        btrim(p_storage_path),
        p_size_bytes,
        NULLIF(lower(btrim(COALESCE(p_checksum, ''))), ''),
        p_uploaded_by,
        p_is_public,
        NULLIF(btrim(COALESCE(p_storage_provider, '')), ''),
        NULLIF(btrim(COALESCE(p_storage_bucket, '')), ''),
        p_created_by
    )
    RETURNING id_media INTO v_media_id;

    RETURN v_media_id;
END;
$$;



-- Descripcion: Crea una pieza de contenido editorial del observatorio.
-- Por que usarlo: sirve como entrada comun para noticias, reportes, recursos, paginas,
-- eventos y otros tipos definidos en content_types.
-- Ejemplo:
-- SELECT sp_create_content(
--     'NEWS',
--     'DRAFT',
--     1,
--     'Nueva inversion en semiconductores',
--     'Resumen publico de la noticia'
-- );

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
    v_slug TEXT;
BEGIN
    v_content_id := nextval(pg_get_serial_sequence('content', 'id_content'));
    v_slug := normalize_slug(COALESCE(NULLIF(p_slug, ''), p_title));

    IF v_slug = '' THEN
        v_slug := 'contenido-' || v_content_id::TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM content WHERE slug = v_slug) THEN
        v_slug := v_slug || '-' || v_content_id::TEXT;
    END IF;

    INSERT INTO content (
        id_content,
        content_type_id,
        status_id,
        author_id,
        title,
        slug,
        summary,
        featured_media_id,
        published_at
    )
    VALUES (
        v_content_id,
        get_catalog_id('content_types', p_content_type_code),
        get_catalog_id('content_statuses', p_status_code),
        p_author_id,
        btrim(p_title),
        v_slug,
        p_summary,
        p_featured_media_id,
        CASE WHEN upper(btrim(p_status_code)) = 'PUBLISHED' THEN CURRENT_TIMESTAMP ELSE NULL END
    );

    RETURN v_content_id;
END;
$$;



-- Descripcion: Crea una nueva version editorial de un contenido.
-- Por que usarlo: permite editar sin perder historial de versiones publicables.
-- Ejemplo:
-- SELECT sp_create_content_version(12, 1, 'Primer borrador editorial');
CREATE OR REPLACE FUNCTION sp_create_content_version(
    p_content_id BIGINT,
    p_created_by BIGINT,
    p_change_summary TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_content_version_id BIGINT;
    v_version_number INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM content WHERE id_content = p_content_id) THEN
        RAISE EXCEPTION 'No existe el contenido %', p_content_id;
    END IF;

    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM content_version
    WHERE content_id = p_content_id;

    INSERT INTO content_version (
        content_id,
        version_number,
        created_by,
        change_summary
    )
    VALUES (
        p_content_id,
        v_version_number,
        p_created_by,
        p_change_summary
    )
    RETURNING id_content_version INTO v_content_version_id;

    UPDATE content
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id_content = p_content_id;

    RETURN v_content_version_id;
END;
$$;



-- Descripcion: Agrega una seccion ordenada a una version de contenido.
-- Por que usarlo: estructura piezas largas como reportes, paginas y boletines.
-- Ejemplo:
-- SELECT sp_add_content_section(7, 'summary', 'Resumen ejecutivo');
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
    IF NOT EXISTS (
        SELECT 1
        FROM content_version
        WHERE id_content_version = p_content_version_id
    ) THEN
        RAISE EXCEPTION 'No existe la version de contenido %', p_content_version_id;
    END IF;

    SELECT COALESCE(MAX(position), 0) + 1
    INTO v_position
    FROM content_section
    WHERE content_version_id = p_content_version_id;

    INSERT INTO content_section (
        content_version_id,
        title,
        section_type_id,
        position,
        is_collapsible,
        is_visible,
        settings
    )
    VALUES (
        p_content_version_id,
        p_title,
        get_catalog_id('section_types', p_section_type_code),
        COALESCE(p_position, v_position),
        p_is_collapsible,
        p_is_visible,
        COALESCE(p_settings, '{}'::jsonb)
    )
    RETURNING id_content_section INTO v_section_id;

    RETURN v_section_id;
END;
$$;



-- Descripcion: Agrega un bloque editorial dentro de una seccion.
-- Por que usarlo: permite construir contenido modular con bloques JSONB.
-- Ejemplo:
-- SELECT sp_add_content_block(
--     15,
--     'paragraph',
--     '{"text":"Mexico fortalece su ecosistema de semiconductores."}'::jsonb
-- );
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
    v_block_id BIGINT;
    v_position INTEGER;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM content_section
        WHERE id_content_section = p_section_id
    ) THEN
        RAISE EXCEPTION 'No existe la seccion de contenido %', p_section_id;
    END IF;

    SELECT COALESCE(MAX(position), 0) + 1
    INTO v_position
    FROM content_block
    WHERE section_id = p_section_id;

    INSERT INTO content_block (
        section_id,
        block_type_id,
        position,
        data,
        settings,
        is_visible,
        css_class
    )
    VALUES (
        p_section_id,
        get_catalog_id('block_type', p_block_type_code),
        COALESCE(p_position, v_position),
        p_data,
        COALESCE(p_settings, '{}'::jsonb),
        p_is_visible,
        p_css_class
    )
    RETURNING id_content_block INTO v_block_id;

    RETURN v_block_id;
END;
$$;



-- Descripcion: Publica un contenido cambiando su estado a PUBLISHED.
-- Por que usarlo: garantiza que published_at se asigne una sola vez si estaba vacio.
CREATE OR REPLACE FUNCTION sp_publish_content(
    p_content_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE content
    SET
        status_id = get_catalog_id('content_statuses', 'PUBLISHED'),
        published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    WHERE id_content = p_content_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe el contenido %', p_content_id;
    END IF;
END;
$$;



-- Descripcion: Relaciona un contenido editorial con una senal de vigilancia.
-- Por que usarlo: conecta noticias/reportes con evidencia primaria del observatorio.
CREATE OR REPLACE FUNCTION sp_link_content_to_signal(
    p_content_id BIGINT,
    p_signal_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO content_signal (content_id, signal_id)
    VALUES (p_content_id, p_signal_id)
    ON CONFLICT DO NOTHING;

    UPDATE content
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id_content = p_content_id;
END;
$$;



-- Descripcion: Relaciona un contenido editorial con una tendencia.
-- Por que usarlo: permite que reportes y publicaciones expliquen tendencias detectadas.
CREATE OR REPLACE FUNCTION sp_link_content_to_trend(
    p_content_id BIGINT,
    p_trend_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO content_trend (content_id, trend_id)
    VALUES (p_content_id, p_trend_id)
    ON CONFLICT DO NOTHING;

    UPDATE content
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id_content = p_content_id;
END;
$$;



-- Descripcion: Relaciona un contenido editorial con una alerta.
-- Por que usarlo: conserva trazabilidad entre publicaciones y alertas curadas.
CREATE OR REPLACE FUNCTION sp_link_content_to_alert(
    p_content_id BIGINT,
    p_alert_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO content_alert (content_id, alert_id)
    VALUES (p_content_id, p_alert_id)
    ON CONFLICT DO NOTHING;

    UPDATE content
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id_content = p_content_id;
END;
$$;



------------------------------------------------------------
-- CONSULTA GENERAL Y DASHBOARD
------------------------------------------------------------

-- Descripcion: Busca contenido editorial por texto y opcionalmente por tipo.
-- Por que usarlo: cubre la primera version del buscador inteligente sin introducir
-- todavia un motor externo de busqueda.
-- Ejemplo:
-- SELECT * FROM sp_search_content('inversion', 'NEWS', 10, 0);
CREATE OR REPLACE FUNCTION sp_search_content(
    p_query TEXT,
    p_content_type_code TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id_content BIGINT,
    title TEXT,
    slug TEXT,
    summary TEXT,
    content_type_code TEXT,
    status_code TEXT,
    published_at TIMESTAMP,
    updated_at TIMESTAMP
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id_content,
        c.title::TEXT,
        c.slug::TEXT,
        c.summary,
        ct.code::TEXT AS content_type_code,
        cs.code::TEXT AS status_code,
        c.published_at,
        c.updated_at
    FROM content c
    INNER JOIN content_types ct ON ct.id_content_type = c.content_type_id
    INNER JOIN content_statuses cs ON cs.id_content_status = c.status_id
    WHERE
        (
            p_query IS NULL
            OR btrim(p_query) = ''
            OR c.title ILIKE '%' || btrim(p_query) || '%'
            OR COALESCE(c.summary, '') ILIKE '%' || btrim(p_query) || '%'
        )
        AND (
            p_content_type_code IS NULL
            OR ct.code = upper(btrim(p_content_type_code))
        )
    ORDER BY c.updated_at DESC, c.id_content DESC
    LIMIT GREATEST(COALESCE(p_limit, 20), 1)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;



-- Descripcion: Devuelve metricas agregadas basicas para el dashboard ejecutivo.
-- Por que usarlo: ofrece una respuesta compacta para tarjetas iniciales del MVP.
-- Ejemplo:
-- SELECT * FROM sp_dashboard_summary();
CREATE OR REPLACE FUNCTION sp_dashboard_summary()
RETURNS TABLE (
    metric TEXT,
    value BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 'signals_total', COUNT(*)::BIGINT FROM signals
    UNION ALL
    SELECT 'trends_total', COUNT(*)::BIGINT FROM trends
    UNION ALL
    SELECT 'sources_active', COUNT(*)::BIGINT FROM sources WHERE active IS TRUE
    UNION ALL
    SELECT 'published_content', COUNT(*)::BIGINT
    FROM content c
    INNER JOIN content_statuses cs ON cs.id_content_status = c.status_id
    WHERE cs.code = 'PUBLISHED'
    UNION ALL
    SELECT 'news_total', COUNT(*)::BIGINT
    FROM content c
    INNER JOIN content_types ct ON ct.id_content_type = c.content_type_id
    WHERE ct.code = 'NEWS'
    UNION ALL
    SELECT 'resources_total', COUNT(*)::BIGINT
    FROM content c
    INNER JOIN content_types ct ON ct.id_content_type = c.content_type_id
    WHERE ct.code = 'RESOURCE'
    UNION ALL
    SELECT 'reports_total', COUNT(*)::BIGINT
    FROM content c
    INNER JOIN content_types ct ON ct.id_content_type = c.content_type_id
    WHERE ct.code = 'REPORT';
END;
$$;