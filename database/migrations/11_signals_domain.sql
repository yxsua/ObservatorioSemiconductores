-- Fase 2: correcciones de dominio para señales.
-- Confiabilidad por señal, cálculo autoritativo de IPS y ciclo de estados canónico.

CREATE TABLE reliability_levels (
    id_reliability SMALLSERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(30) NOT NULL,
    description TEXT,
    weight SMALLINT NOT NULL CHECK (weight BETWEEN 1 AND 3)
);

INSERT INTO reliability_levels (code, name, description, weight) VALUES
    ('LOW', 'Baja', 'Evidencia indirecta, incompleta o no corroborada.', 1),
    ('MEDIUM', 'Media', 'Evidencia identificable y razonablemente sustentada.', 2),
    ('HIGH', 'Alta', 'Evidencia primaria, oficial o corroborada.', 3)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    weight = EXCLUDED.weight;

CREATE OR REPLACE VIEW vw_reliability_levels AS
SELECT
    id_reliability,
    code,
    name,
    description,
    weight
FROM reliability_levels;

CREATE OR REPLACE FUNCTION get_reliability_id(reliability_code TEXT)
RETURNS SMALLINT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_id SMALLINT;
BEGIN
    SELECT id_reliability INTO v_id
    FROM reliability_levels
    WHERE code = upper(btrim(COALESCE(reliability_code, '')));

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'No existe el código de confiabilidad "%"', reliability_code;
    END IF;

    RETURN v_id;
END;
$$;

ALTER TABLE signals
    ADD COLUMN id_reliability SMALLINT REFERENCES reliability_levels(id_reliability);

UPDATE signals
SET id_reliability = (
    SELECT id_reliability
    FROM reliability_levels
    WHERE code = 'MEDIUM'
)
WHERE id_reliability IS NULL;

ALTER TABLE signals
    ALTER COLUMN id_reliability SET NOT NULL;

INSERT INTO signal_statuses (code, name, description) VALUES
    ('ARCHIVED', 'Archivada', 'Señal retirada de operación sin perder trazabilidad.')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Las relaciones dejan de representarse como estados exclusivos.
UPDATE signals
SET id_signal_status = (
    SELECT id_signal_status
    FROM signal_statuses
    WHERE code = 'VALIDATED'
)
WHERE id_signal_status IN (
    SELECT id_signal_status
    FROM signal_statuses
    WHERE code IN ('LINKED_TO_TREND', 'ESCALATED_TO_ALERT')
);

DELETE FROM signal_statuses
WHERE code IN ('LINKED_TO_TREND', 'ESCALATED_TO_ALERT');

CREATE TABLE signal_status_history (
    id_signal_status_history BIGSERIAL PRIMARY KEY,
    id_signal BIGINT NOT NULL REFERENCES signals(id_signal) ON DELETE CASCADE,
    from_status_id SMALLINT REFERENCES signal_statuses(id_signal_status),
    to_status_id SMALLINT NOT NULL REFERENCES signal_statuses(id_signal_status),
    transition_code VARCHAR(40) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id_user),
    notes TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO signal_status_history (
    id_signal,
    from_status_id,
    to_status_id,
    transition_code,
    changed_by,
    notes,
    changed_at
)
SELECT
    s.id_signal,
    NULL,
    s.id_signal_status,
    'MIGRATED',
    s.id_analyst,
    'Estado inicial registrado durante la migración de Fase 2.',
    s.created_at
FROM signals s;

CREATE OR REPLACE FUNCTION trg_calculate_signal_ips()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_impact_weight SMALLINT;
    v_urgency_weight SMALLINT;
    v_reliability_weight SMALLINT;
BEGIN
    SELECT weight INTO v_impact_weight
    FROM impacts
    WHERE id_impact = NEW.id_impact;

    SELECT weight INTO v_urgency_weight
    FROM urgencies
    WHERE id_urgency = NEW.id_urgency;

    SELECT weight INTO v_reliability_weight
    FROM reliability_levels
    WHERE id_reliability = NEW.id_reliability;

    IF v_impact_weight IS NULL
       OR v_urgency_weight IS NULL
       OR v_reliability_weight IS NULL THEN
        RAISE EXCEPTION 'No fue posible calcular el IPS con los factores indicados';
    END IF;

    NEW.ips := v_impact_weight * v_urgency_weight * v_reliability_weight;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_signal_ips_before_write ON signals;
CREATE TRIGGER calculate_signal_ips_before_write
BEFORE INSERT OR UPDATE OF id_impact, id_urgency, id_reliability
ON signals
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_signal_ips();

-- Recalcula cualquier valor histórico que hubiera sido enviado por un cliente.
UPDATE signals
SET id_reliability = id_reliability;

ALTER TABLE signals
    ALTER COLUMN ips SET NOT NULL;

CREATE OR REPLACE FUNCTION sp_create_signal_v2(
    p_title TEXT,
    p_summary TEXT,
    p_publication_date DATE,
    p_evidence_url TEXT,
    p_category_id SMALLINT,
    p_source_id BIGINT,
    p_signal_type_code TEXT,
    p_impact_code TEXT,
    p_urgency_code TEXT,
    p_reliability_code TEXT,
    p_scope_code TEXT,
    p_analyst_id BIGINT,
    p_notes TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_signal_id BIGINT;
    v_business_code TEXT;
    v_status_id SMALLINT;
BEGIN
    IF p_publication_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de publicación no puede ser posterior a la fecha de captura';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM categories WHERE id_category = p_category_id AND active) THEN
        RAISE EXCEPTION 'La categoría indicada no existe o está inactiva';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sources WHERE id_source = p_source_id AND active) THEN
        RAISE EXCEPTION 'La fuente indicada no existe o está inactiva';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id_user = p_analyst_id AND active) THEN
        RAISE EXCEPTION 'El analista indicado no existe o está inactivo';
    END IF;

    v_status_id := get_catalog_id('signal_statuses', 'NEW');
    v_signal_id := nextval(pg_get_serial_sequence('signals', 'id_signal'));
    v_business_code := 'SIG-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
        lpad(v_signal_id::TEXT, 6, '0');

    INSERT INTO signals (
        id_signal,
        business_code,
        title,
        summary,
        publication_date,
        capture_date,
        evidence_url,
        id_category,
        id_source,
        id_signal_type,
        id_impact,
        id_urgency,
        id_reliability,
        id_scope,
        id_signal_status,
        id_analyst,
        notes
    ) VALUES (
        v_signal_id,
        v_business_code,
        btrim(p_title),
        btrim(p_summary),
        p_publication_date,
        CURRENT_DATE,
        btrim(p_evidence_url),
        p_category_id,
        p_source_id,
        get_catalog_id('signal_types', p_signal_type_code),
        get_catalog_id('impacts', p_impact_code),
        get_catalog_id('urgencies', p_urgency_code),
        get_reliability_id(p_reliability_code),
        get_catalog_id('scopes', p_scope_code),
        v_status_id,
        p_analyst_id,
        NULLIF(btrim(COALESCE(p_notes, '')), '')
    );

    INSERT INTO signal_status_history (
        id_signal,
        from_status_id,
        to_status_id,
        transition_code,
        changed_by
    ) VALUES (
        v_signal_id,
        NULL,
        v_status_id,
        'CREATED',
        p_analyst_id
    );

    RETURN v_signal_id;
END;
$$;

-- Compatibilidad con la firma anterior: ignora el IPS enviado y utiliza
-- confiabilidad MEDIUM cuando el consumidor todavía no conoce el nuevo campo.
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
BEGIN
    IF COALESCE(upper(btrim(p_status_code)), 'NEW') <> 'NEW' THEN
        RAISE EXCEPTION 'Las señales deben crearse en estado NEW';
    END IF;

    RETURN sp_create_signal_v2(
        p_title,
        p_summary,
        p_publication_date,
        p_evidence_url,
        p_category_id,
        p_source_id,
        p_signal_type_code,
        p_impact_code,
        p_urgency_code,
        'MEDIUM',
        p_scope_code,
        p_analyst_id,
        p_notes
    );
END;
$$;

CREATE OR REPLACE FUNCTION sp_transition_signal(
    p_signal_id BIGINT,
    p_transition_code TEXT,
    p_actor_id BIGINT,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_signal signals%ROWTYPE;
    v_from_code TEXT;
    v_to_code TEXT;
    v_to_status_id SMALLINT;
    v_transition_code TEXT;
BEGIN
    SELECT * INTO v_signal
    FROM signals
    WHERE id_signal = p_signal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la señal %', p_signal_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id_user = p_actor_id AND active) THEN
        RAISE EXCEPTION 'El usuario que realiza la transición no existe o está inactivo';
    END IF;

    SELECT code INTO v_from_code
    FROM signal_statuses
    WHERE id_signal_status = v_signal.id_signal_status;

    v_transition_code := upper(btrim(p_transition_code));

    v_to_code := CASE
        WHEN v_transition_code = 'SUBMIT_FOR_REVIEW' AND v_from_code = 'NEW'
            THEN 'UNDER_REVIEW'
        WHEN v_transition_code = 'REQUEST_CHANGES' AND v_from_code = 'UNDER_REVIEW'
            THEN 'NEW'
        WHEN v_transition_code = 'VALIDATE' AND v_from_code = 'UNDER_REVIEW'
            THEN 'VALIDATED'
        WHEN v_transition_code = 'REOPEN' AND v_from_code = 'VALIDATED'
            THEN 'UNDER_REVIEW'
        WHEN v_transition_code = 'ARCHIVE' AND v_from_code IN ('NEW', 'UNDER_REVIEW', 'VALIDATED')
            THEN 'ARCHIVED'
        ELSE NULL
    END;

    IF v_to_code IS NULL THEN
        RAISE EXCEPTION 'Transición % no permitida desde el estado %',
            v_transition_code, v_from_code;
    END IF;

    IF v_transition_code = 'VALIDATE' AND p_actor_id = v_signal.id_analyst THEN
        RAISE EXCEPTION 'El validador debe ser distinto del analista de la señal';
    END IF;

    IF v_transition_code = 'VALIDATE' AND NOT EXISTS (
        SELECT 1
        FROM sources
        WHERE id_source = v_signal.id_source
          AND active
    ) THEN
        RAISE EXCEPTION 'No puede validarse una señal cuya fuente está inactiva';
    END IF;

    IF v_transition_code = 'VALIDATE' AND NOT EXISTS (
        SELECT 1
        FROM categories
        WHERE id_category = v_signal.id_category
          AND active
    ) THEN
        RAISE EXCEPTION 'No puede validarse una señal cuya categoría está inactiva';
    END IF;

    v_to_status_id := get_catalog_id('signal_statuses', v_to_code);

    UPDATE signals
    SET
        id_signal_status = v_to_status_id,
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
    WHERE id_signal = p_signal_id;

    INSERT INTO signal_status_history (
        id_signal,
        from_status_id,
        to_status_id,
        transition_code,
        changed_by,
        notes
    ) VALUES (
        p_signal_id,
        v_signal.id_signal_status,
        v_to_status_id,
        v_transition_code,
        p_actor_id,
        NULLIF(btrim(COALESCE(p_notes, '')), '')
    );
END;
$$;

-- Compatibilidad temporal para consumidores del procedimiento anterior.
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
    v_current_code TEXT;
    v_target_code TEXT;
    v_transition_code TEXT;
    v_actor_id BIGINT;
BEGIN
    SELECT ss.code, s.id_analyst
    INTO v_current_code, v_actor_id
    FROM signals s
    INNER JOIN signal_statuses ss
        ON ss.id_signal_status = s.id_signal_status
    WHERE s.id_signal = p_signal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la señal %', p_signal_id;
    END IF;

    v_target_code := upper(btrim(p_status_code));
    v_actor_id := COALESCE(p_validator_id, v_actor_id);

    v_transition_code := CASE
        WHEN v_current_code = 'NEW' AND v_target_code = 'UNDER_REVIEW'
            THEN 'SUBMIT_FOR_REVIEW'
        WHEN v_current_code = 'UNDER_REVIEW' AND v_target_code = 'NEW'
            THEN 'REQUEST_CHANGES'
        WHEN v_current_code = 'UNDER_REVIEW' AND v_target_code = 'VALIDATED'
            THEN 'VALIDATE'
        WHEN v_current_code = 'VALIDATED' AND v_target_code = 'UNDER_REVIEW'
            THEN 'REOPEN'
        WHEN v_target_code = 'ARCHIVED'
            THEN 'ARCHIVE'
        ELSE NULL
    END;

    IF v_transition_code IS NULL THEN
        RAISE EXCEPTION 'Cambio de estado no permitido: % -> %',
            v_current_code, v_target_code;
    END IF;

    PERFORM sp_transition_signal(
        p_signal_id,
        v_transition_code,
        v_actor_id,
        p_notes
    );
END;
$$;

-- Vincular una señal ya no modifica su ciclo de revisión.
CREATE OR REPLACE FUNCTION sp_link_signal_to_trend(
    p_signal_id BIGINT,
    p_trend_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM signals WHERE id_signal = p_signal_id) THEN
        RAISE EXCEPTION 'No existe la señal %', p_signal_id;
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
END;
$$;

CREATE INDEX IF NOT EXISTS idx_signals_reliability
    ON signals (id_reliability);
CREATE INDEX IF NOT EXISTS idx_signal_status_history_signal_changed
    ON signal_status_history (id_signal, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_status_history_actor
    ON signal_status_history (changed_by);
