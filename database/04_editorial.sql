CREATE TABLE contents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    excerpt TEXT,
    content_markdown TEXT NOT NULL,
    content_html TEXT,
    content_type_id SMALLINT NOT NULL
        REFERENCES content_types(id),
    status_id SMALLINT NOT NULL
        REFERENCES content_statuses(id),
    featured_file_id BIGINT,
    author_id BIGINT NOT NULL
        REFERENCES users(id),
    editor_id BIGINT
        REFERENCES users(id),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE content_versions (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL
        REFERENCES contents(id)
        ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(250) NOT NULL,
    content_markdown TEXT NOT NULL,
    content_html TEXT,
    edited_by BIGINT
        REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_content_version
        UNIQUE(content_id, version_number)
);

CREATE TABLE files (
    id BIGSERIAL PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(120),
    extension VARCHAR(20),
    size_bytes BIGINT,
    checksum VARCHAR(128),
    uploaded_by BIGINT
        REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()

);

CREATE TABLE content_files (
    content_id BIGINT NOT NULL
        REFERENCES contents(id)
        ON DELETE CASCADE,
    file_id BIGINT NOT NULL
        REFERENCES files(id)
        ON DELETE CASCADE,
    relation_type VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY(content_id, file_id)

);

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE content_tags (
    content_id BIGINT NOT NULL
        REFERENCES contents(id)
        ON DELETE CASCADE,
    tag_id BIGINT NOT NULL
        REFERENCES tags(id)
        ON DELETE CASCADE,
    PRIMARY KEY(content_id, tag_id)
);

CREATE TABLE pages (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    content_markdown TEXT,
    content_html TEXT,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT
        REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_signals (
    content_id BIGINT NOT NULL
        REFERENCES contents(id)
        ON DELETE CASCADE,
    signal_id BIGINT NOT NULL
        REFERENCES signals(id)
        ON DELETE CASCADE,
    PRIMARY KEY(content_id, signal_id)

);

CREATE TABLE content_trends (
    content_id BIGINT NOT NULL
        REFERENCES contents(id)
        ON DELETE CASCADE,
    trend_id BIGINT NOT NULL
        REFERENCES trends(id)
        ON DELETE CASCADE,
    PRIMARY KEY(content_id, trend_id)
);

CREATE TABLE content_alerts (
    content_id BIGINT NOT NULL
        REFERENCES contents(id)
        ON DELETE CASCADE,
    alert_id BIGINT NOT NULL
        REFERENCES alerts(id)
        ON DELETE CASCADE,
    PRIMARY KEY(content_id, alert_id)
);

