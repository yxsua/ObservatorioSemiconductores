------------------------------------------------------------
-- FACTORES CRÍTICOS DE VIGILANCIA
------------------------------------------------------------

CREATE TABLE fcv (
    id_fcv              SMALLSERIAL PRIMARY KEY,
    code                VARCHAR(20) UNIQUE NOT NULL,
    name                VARCHAR(120) NOT NULL,
    description         TEXT,
    active              BOOLEAN NOT NULL DEFAULT TRUE
);

------------------------------------------------------------
-- CATEGORÍAS
------------------------------------------------------------

CREATE TABLE categories (
    id_category         SMALLSERIAL PRIMARY KEY,
    id_fcv              SMALLINT NOT NULL REFERENCES fcv(id_fcv),
    name                VARCHAR(120) NOT NULL,
    description         TEXT,
    active              BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_category UNIQUE(id_fcv, name)
);

------------------------------------------------------------
-- TIPO DE FUENTE
------------------------------------------------------------

CREATE TABLE source_types (
    id_source_type      SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(50) UNIQUE NOT NULL,
    description         TEXT
);

------------------------------------------------------------
-- TIPO DE SEÑAL
------------------------------------------------------------

CREATE TABLE signal_types (
    id_signal_type      SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(30) UNIQUE NOT NULL,
    description         TEXT
);

------------------------------------------------------------
-- IMPACTO
------------------------------------------------------------

CREATE TABLE impacts (
    id_impact           SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(30) UNIQUE NOT NULL,
    weight              SMALLINT NOT NULL CHECK (weight BETWEEN 1 AND 3)
);

------------------------------------------------------------
-- URGENCIA
------------------------------------------------------------

CREATE TABLE urgencies (
    id_urgency          SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(30) UNIQUE NOT NULL,
    weight              SMALLINT NOT NULL CHECK (weight BETWEEN 1 AND 3)
);

------------------------------------------------------------
-- ALCANCE
------------------------------------------------------------

CREATE TABLE scopes (
    id_scope            SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- ESTADOS DE SEÑAL
------------------------------------------------------------

CREATE TABLE signal_statuses (
    id_signal_status    SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL,
    description         TEXT
);

------------------------------------------------------------
-- MADUREZ DE TENDENCIA
------------------------------------------------------------

CREATE TABLE trend_maturity (
    id_trend_maturity   SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(50) UNIQUE NOT NULL,
    description         TEXT
);

------------------------------------------------------------
-- ESTADO DE TENDENCIA
------------------------------------------------------------

CREATE TABLE trend_statuses (
    id_trend_status     SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- DIRECCIÓN DE TENDENCIA
------------------------------------------------------------

CREATE TABLE trend_directions (
    id_trend_direction  SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- NIVEL DE ALERTA
------------------------------------------------------------

CREATE TABLE alert_levels (
    id_alert_level      SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(30) UNIQUE NOT NULL,
    color               VARCHAR(20)
);

------------------------------------------------------------
-- ESTADO DE ALERTA
------------------------------------------------------------

CREATE TABLE alert_statuses (
    id_alert_status     SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL
);


------------------------------------------------------------
-- ORIGEN DE ALERTA
------------------------------------------------------------

CREATE TABLE alert_origins (
    id_alert_origin     SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- AUDIENCIAS
------------------------------------------------------------

CREATE TABLE audiences (
    id_audience         SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(60) UNIQUE NOT NULL
);

------------------------------------------------------------
-- TIPOS DE CONTENIDO
------------------------------------------------------------

CREATE TABLE content_types (
    id_content_type     SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- ESTADOS DE CONTENIDO
------------------------------------------------------------

CREATE TABLE content_statuses (
    id_content_status   SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- TIPOS DE ARCHIVO
------------------------------------------------------------

CREATE TABLE file_types (
    id_file_type        SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- TIPOS DE ACTOR
------------------------------------------------------------

CREATE TABLE actor_types (
    id_actor_type       SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(50) UNIQUE NOT NULL
);