CREATE TABLE sources (
    id BIGSERIAL PRIMARY KEY,
    source_type_id SMALLINT NOT NULL REFERENCES source_types(id),
    name VARCHAR(200) NOT NULL,
    website TEXT,
    country VARCHAR(100),
    rss_url TEXT,
    api_url TEXT,
    reliability NUMERIC(3,2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE signals (
    id BIGSERIAL PRIMARY KEY,
    business_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    publication_date DATE NOT NULL,
    capture_date DATE NOT NULL,
    category_id SMALLINT NOT NULL REFERENCES categories(id),
    source_id BIGINT NOT NULL REFERENCES sources(id),
    signal_type_id SMALLINT NOT NULL REFERENCES signal_types(id),
    impact_id SMALLINT NOT NULL REFERENCES impacts(id),
    urgency_id SMALLINT NOT NULL REFERENCES urgencies(id),
    scope_id SMALLINT NOT NULL REFERENCES scopes(id),
    status_id SMALLINT NOT NULL REFERENCES signal_statuses(id),
    analyst_id BIGINT NOT NULL REFERENCES users(id),
    validator_id BIGINT REFERENCES users(id),
    validation_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE keywords (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE signal_keywords (
    signal_id BIGINT REFERENCES signals(id) ON DELETE CASCADE,
    keyword_id BIGINT REFERENCES keywords(id),
    PRIMARY KEY(signal_id,keyword_id)
);

CREATE TABLE trends (
    id BIGSERIAL PRIMARY KEY,
    business_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    narrative TEXT NOT NULL,
    implications TEXT,
    direction_id SMALLINT REFERENCES trend_directions(id),
    maturity_id SMALLINT REFERENCES trend_maturity(id),
    status_id SMALLINT REFERENCES trend_statuses(id),
    analyst_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE signal_trends (
    signal_id BIGINT REFERENCES signals(id) ON DELETE CASCADE,
    trend_id BIGINT REFERENCES trends(id) ON DELETE CASCADE,
    PRIMARY KEY(signal_id,trend_id)
);

CREATE TABLE actors (
    id BIGSERIAL PRIMARY KEY,
    actor_type_id SMALLINT REFERENCES actor_types(id),
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100),
    website TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trend_actors (
    trend_id BIGINT REFERENCES trends(id) ON DELETE CASCADE,
    actor_id BIGINT REFERENCES actors(id) ON DELETE CASCADE,
    PRIMARY KEY(trend_id,actor_id)
);

CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    business_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    executive_summary TEXT NOT NULL,
    implications TEXT,
    recommendations TEXT,
    generation_date DATE NOT NULL,
    response_deadline DATE,
    alert_level_id SMALLINT REFERENCES alert_levels(id),
    status_id SMALLINT REFERENCES alert_statuses(id),
    validator_id BIGINT REFERENCES users(id),
    publication_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alert_signals (
    alert_id BIGINT REFERENCES alerts(id) ON DELETE CASCADE,
    signal_id BIGINT REFERENCES signals(id) ON DELETE CASCADE,
    PRIMARY KEY(alert_id,signal_id)
);

CREATE TABLE alert_trends (
    alert_id BIGINT REFERENCES alerts(id) ON DELETE CASCADE,
    trend_id BIGINT REFERENCES trends(id) ON DELETE CASCADE,
    PRIMARY KEY(alert_id,trend_id)

);
CREATE TABLE alert_audiences (
    alert_id BIGINT REFERENCES alerts(id) ON DELETE CASCADE,
    audience_id SMALLINT REFERENCES audiences(id),
    PRIMARY KEY(alert_id,audience_id)
);