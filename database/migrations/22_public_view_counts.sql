BEGIN;

CREATE TABLE public_view_counts (
    resource_type VARCHAR(20) NOT NULL CHECK (
        resource_type IN ('content', 'signal', 'trend', 'alert')
    ),
    resource_id BIGINT NOT NULL CHECK (resource_id > 0),
    view_count BIGINT NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (resource_type, resource_id)
);

CREATE INDEX idx_public_view_counts_popularity
    ON public_view_counts (resource_type, view_count DESC);

COMMIT;
