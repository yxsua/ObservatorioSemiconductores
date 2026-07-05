BEGIN;

------------------------------------------------------------
-- FACTORES CRÍTICOS DE VIGILANCIA
------------------------------------------------------------

CREATE TABLE fcv (
    id              SMALLSERIAL PRIMARY KEY,
    code            VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

------------------------------------------------------------
-- CATEGORÍAS
------------------------------------------------------------

CREATE TABLE categories (
    id              SMALLSERIAL PRIMARY KEY,
    fcv_id          SMALLINT NOT NULL REFERENCES fcv(id),
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    active          BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_category UNIQUE(fcv_id, name)
);

------------------------------------------------------------
-- TIPO DE FUENTE
------------------------------------------------------------

CREATE TABLE source_types (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT
);

------------------------------------------------------------
-- TIPO DE SEÑAL
------------------------------------------------------------

CREATE TABLE signal_types (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(30) UNIQUE NOT NULL,
    description     TEXT
);

------------------------------------------------------------
-- IMPACTO
------------------------------------------------------------

CREATE TABLE impacts (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(30) UNIQUE NOT NULL,
    weight          SMALLINT NOT NULL CHECK(weight BETWEEN 1 AND 3)
);

------------------------------------------------------------
-- URGENCIA
------------------------------------------------------------

CREATE TABLE urgencies (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(30) UNIQUE NOT NULL,
    weight          SMALLINT NOT NULL CHECK(weight BETWEEN 1 AND 3)
);

------------------------------------------------------------
-- ALCANCE
------------------------------------------------------------

CREATE TABLE scopes (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- ESTADOS DE SEÑAL
------------------------------------------------------------

CREATE TABLE signal_statuses (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(40) UNIQUE NOT NULL,
    description     TEXT
);

------------------------------------------------------------
-- MADUREZ DE TENDENCIA
------------------------------------------------------------

CREATE TABLE trend_maturity (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT
);

------------------------------------------------------------
-- ESTADO DE TENDENCIA
------------------------------------------------------------

CREATE TABLE trend_statuses (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- DIRECCIÓN DE TENDENCIA
------------------------------------------------------------

CREATE TABLE trend_directions (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- NIVEL DE ALERTA
------------------------------------------------------------

CREATE TABLE alert_levels (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(30) UNIQUE NOT NULL,
    color           VARCHAR(20)
);

------------------------------------------------------------
-- ESTADO DE ALERTA
------------------------------------------------------------

CREATE TABLE alert_statuses (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- AUDIENCIAS
------------------------------------------------------------

CREATE TABLE audiences (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(60) UNIQUE NOT NULL
);

------------------------------------------------------------
-- TIPOS DE CONTENIDO
------------------------------------------------------------

CREATE TABLE content_types (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- ESTADOS DE CONTENIDO
------------------------------------------------------------

CREATE TABLE content_statuses (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- TIPOS DE ARCHIVO
------------------------------------------------------------

CREATE TABLE file_types (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(40) UNIQUE NOT NULL
);

------------------------------------------------------------
-- TIPOS DE ACTOR
------------------------------------------------------------

CREATE TABLE actor_types (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL
);

COMMIT;