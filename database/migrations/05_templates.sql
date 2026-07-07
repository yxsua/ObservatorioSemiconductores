CREATE TABLE content_templates (
    id_template SERIAL PRIMARY KEY,
    content_type_id SMALLINT REFERENCES content_types,
    name VARCHAR(100),
    description TEXT,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE template_sections (
    id_template_section SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES content_templates(id_template),
    section_type_id INTEGER REFERENCES section_types,
    title VARCHAR(100),
    position INTEGER,
    required BOOLEAN DEFAULT TRUE,
    repeatable BOOLEAN DEFAULT FALSE
);

CREATE TABLE template_blocks (
    id_template_block SERIAL PRIMARY KEY,
    template_section_id INTEGER REFERENCES template_sections,
    block_type_id INTEGER REFERENCES block_type,
    position INTEGER,
    placeholder VARCHAR(200),
    required BOOLEAN DEFAULT TRUE,
    default_data JSONB
);

CREATE TABLE template_section_allowed_blocks (
    template_section_id INTEGER NOT NULL REFERENCES template_sections(id_template_section) ON DELETE CASCADE,
    block_type_id INTEGER NOT NULL REFERENCES block_type(id_block_type),
    min_occurrences INTEGER DEFAULT 0,
    max_occurrences INTEGER,
    PRIMARY KEY (template_section_id, block_type_id)
);