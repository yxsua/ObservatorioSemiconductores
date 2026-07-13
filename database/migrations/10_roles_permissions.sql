-- Fase 1: línea base de seguridad y permisos.
-- Esta migración es idempotente y no modifica las migraciones ya aplicadas.

INSERT INTO roles (name, description) VALUES
    ('MEMBER', 'Cuenta pública registrada con acceso a exportaciones.'),
    ('ANALYST', 'Captura y análisis de vigilancia tecnológica.'),
    ('VALIDATOR', 'Revisión y validación metodológica.'),
    ('EDITOR', 'Creación y edición de contenido editorial.'),
    ('PUBLISHER', 'Aprobación y publicación de contenido editorial.'),
    ('ADMIN', 'Administración completa del observatorio.')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO permissions (code, description) VALUES
    ('profile:read-own', 'Consultar el perfil propio.'),
    ('profile:update-own', 'Actualizar el perfil propio.'),
    ('exports:download', 'Descargar y exportar información pública.'),

    ('signals:read-internal', 'Consultar señales y campos internos.'),
    ('signals:create', 'Crear señales.'),
    ('signals:update-own', 'Modificar señales propias.'),
    ('signals:update-any', 'Modificar cualquier señal.'),
    ('signals:submit', 'Enviar señales a revisión.'),
    ('signals:validate', 'Validar o reabrir señales.'),
    ('signals:archive', 'Archivar señales.'),

    ('trends:read-internal', 'Consultar tendencias internas.'),
    ('trends:create', 'Crear tendencias.'),
    ('trends:update', 'Modificar tendencias.'),
    ('trends:link-signals', 'Vincular señales con tendencias.'),
    ('trends:submit', 'Enviar tendencias a revisión.'),
    ('trends:validate', 'Validar tendencias.'),
    ('trends:activate', 'Activar tendencias públicas.'),
    ('trends:archive', 'Archivar tendencias.'),

    ('alerts:read-internal', 'Consultar alertas internas.'),
    ('alerts:create', 'Crear alertas.'),
    ('alerts:update', 'Modificar alertas.'),
    ('alerts:link-evidence', 'Vincular evidencia con alertas.'),
    ('alerts:submit', 'Enviar alertas a revisión.'),
    ('alerts:validate', 'Validar alertas.'),
    ('alerts:publish', 'Publicar alertas.'),
    ('alerts:close', 'Cerrar alertas.'),

    ('content:read-internal', 'Consultar contenido editorial interno.'),
    ('content:create', 'Crear contenido editorial.'),
    ('content:update', 'Modificar contenido editorial.'),
    ('content:submit', 'Enviar contenido a revisión.'),
    ('content:approve', 'Aprobar contenido editorial.'),
    ('content:publish', 'Publicar contenido editorial.'),
    ('content:archive', 'Archivar contenido editorial.'),

    ('catalogs:manage', 'Administrar catálogos.'),
    ('users:manage', 'Administrar usuarios.'),
    ('roles:manage', 'Administrar roles y permisos.')
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description;

-- MEMBER
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'MEMBER'
  AND p.code IN (
      'profile:read-own',
      'profile:update-own',
      'exports:download'
  )
ON CONFLICT DO NOTHING;

-- ANALYST hereda conceptualmente las capacidades de MEMBER.
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ANALYST'
  AND p.code IN (
      'profile:read-own', 'profile:update-own', 'exports:download',
      'signals:read-internal', 'signals:create', 'signals:update-own',
      'signals:submit',
      'trends:read-internal', 'trends:create', 'trends:update',
      'trends:link-signals', 'trends:submit',
      'alerts:read-internal', 'alerts:create', 'alerts:update',
      'alerts:link-evidence', 'alerts:submit'
  )
ON CONFLICT DO NOTHING;

-- VALIDATOR
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'VALIDATOR'
  AND p.code IN (
      'profile:read-own', 'profile:update-own', 'exports:download',
      'signals:read-internal', 'signals:update-any', 'signals:validate',
      'signals:archive',
      'trends:read-internal', 'trends:update', 'trends:link-signals',
      'trends:validate', 'trends:activate', 'trends:archive',
      'alerts:read-internal', 'alerts:update', 'alerts:link-evidence',
      'alerts:validate', 'alerts:close'
  )
ON CONFLICT DO NOTHING;

-- EDITOR
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'EDITOR'
  AND p.code IN (
      'profile:read-own', 'profile:update-own', 'exports:download',
      'signals:read-internal', 'trends:read-internal', 'alerts:read-internal',
      'content:read-internal', 'content:create', 'content:update', 'content:submit'
  )
ON CONFLICT DO NOTHING;

-- PUBLISHER
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'PUBLISHER'
  AND p.code IN (
      'profile:read-own', 'profile:update-own', 'exports:download',
      'signals:read-internal', 'trends:read-internal', 'alerts:read-internal',
      'content:read-internal', 'content:update', 'content:approve',
      'content:publish', 'content:archive', 'alerts:publish'
  )
ON CONFLICT DO NOTHING;

-- ADMIN recibe todos los permisos actuales. Las migraciones futuras deben asignarle
-- explícitamente cualquier permiso nuevo.
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Las cuentas existentes sin rol pasan a ser MEMBER.
INSERT INTO user_roles (id_user, id_role)
SELECT u.id_user, r.id_role
FROM users u
CROSS JOIN roles r
WHERE r.name = 'MEMBER'
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.id_user = u.id_user
  )
ON CONFLICT DO NOTHING;
