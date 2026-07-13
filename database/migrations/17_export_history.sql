-- Fase 5.6: historial auditable de exportaciones públicas por cuenta.

CREATE TABLE export_history (
    id_export BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id_user),
    resource_code VARCHAR(20) NOT NULL,
    format_code VARCHAR(10) NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::JSONB,
    row_count INTEGER NOT NULL CHECK (row_count >= 0),
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    checksum VARCHAR(64) NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_export_resource
        CHECK (resource_code IN ('signals', 'trends', 'alerts', 'content')),
    CONSTRAINT chk_export_format
        CHECK (format_code IN ('csv', 'json')),
    CONSTRAINT chk_export_filters_object
        CHECK (jsonb_typeof(filters) = 'object')
);

CREATE INDEX idx_export_history_user_created
    ON export_history (user_id, created_at DESC, id_export DESC);

