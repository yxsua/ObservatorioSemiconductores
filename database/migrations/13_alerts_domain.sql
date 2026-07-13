-- Fase 4: reglas, relaciones e historial de alertas manuales.

ALTER TABLE alerts
    ADD COLUMN id_publisher BIGINT REFERENCES users(id_user);

CREATE TABLE alert_status_history (
    id_alert_status_history BIGSERIAL PRIMARY KEY,
    id_alert BIGINT NOT NULL REFERENCES alerts(id_alert) ON DELETE CASCADE,
    from_status_id SMALLINT REFERENCES alert_statuses(id_alert_status),
    to_status_id SMALLINT NOT NULL REFERENCES alert_statuses(id_alert_status),
    transition_code VARCHAR(40) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id_user),
    notes TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO alert_status_history (
    id_alert,
    from_status_id,
    to_status_id,
    transition_code,
    changed_by,
    notes,
    changed_at
)
SELECT
    a.id_alert,
    NULL,
    a.id_alert_status,
    'MIGRATED',
    a.id_creator,
    'Estado inicial registrado durante la migración de alertas.',
    a.created_at
FROM alerts a
WHERE a.id_creator IS NOT NULL;

CREATE OR REPLACE FUNCTION sp_create_manual_alert_v2(
    p_title TEXT,
    p_executive_summary TEXT,
    p_creator_id BIGINT,
    p_level_code TEXT DEFAULT NULL,
    p_implications TEXT DEFAULT NULL,
    p_recommendations TEXT DEFAULT NULL,
    p_response_deadline DATE DEFAULT NULL,
    p_activation_rule TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_alert_id BIGINT;
    v_status_id SMALLINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id_user = p_creator_id AND active
    ) THEN
        RAISE EXCEPTION 'El creador indicado no existe o está inactivo';
    END IF;

    IF p_response_deadline IS NOT NULL
       AND p_response_deadline < CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha límite no puede ser anterior a la generación';
    END IF;

    v_status_id := get_catalog_id('alert_statuses', 'NEW');
    v_alert_id := nextval(pg_get_serial_sequence('alerts', 'id_alert'));

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
        activation_rule,
        notes,
        id_creator
    ) VALUES (
        v_alert_id,
        'ALT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(v_alert_id::TEXT, 6, '0'),
        btrim(p_title),
        btrim(p_executive_summary),
        NULLIF(btrim(COALESCE(p_implications, '')), ''),
        NULLIF(btrim(COALESCE(p_recommendations, '')), ''),
        CURRENT_DATE,
        p_response_deadline,
        CASE
            WHEN p_level_code IS NULL THEN NULL
            ELSE get_catalog_id('alert_levels', p_level_code)
        END,
        v_status_id,
        get_catalog_id('alert_origins', 'MANUAL'),
        NULLIF(btrim(COALESCE(p_activation_rule, '')), ''),
        NULLIF(btrim(COALESCE(p_notes, '')), ''),
        p_creator_id
    );

    INSERT INTO alert_status_history (
        id_alert,
        from_status_id,
        to_status_id,
        transition_code,
        changed_by
    ) VALUES (
        v_alert_id,
        NULL,
        v_status_id,
        'CREATED',
        p_creator_id
    );

    RETURN v_alert_id;
END;
$$;

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
BEGIN
    IF COALESCE(upper(btrim(p_status_code)), 'NEW') <> 'NEW' THEN
        RAISE EXCEPTION 'Las alertas deben crearse en estado NEW';
    END IF;

    RETURN sp_create_manual_alert_v2(
        p_title,
        p_executive_summary,
        p_creator_id,
        p_level_code,
        p_implications,
        p_recommendations,
        p_response_deadline,
        NULL,
        p_notes
    );
END;
$$;

CREATE OR REPLACE FUNCTION assert_alert_is_editable(p_alert_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_code TEXT;
BEGIN
    SELECT ast.code INTO v_status_code
    FROM alerts a
    INNER JOIN alert_statuses ast
        ON ast.id_alert_status = a.id_alert_status
    WHERE a.id_alert = p_alert_id
    FOR UPDATE OF a;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la alerta %', p_alert_id;
    END IF;

    IF v_status_code <> 'NEW' THEN
        RAISE EXCEPTION 'Solo pueden modificarse relaciones de alertas NEW';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION sp_link_signal_to_alert(
    p_signal_id BIGINT,
    p_alert_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM assert_alert_is_editable(p_alert_id);
    IF NOT EXISTS (SELECT 1 FROM signals WHERE id_signal = p_signal_id) THEN
        RAISE EXCEPTION 'No existe la señal %', p_signal_id;
    END IF;
    INSERT INTO alert_signals (id_alert, id_signal)
    VALUES (p_alert_id, p_signal_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION sp_unlink_signal_from_alert(
    p_signal_id BIGINT,
    p_alert_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM assert_alert_is_editable(p_alert_id);
    DELETE FROM alert_signals
    WHERE id_alert = p_alert_id AND id_signal = p_signal_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_link_trend_to_alert(
    p_trend_id BIGINT,
    p_alert_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM assert_alert_is_editable(p_alert_id);
    IF NOT EXISTS (SELECT 1 FROM trends WHERE id_trend = p_trend_id) THEN
        RAISE EXCEPTION 'No existe la tendencia %', p_trend_id;
    END IF;
    INSERT INTO alert_trends (id_alert, id_trend)
    VALUES (p_alert_id, p_trend_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION sp_unlink_trend_from_alert(
    p_trend_id BIGINT,
    p_alert_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM assert_alert_is_editable(p_alert_id);
    DELETE FROM alert_trends
    WHERE id_alert = p_alert_id AND id_trend = p_trend_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_link_audience_to_alert(
    p_audience_code TEXT,
    p_alert_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_audience_id SMALLINT;
BEGIN
    PERFORM assert_alert_is_editable(p_alert_id);
    SELECT id_audience INTO v_audience_id
    FROM audiences
    WHERE code = upper(btrim(p_audience_code));
    IF v_audience_id IS NULL THEN
        RAISE EXCEPTION 'No existe la audiencia %', p_audience_code;
    END IF;
    INSERT INTO alert_audiences (id_alert, id_audience)
    VALUES (p_alert_id, v_audience_id)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION sp_unlink_audience_from_alert(
    p_audience_code TEXT,
    p_alert_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM assert_alert_is_editable(p_alert_id);
    DELETE FROM alert_audiences aa
    USING audiences aud
    WHERE aa.id_audience = aud.id_audience
      AND aa.id_alert = p_alert_id
      AND aud.code = upper(btrim(p_audience_code));
END;
$$;

CREATE OR REPLACE FUNCTION sp_transition_alert(
    p_alert_id BIGINT,
    p_transition_code TEXT,
    p_actor_id BIGINT,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_alert alerts%ROWTYPE;
    v_from_code TEXT;
    v_to_code TEXT;
    v_to_status_id SMALLINT;
    v_transition_code TEXT;
    v_signal_count INTEGER;
    v_invalid_signal_count INTEGER;
    v_trend_count INTEGER;
    v_invalid_trend_count INTEGER;
    v_audience_count INTEGER;
BEGIN
    SELECT * INTO v_alert
    FROM alerts
    WHERE id_alert = p_alert_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la alerta %', p_alert_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id_user = p_actor_id AND active) THEN
        RAISE EXCEPTION 'El usuario de la transición no existe o está inactivo';
    END IF;

    SELECT code INTO v_from_code
    FROM alert_statuses
    WHERE id_alert_status = v_alert.id_alert_status;

    v_transition_code := upper(btrim(p_transition_code));
    v_to_code := CASE
        WHEN v_transition_code = 'SUBMIT_FOR_REVIEW' AND v_from_code = 'NEW'
            THEN 'UNDER_REVIEW'
        WHEN v_transition_code = 'REQUEST_CHANGES' AND v_from_code = 'UNDER_REVIEW'
            THEN 'NEW'
        WHEN v_transition_code = 'VALIDATE' AND v_from_code = 'UNDER_REVIEW'
            THEN 'VALIDATED'
        WHEN v_transition_code = 'REOPEN' AND v_from_code IN ('VALIDATED', 'PUBLISHED')
            THEN 'UNDER_REVIEW'
        WHEN v_transition_code = 'PUBLISH' AND v_from_code = 'VALIDATED'
            THEN 'PUBLISHED'
        WHEN v_transition_code = 'CLOSE' AND v_from_code = 'PUBLISHED'
            THEN 'CLOSED'
        ELSE NULL
    END;

    IF v_to_code IS NULL THEN
        RAISE EXCEPTION 'Transición % no permitida desde el estado %',
            v_transition_code, v_from_code;
    END IF;

    IF v_transition_code = 'SUBMIT_FOR_REVIEW' THEN
        SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE ss.code <> 'VALIDATED')
        INTO v_signal_count, v_invalid_signal_count
        FROM alert_signals als
        INNER JOIN signals s ON s.id_signal = als.id_signal
        INNER JOIN signal_statuses ss
            ON ss.id_signal_status = s.id_signal_status
        WHERE als.id_alert = p_alert_id;

        SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE ts.code NOT IN ('VALIDATED', 'ACTIVE'))
        INTO v_trend_count, v_invalid_trend_count
        FROM alert_trends alt
        INNER JOIN trends t ON t.id_trend = alt.id_trend
        INNER JOIN trend_statuses ts
            ON ts.id_trend_status = t.id_trend_status
        WHERE alt.id_alert = p_alert_id;

        SELECT COUNT(*) INTO v_audience_count
        FROM alert_audiences
        WHERE id_alert = p_alert_id;

        IF v_alert.id_alert_level IS NULL
           OR v_alert.implications IS NULL
           OR v_alert.recommendations IS NULL
           OR v_alert.activation_rule IS NULL THEN
            RAISE EXCEPTION 'Nivel, implicaciones, recomendaciones y regla de activación son obligatorios';
        END IF;

        IF v_signal_count + v_trend_count < 1 THEN
            RAISE EXCEPTION 'La alerta requiere al menos una señal o tendencia';
        END IF;

        IF v_invalid_signal_count > 0 OR v_invalid_trend_count > 0 THEN
            RAISE EXCEPTION 'Toda la evidencia relacionada debe estar validada o activa';
        END IF;

        IF v_audience_count < 1 THEN
            RAISE EXCEPTION 'La alerta requiere al menos una audiencia';
        END IF;
    END IF;

    IF v_transition_code = 'VALIDATE' AND p_actor_id = v_alert.id_creator THEN
        RAISE EXCEPTION 'El validador debe ser distinto del creador de la alerta';
    END IF;

    v_to_status_id := get_catalog_id('alert_statuses', v_to_code);

    UPDATE alerts
    SET
        id_alert_status = v_to_status_id,
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
        id_publisher = CASE
            WHEN v_transition_code = 'PUBLISH' THEN p_actor_id
            WHEN v_transition_code = 'REOPEN' THEN NULL
            ELSE id_publisher
        END,
        publication_date = CASE
            WHEN v_transition_code = 'PUBLISH' THEN CURRENT_DATE
            WHEN v_transition_code = 'REOPEN' THEN NULL
            ELSE publication_date
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_alert = p_alert_id;

    INSERT INTO alert_status_history (
        id_alert,
        from_status_id,
        to_status_id,
        transition_code,
        changed_by,
        notes
    ) VALUES (
        p_alert_id,
        v_alert.id_alert_status,
        v_to_status_id,
        v_transition_code,
        p_actor_id,
        NULLIF(btrim(COALESCE(p_notes, '')), '')
    );
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_alert_status(
    p_alert_id BIGINT,
    p_status_code TEXT,
    p_validator_id BIGINT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Use sp_transition_alert para cambiar el estado de una alerta';
END;
$$;

CREATE INDEX IF NOT EXISTS idx_alerts_publisher
    ON alerts (id_publisher)
    WHERE id_publisher IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alert_status_history_alert_changed
    ON alert_status_history (id_alert, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_status_history_actor
    ON alert_status_history (changed_by);
