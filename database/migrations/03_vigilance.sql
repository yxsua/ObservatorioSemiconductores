CREATE TABLE sources (
    id_source           BIGSERIAL PRIMARY KEY,
    id_source_type      SMALLINT NOT NULL REFERENCES source_types(id_source_type),
    name                VARCHAR(200) NOT NULL,
    website             TEXT,
    country             VARCHAR(100),
    rss_url             TEXT,
    api_url             TEXT,
    reliability         NUMERIC(3,2),
    active              BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE signals (
    id_signal           BIGSERIAL PRIMARY KEY,
    business_code       VARCHAR(20) UNIQUE NOT NULL,
    title               VARCHAR(200) NOT NULL,
    summary             TEXT NOT NULL,
    publication_date    DATE NOT NULL,
    capture_date        DATE NOT NULL,
    evidence_url        TEXT NOT NULL, -- URL of the original source or evidence
    ips                 NUMERIC(5,2), -- Impact Probability Score (for be defined)
    id_category         SMALLINT NOT NULL REFERENCES categories(id_category),
    id_source           BIGINT NOT NULL REFERENCES sources(id_source),
    id_signal_type      SMALLINT NOT NULL REFERENCES signal_types(id_signal_type),
    id_impact           SMALLINT NOT NULL REFERENCES impacts(id_impact),
    id_urgency          SMALLINT NOT NULL REFERENCES urgencies(id_urgency),
    id_scope            SMALLINT NOT NULL REFERENCES scopes(id_scope),
    id_signal_status    SMALLINT NOT NULL REFERENCES signal_statuses(id_signal_status),
    id_analyst          BIGINT NOT NULL REFERENCES users(id_user),
    id_validator        BIGINT REFERENCES users(id_user),
    validation_date     DATE,
    notes               TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE keywords (
    id_keyword          BIGSERIAL PRIMARY KEY,
    name                VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE signal_keywords (
    id_signal           BIGINT REFERENCES signals(id_signal) ON DELETE CASCADE,
    id_keyword          BIGINT REFERENCES keywords(id_keyword),
    PRIMARY KEY(id_signal, id_keyword)
);

CREATE TABLE trends (
    id_trend            BIGSERIAL PRIMARY KEY,
    business_code       VARCHAR(20) UNIQUE NOT NULL,
    title               VARCHAR(200) NOT NULL,
    narrative           TEXT NOT NULL,
    implications        TEXT,
    first_signal_date   DATE, -- Date of the first signal associated with the trend
    id_trend_direction  SMALLINT REFERENCES trend_directions(id_trend_direction),
    id_trend_maturity   SMALLINT REFERENCES trend_maturity(id_trend_maturity),
    id_trend_status     SMALLINT REFERENCES trend_statuses(id_trend_status),
    id_analyst          BIGINT REFERENCES users(id_user),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE signal_trends (
    id_signal           BIGINT REFERENCES signals(id_signal) ON DELETE CASCADE,
    id_trend            BIGINT REFERENCES trends(id_trend) ON DELETE CASCADE,
    PRIMARY KEY(id_signal, id_trend)
);

CREATE TABLE actors (
    id_actor            BIGSERIAL PRIMARY KEY,
    id_actor_type       SMALLINT REFERENCES actor_types(id_actor_type),
    name                VARCHAR(200) NOT NULL,
    country             VARCHAR(100),
    website             TEXT,
    description         TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trend_actors (
    id_trend            BIGINT REFERENCES trends(id_trend) ON DELETE CASCADE,
    id_actor            BIGINT REFERENCES actors(id_actor) ON DELETE CASCADE,
    PRIMARY KEY(id_trend, id_actor)
);

CREATE TABLE alerts (
    id_alert            BIGSERIAL PRIMARY KEY,
    business_code       VARCHAR(20) UNIQUE NOT NULL,
    title               VARCHAR(150) NOT NULL,
    executive_summary   TEXT NOT NULL,
    implications        TEXT,
    recommendations     TEXT,
    generation_date     DATE NOT NULL,
    response_deadline   DATE,
    id_alert_level      SMALLINT REFERENCES alert_levels(id_alert_level),
    id_alert_status     SMALLINT REFERENCES alert_statuses(id_alert_status),
    id_alert_origin     SMALLINT REFERENCES alert_origins(id_alert_origin), -- Origin of the alert (e.g., internal, external, partner)
    publication_date    DATE,
    activation_rule     TEXT, -- Description of the rule or criteria for activating the alert (Regla de transición aplicada)
    notes               TEXT, -- Additional notes or comments about the alert
    id_creator          BIGINT REFERENCES users(id_user), -- User who created the alert
    id_validator        BIGINT REFERENCES users(id_user), -- User who validated the alert
    validation_date     DATE, -- Date when the alert was validated
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alert_signals (
    id_alert            BIGINT REFERENCES alerts(id_alert) ON DELETE CASCADE,
    id_signal           BIGINT REFERENCES signals(id_signal) ON DELETE CASCADE,
    PRIMARY KEY(id_alert, id_signal)
);

CREATE TABLE alert_trends (
    id_alert            BIGINT REFERENCES alerts(id_alert) ON DELETE CASCADE,
    id_trend            BIGINT REFERENCES trends(id_trend) ON DELETE CASCADE,
    PRIMARY KEY(id_alert, id_trend)
);

CREATE TABLE alert_audiences (
    id_alert            BIGINT REFERENCES alerts(id_alert) ON DELETE CASCADE,
    id_audience         SMALLINT REFERENCES audiences(id_audience),
    PRIMARY KEY(id_alert, id_audience)
);