CREATE TABLE users (
    id_user             BIGSERIAL PRIMARY KEY,
    first_name          VARCHAR(80) NOT NULL,
    last_name           VARCHAR(80) NOT NULL,
    email               VARCHAR(150) UNIQUE NOT NULL,
    password_hash       TEXT NOT NULL,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    last_login          TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id_role             SMALLSERIAL PRIMARY KEY,
    name                VARCHAR(50) UNIQUE NOT NULL,
    description         TEXT
);

CREATE TABLE permissions (
    id_permission       SMALLSERIAL PRIMARY KEY,
    code                VARCHAR(60) UNIQUE NOT NULL,
    description         TEXT
);

CREATE TABLE role_permissions (
    id_role             SMALLINT REFERENCES roles(id_role),
    id_permission       SMALLINT REFERENCES permissions(id_permission),
    PRIMARY KEY(id_role, id_permission)
);

CREATE TABLE user_roles (
    id_user             BIGINT REFERENCES users(id_user),
    id_role             SMALLINT REFERENCES roles(id_role),
    PRIMARY KEY(id_user, id_role)
);