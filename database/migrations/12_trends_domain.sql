-- Fase 3: reglas de dominio, historial y relaciones de tendencias.

ALTER TABLE trends
    ADD COLUMN id_validator BIGINT REFERENCES users(id_user),
    ADD COLUMN validation_date DATE,
    ADD COLUMN methodology_notes TEXT;

CREATE TABLE trend_status_history (
    id_trend_status_history BIGSERIAL PRIMARY KEY,
    id_trend BIGINT NOT NULL REFERENCES trends(id_trend) ON DELETE CASCADE,
    from_status_id SMALLINT REFERENCES trend_statuses(id_trend_status),
    to_status_id SMALLINT NOT NULL REFERENCES trend_statuses(id_trend_status),
    transition_code VARCHAR(40) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id_user),
    notes TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO trend_status_history (
    id_trend,
    from_status_id,
    to_status_id,
    transition_code,
    changed_by,
    notes,
    changed_at
)
SELECT
    t.id_trend,
    NULL,
    t.id_trend_status,
    'MIGRATED',
    t.id_analyst,
    'Estado inicial registrado durante la migración de tendencias.',
    t.created_at
FROM trends t
WHERE t.id_analyst IS NOT NULL;

CREATE OR REPLACE FUNCTION recalculate_trend_first_signal_date(
    p_trend_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
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
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_trend_v2(
    p_title TEXT,
    p_narrative TEXT,
    p_analyst_id BIGINT,
    p_implications TEXT DEFAULT NULL,
    p_direction_code TEXT DEFAULT NULL,
    p_maturity_code TEXT DEFAULT NULL,
    p_methodology_notes TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_trend_id BIGINT;
    v_status_id SMALLINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id_user = p_analyst_id AND active
    ) THEN
        RAISE EXCEPTION 'El analista indicado no existe o está inactivo';
    END IF;

    v_status_id := get_catalog_id('trend_statuses', 'NEW');
    v_trend_id := nextval(pg_get_serial_sequence('trends', 'id_trend'));

    INSERT INTO trends (
        id_trend,
        business_code,
        title,
        narrative,
        implications,
        id_trend_direction,
        id_trend_maturity,
        id_trend_status,
        id_analyst,
        methodology_notes
    ) VALUES (
        v_trend_id,
        'TRE-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(v_trend_id::TEXT, 6, '0'),
        btrim(p_title),
        btrim(p_narrative),
        NULLIF(btrim(COALESCE(p_implications, '')), ''),
        CASE
            WHEN p_direction_code IS NULL THEN NULL
            ELSE get_catalog_id('trend_directions', p_direction_code)
        END,
        CASE
            WHEN p_maturity_code IS NULL THEN NULL
            ELSE get_catalog_id('trend_maturity', p_maturity_code)
        END,
        v_status_id,
        p_analyst_id,
        NULLIF(btrim(COALESCE(p_methodology_notes, '')), '')
    );

    INSERT INTO trend_status_history (
        id_trend,
        from_status_id,
        to_status_id,
        transition_code,
        changed_by
    ) VALUES (
        v_trend_id,
        NULL,
        v_status_id,
        'CREATED',
        p_analyst_id
    );

    RETURN v_trend_id;
END;
$$;

-- Conserva la firma anterior, pero obliga a crear en NEW y delega el cálculo de fecha.
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
BEGIN
    IF COALESCE(upper(btrim(p_status_code)), 'NEW') <> 'NEW' THEN
        RAISE EXCEPTION 'Las tendencias deben crearse en estado NEW';
    END IF;

    RETURN sp_create_trend_v2(
        p_title,
        p_narrative,
        p_analyst_id,
        p_implications,
        p_direction_code,
        p_maturity_code,
        NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION sp_link_signal_to_trend(
    p_signal_id BIGINT,
    p_trend_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_code TEXT;
BEGIN
    SELECT ts.code INTO v_status_code
    FROM trends t
    INNER JOIN trend_statuses ts
        ON ts.id_trend_status = t.id_trend_status
    WHERE t.id_trend = p_trend_id
    FOR UPDATE OF t;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la tendencia %', p_trend_id;
    END IF;

    IF v_status_code <> 'NEW' THEN
        RAISE EXCEPTION 'Solo pueden modificarse relaciones de tendencias NEW';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM signals WHERE id_signal = p_signal_id) THEN
        RAISE EXCEPTION 'No existe la señal %', p_signal_id;
    END IF;

    INSERT INTO signal_trends (id_signal, id_trend)
    VALUES (p_signal_id, p_trend_id)
    ON CONFLICT DO NOTHING;

    PERFORM recalculate_trend_first_signal_date(p_trend_id);
END;
$$;

CREATE OR REPLACE FUNCTION sp_unlink_signal_from_trend(
    p_signal_id BIGINT,
    p_trend_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_code TEXT;
BEGIN
    SELECT ts.code INTO v_status_code
    FROM trends t
    INNER JOIN trend_statuses ts
        ON ts.id_trend_status = t.id_trend_status
    WHERE t.id_trend = p_trend_id
    FOR UPDATE OF t;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la tendencia %', p_trend_id;
    END IF;

    IF v_status_code <> 'NEW' THEN
        RAISE EXCEPTION 'Solo pueden modificarse relaciones de tendencias NEW';
    END IF;

    DELETE FROM signal_trends
    WHERE id_signal = p_signal_id
      AND id_trend = p_trend_id;

    PERFORM recalculate_trend_first_signal_date(p_trend_id);
END;
$$;

CREATE OR REPLACE FUNCTION sp_link_actor_to_trend(
    p_actor_id BIGINT,
    p_trend_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_code TEXT;
BEGIN
    SELECT ts.code INTO v_status_code
    FROM trends t
    INNER JOIN trend_statuses ts
        ON ts.id_trend_status = t.id_trend_status
    WHERE t.id_trend = p_trend_id
    FOR UPDATE OF t;

    IF NOT FOUND OR v_status_code <> 'NEW' THEN
        RAISE EXCEPTION 'Solo pueden modificarse actores de tendencias NEW';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM actors WHERE id_actor = p_actor_id) THEN
        RAISE EXCEPTION 'No existe el actor %', p_actor_id;
    END IF;

    INSERT INTO trend_actors (id_trend, id_actor)
    VALUES (p_trend_id, p_actor_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION sp_unlink_actor_from_trend(
    p_actor_id BIGINT,
    p_trend_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_code TEXT;
BEGIN
    SELECT ts.code INTO v_status_code
    FROM trends t
    INNER JOIN trend_statuses ts
        ON ts.id_trend_status = t.id_trend_status
    WHERE t.id_trend = p_trend_id
    FOR UPDATE OF t;

    IF NOT FOUND OR v_status_code <> 'NEW' THEN
        RAISE EXCEPTION 'Solo pueden modificarse actores de tendencias NEW';
    END IF;

    DELETE FROM trend_actors
    WHERE id_actor = p_actor_id
      AND id_trend = p_trend_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_transition_trend(
    p_trend_id BIGINT,
    p_transition_code TEXT,
    p_actor_id BIGINT,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_trend trends%ROWTYPE;
    v_from_code TEXT;
    v_to_code TEXT;
    v_to_status_id SMALLINT;
    v_transition_code TEXT;
    v_signal_count INTEGER;
    v_invalid_signal_count INTEGER;
    v_source_count INTEGER;
    v_fcv_count INTEGER;
BEGIN
    SELECT * INTO v_trend
    FROM trends
    WHERE id_trend = p_trend_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la tendencia %', p_trend_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id_user = p_actor_id AND active) THEN
        RAISE EXCEPTION 'El usuario de la transición no existe o está inactivo';
    END IF;

    SELECT code INTO v_from_code
    FROM trend_statuses
    WHERE id_trend_status = v_trend.id_trend_status;

    v_transition_code := upper(btrim(p_transition_code));
    v_to_code := CASE
        WHEN v_transition_code = 'SUBMIT_FOR_REVIEW' AND v_from_code = 'NEW'
            THEN 'UNDER_REVIEW'
        WHEN v_transition_code = 'REQUEST_CHANGES' AND v_from_code = 'UNDER_REVIEW'
            THEN 'NEW'
        WHEN v_transition_code = 'VALIDATE' AND v_from_code = 'UNDER_REVIEW'
            THEN 'VALIDATED'
        WHEN v_transition_code = 'REOPEN' AND v_from_code IN ('VALIDATED', 'ACTIVE')
            THEN 'UNDER_REVIEW'
        WHEN v_transition_code = 'ACTIVATE' AND v_from_code = 'VALIDATED'
            THEN 'ACTIVE'
        WHEN v_transition_code = 'ARCHIVE'
             AND v_from_code IN ('NEW', 'UNDER_REVIEW', 'VALIDATED', 'ACTIVE')
            THEN 'ARCHIVED'
        ELSE NULL
    END;

    IF v_to_code IS NULL THEN
        RAISE EXCEPTION 'Transición % no permitida desde el estado %',
            v_transition_code, v_from_code;
    END IF;

    IF v_transition_code = 'SUBMIT_FOR_REVIEW' THEN
        SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE ss.code <> 'VALIDATED'),
            COUNT(DISTINCT s.id_source),
            COUNT(DISTINCT c.id_fcv)
        INTO
            v_signal_count,
            v_invalid_signal_count,
            v_source_count,
            v_fcv_count
        FROM signal_trends st
        INNER JOIN signals s ON s.id_signal = st.id_signal
        INNER JOIN signal_statuses ss
            ON ss.id_signal_status = s.id_signal_status
        INNER JOIN categories c ON c.id_category = s.id_category
        WHERE st.id_trend = p_trend_id;

        IF v_trend.id_trend_direction IS NULL OR v_trend.id_trend_maturity IS NULL THEN
            RAISE EXCEPTION 'La dirección y madurez deben confirmarse antes de revisión';
        END IF;

        IF v_signal_count < 3 THEN
            RAISE EXCEPTION 'Una tendencia requiere al menos tres señales';
        END IF;

        IF v_invalid_signal_count > 0 THEN
            RAISE EXCEPTION 'Todas las señales deben estar validadas';
        END IF;

        IF v_source_count < 2 THEN
            RAISE EXCEPTION 'Una tendencia requiere al menos dos fuentes distintas';
        END IF;

        IF v_fcv_count > 1 AND v_trend.methodology_notes IS NULL THEN
            RAISE EXCEPTION 'Debe justificarse la combinación de múltiples FCV';
        END IF;
    END IF;

    IF v_transition_code = 'VALIDATE' AND p_actor_id = v_trend.id_analyst THEN
        RAISE EXCEPTION 'El validador debe ser distinto del analista de la tendencia';
    END IF;

    v_to_status_id := get_catalog_id('trend_statuses', v_to_code);

    UPDATE trends
    SET
        id_trend_status = v_to_status_id,
        id_validator = CASE
            WHEN v_transition_code = 'VALIDATE' THEN p_actor_id
            WHEN v_transition_code IN ('REQUEST_CHANGES', 'REOPEN') THEN NULL
            ELSE id_validator
        END,
        validation_date = CASE
            WHEN v_transition_code = 'VALIDATE' THEN CURRENT_DATE
            WHEN v_transition_code IN ('REQUEST_CHANGES', 'REOPEN') THEN NULL
            ELSE validation_date
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_trend = p_trend_id;

    INSERT INTO trend_status_history (
        id_trend,
        from_status_id,
        to_status_id,
        transition_code,
        changed_by,
        notes
    ) VALUES (
        p_trend_id,
        v_trend.id_trend_status,
        v_to_status_id,
        v_transition_code,
        p_actor_id,
        NULLIF(btrim(COALESCE(p_notes, '')), '')
    );
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_trend_status(
    p_trend_id BIGINT,
    p_status_code TEXT,
    p_implications TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Use sp_transition_trend para cambiar el estado de una tendencia';
END;
$$;

CREATE INDEX IF NOT EXISTS idx_trends_validator
    ON trends (id_validator)
    WHERE id_validator IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trend_status_history_trend_changed
    ON trend_status_history (id_trend, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_status_history_actor
    ON trend_status_history (changed_by);
