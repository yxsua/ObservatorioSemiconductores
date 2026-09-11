BEGIN;

CREATE TABLE observatory_records (
    id BIGSERIAL PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('indicators','ecosystem','investments','events','resources')),
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    source_name VARCHAR(300) NOT NULL,
    source_url TEXT,
    as_of DATE NOT NULL,
    responsible VARCHAR(200) NOT NULL,
    valid_from DATE,
    valid_until DATE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_by BIGINT REFERENCES users(id_user),
    edited_by BIGINT REFERENCES users(id_user),
    approved_by BIGINT REFERENCES users(id_user),
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from)
);

CREATE TABLE indicator_observations (
    record_id BIGINT PRIMARY KEY REFERENCES observatory_records(id) ON DELETE CASCADE,
    series_code VARCHAR(80) NOT NULL,
    dimension TEXT NOT NULL CHECK (dimension IN ('ECONOMIC','TECHNOLOGICAL','SOCIAL','REGULATORY','SUSTAINABILITY')),
    period INTEGER NOT NULL CHECK (period BETWEEN 1900 AND 2200),
    value NUMERIC,
    upper_value NUMERIC,
    assessment VARCHAR(200),
    unit VARCHAR(80) NOT NULL,
    nature TEXT NOT NULL CHECK (nature IN ('OBSERVED','ESTIMATE','PROJECTION')),
    methodology TEXT NOT NULL,
    geography VARCHAR(200) NOT NULL,
    CHECK (value IS NOT NULL OR assessment IS NOT NULL),
    CHECK (upper_value IS NULL OR (value IS NOT NULL AND upper_value >= value))
);
CREATE INDEX indicator_series_period ON indicator_observations(series_code, period);
CREATE TABLE ecosystem_actors (
    record_id BIGINT PRIMARY KEY REFERENCES observatory_records(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('COMPANY','ACADEMIA','RESEARCH','GOVERNMENT','CLUSTER')),
    location VARCHAR(200) NOT NULL,
    website TEXT,
    capabilities TEXT NOT NULL,
    value_chain_stage VARCHAR(200) NOT NULL
);
CREATE TABLE investments (
    record_id BIGINT PRIMARY KEY REFERENCES observatory_records(id) ON DELETE CASCADE,
    organization VARCHAR(200) NOT NULL,
    location VARCHAR(200) NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('ANNOUNCED','IN_PROGRESS','OPERATING','CANCELLED')),
    amount NUMERIC CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    announced_on DATE,
    jobs INTEGER CHECK (jobs >= 0)
);
CREATE TABLE events (
    record_id BIGINT PRIMARY KEY REFERENCES observatory_records(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    organizer VARCHAR(200) NOT NULL,
    location VARCHAR(200) NOT NULL,
    registration_url TEXT,
    CHECK (ends_at >= starts_at)
);
CREATE TABLE resources (
    record_id BIGINT PRIMARY KEY REFERENCES observatory_records(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('DATASET','REPORT','TOOL','TRAINING','WEBSITE')),
    url TEXT NOT NULL,
    format VARCHAR(80) NOT NULL,
    license VARCHAR(200)
);
CREATE TABLE observatory_record_media (
    record_id BIGINT REFERENCES observatory_records(id) ON DELETE CASCADE,
    media_id BIGINT REFERENCES media(id_media), PRIMARY KEY (record_id, media_id)
);
CREATE TABLE observatory_record_signals (
    record_id BIGINT REFERENCES observatory_records(id) ON DELETE CASCADE,
    signal_id BIGINT REFERENCES signals(id_signal), PRIMARY KEY (record_id, signal_id)
);
CREATE TABLE observatory_record_trends (
    record_id BIGINT REFERENCES observatory_records(id) ON DELETE CASCADE,
    trend_id BIGINT REFERENCES trends(id_trend), PRIMARY KEY (record_id, trend_id)
);
CREATE TABLE observatory_record_history (
    id BIGSERIAL PRIMARY KEY,
    record_id BIGINT NOT NULL REFERENCES observatory_records(id),
    actor_id BIGINT REFERENCES users(id_user),
    action TEXT NOT NULL,
    note TEXT,
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX observatory_public_lookup ON observatory_records(kind, status, as_of DESC, id DESC);
CREATE INDEX observatory_history_lookup ON observatory_record_history(record_id, id);

CREATE VIEW vw_public_observatory_records AS
SELECT * FROM observatory_records
WHERE status = 'PUBLISHED'
  AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
  AND (valid_until IS NULL OR valid_until >= CURRENT_DATE);

INSERT INTO permissions(code, description) VALUES
('data:read-internal','Consultar datos estructurados internos.'),
('data:create','Crear datos estructurados.'),
('data:update','Editar borradores de datos estructurados.'),
('data:submit','Enviar datos estructurados a revisión.'),
('data:approve','Revisar datos estructurados.'),
('data:publish','Publicar o archivar datos estructurados.')
ON CONFLICT (code) DO NOTHING;
INSERT INTO role_permissions(id_role,id_permission)
SELECT r.id_role,p.id_permission FROM roles r CROSS JOIN permissions p
WHERE p.code LIKE 'data:%' AND (
    r.name = 'ADMIN'
    OR (r.name IN ('ANALYST','EDITOR') AND p.code IN ('data:read-internal','data:create','data:update','data:submit'))
    OR (r.name = 'VALIDATOR' AND p.code IN ('data:read-internal','data:approve'))
    OR (r.name = 'PUBLISHER' AND p.code IN ('data:read-internal','data:publish'))
) ON CONFLICT DO NOTHING;

COMMIT;
