CREATE TABLE media (
    id_media BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(120),
    extension VARCHAR(20),
    storage_path TEXT NOT NULL,
    size_bytes BIGINT,
    checksum VARCHAR(64),
    uploaded_by BIGINT REFERENCES users(id_user),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT TRUE,
    storage_provider VARCHAR(40),
    storage_bucket VARCHAR(100),
    created_by BIGINT REFERENCES users(id_user),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content (
    id_content BIGSERIAL PRIMARY KEY,
    content_type_id INTEGER NOT NULL REFERENCES content_types(id_content_type),
    status_id INTEGER NOT NULL REFERENCES content_statuses(id_content_status),
    author_id BIGINT NOT NULL REFERENCES users(id_user),
    title VARCHAR(250) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    summary TEXT,
    featured_media_id BIGINT REFERENCES media(id_media),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_version (
    id_content_version BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES content(id_content) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id_user),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_summary TEXT,
    UNIQUE (content_id, version_number)
);

CREATE TABLE content_section (
    id_content_section BIGSERIAL PRIMARY KEY,
    content_version_id BIGINT NOT NULL REFERENCES content_version(id_content_version) ON DELETE CASCADE,
    title VARCHAR(150),
    section_type_id INTEGER REFERENCES section_types(id_section_type),
    position INTEGER NOT NULL,
    is_collapsible BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}' :: jsonb
);

CREATE TABLE content_block (
    id_content_block BIGSERIAL PRIMARY KEY,
    section_id BIGINT NOT NULL REFERENCES content_section(id_content_section) ON DELETE CASCADE,
    block_type_id INTEGER NOT NULL REFERENCES block_type(id_block_type),
    position INTEGER NOT NULL,
    data JSONB NOT NULL,
    settings JSONB DEFAULT '{}' :: jsonb,
    is_visible BOOLEAN DEFAULT TRUE,
    css_class VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_category (
    content_id BIGINT REFERENCES content(id_content) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id_category) ON DELETE CASCADE,
    PRIMARY KEY(content_id, category_id)
);

CREATE TABLE content_relation (
    source_content_id BIGINT REFERENCES content(id_content) ON DELETE CASCADE,
    target_content_id BIGINT REFERENCES content(id_content) ON DELETE CASCADE,
    relation_type_id INTEGER REFERENCES content_relation_types(id_content_relation_type) ON DELETE CASCADE,
    PRIMARY KEY(
        source_content_id,
        target_content_id,
        relation_type_id
    )
);

CREATE TABLE content_signal (
    content_id BIGINT REFERENCES content(id_content) ON DELETE CASCADE,
    signal_id BIGINT REFERENCES signals(id_signal) ON DELETE CASCADE,
    PRIMARY KEY(content_id, signal_id)
);

CREATE TABLE content_alert (
    content_id BIGINT REFERENCES content(id_content) ON DELETE CASCADE,
    alert_id BIGINT REFERENCES alerts(id_alert) ON DELETE CASCADE,
    PRIMARY KEY(content_id, alert_id)
);

CREATE TABLE content_trend (
    content_id BIGINT REFERENCES content(id_content) ON DELETE CASCADE,
    trend_id BIGINT REFERENCES trends(id_trend) ON DELETE CASCADE,
    PRIMARY KEY(content_id, trend_id)
);