CREATE TABLE contents (
    id_content          BIGSERIAL PRIMARY KEY,
    title               VARCHAR(250) NOT NULL,
    slug                VARCHAR(300) NOT NULL UNIQUE,
    excerpt             TEXT,
    content_markdown    TEXT NOT NULL,
    content_html        TEXT,
    id_content_type     SMALLINT NOT NULL REFERENCES content_types(id_content_type),
    id_content_status   SMALLINT NOT NULL REFERENCES content_statuses(id_content_status),
    id_featured_file    BIGINT REFERENCES files(id_file),
    id_author           BIGINT NOT NULL REFERENCES users(id_user),
    id_editor           BIGINT REFERENCES users(id_user),
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    published_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMP
);

CREATE TABLE content_versions (
    id_content_version  BIGSERIAL PRIMARY KEY,
    id_content          BIGINT NOT NULL REFERENCES contents(id_content) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL,
    title               VARCHAR(250) NOT NULL,
    content_markdown    TEXT NOT NULL,
    content_html        TEXT,
    id_editor           BIGINT REFERENCES users(id_user),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_content_version
        UNIQUE(id_content, version_number)
);

CREATE TABLE files (
    id_file             BIGSERIAL PRIMARY KEY,
    original_name       VARCHAR(255) NOT NULL,
    stored_name         VARCHAR(255) NOT NULL,
    file_path           TEXT NOT NULL,
    mime_type           VARCHAR(120),
    extension           VARCHAR(20),
    size_bytes          BIGINT,
    checksum            VARCHAR(128),
    id_uploaded_by      BIGINT REFERENCES users(id_user),
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_files (
    id_content          BIGINT NOT NULL REFERENCES contents(id_content) ON DELETE CASCADE,
    id_file             BIGINT NOT NULL REFERENCES files(id_file) ON DELETE CASCADE,
    relation_type       VARCHAR(50),
    sort_order          INTEGER DEFAULT 0,
    PRIMARY KEY(id_content, id_file)
);

CREATE TABLE tags (
    id_tag              BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT
);

CREATE TABLE content_tags (
    id_content          BIGINT NOT NULL REFERENCES contents(id_content) ON DELETE CASCADE,
    id_tag              BIGINT NOT NULL REFERENCES tags(id_tag) ON DELETE CASCADE,
    PRIMARY KEY(id_content, id_tag)
);

CREATE TABLE pages (
    id_page             BIGSERIAL PRIMARY KEY,
    title               VARCHAR(200) NOT NULL,
    slug                VARCHAR(250) NOT NULL UNIQUE,
    content_markdown    TEXT,
    content_html        TEXT,
    published           BOOLEAN NOT NULL DEFAULT TRUE,
    id_created_by       BIGINT REFERENCES users(id_user),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_signals (
    id_content          BIGINT NOT NULL REFERENCES contents(id_content) ON DELETE CASCADE,
    id_signal           BIGINT NOT NULL REFERENCES signals(id_signal) ON DELETE CASCADE,
    PRIMARY KEY(id_content, id_signal)
);

CREATE TABLE content_trends (
    id_content          BIGINT NOT NULL REFERENCES contents(id_content) ON DELETE CASCADE,
    id_trend            BIGINT NOT NULL REFERENCES trends(id_trend) ON DELETE CASCADE,
    PRIMARY KEY(id_content, id_trend)
);

CREATE TABLE content_alerts (
    id_content          BIGINT NOT NULL REFERENCES contents(id_content) ON DELETE CASCADE,
    id_alert            BIGINT NOT NULL REFERENCES alerts(id_alert) ON DELETE CASCADE,
    PRIMARY KEY(id_content, id_alert)
);