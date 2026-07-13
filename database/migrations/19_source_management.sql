-- FE-P5.2 prerequisite: internal source management permissions.
INSERT INTO permissions (code, description) VALUES
    ('sources:read-internal', 'Consultar fuentes internas, incluidas las inactivas.'),
    ('sources:create', 'Registrar fuentes de vigilancia.'),
    ('sources:update', 'Actualizar fuentes de vigilancia.'),
    ('sources:deactivate', 'Desactivar fuentes sin eliminar su historial.')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r CROSS JOIN permissions p
WHERE (r.name = 'ANALYST' AND p.code IN (
        'sources:read-internal', 'sources:create', 'sources:update'
    ))
   OR (r.name = 'VALIDATOR' AND p.code IN (
        'sources:read-internal', 'sources:update', 'sources:deactivate'
    ))
   OR (r.name = 'ADMIN' AND p.code LIKE 'sources:%')
ON CONFLICT DO NOTHING;
