-- Administración interna de medios editoriales.

ALTER TABLE media
    ADD COLUMN IF NOT EXISTS title VARCHAR(250),
    ADD COLUMN IF NOT EXISTS alt_text VARCHAR(500),
    ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE media DROP CONSTRAINT IF EXISTS chk_media_size_nonnegative;
ALTER TABLE media ADD CONSTRAINT chk_media_size_nonnegative
    CHECK (size_bytes IS NULL OR size_bytes >= 0);

CREATE INDEX IF NOT EXISTS idx_media_created_at ON media (created_at DESC, id_media DESC);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media (mime_type);

INSERT INTO permissions (code, description) VALUES
    ('media:read-internal', 'Consultar la biblioteca interna de medios.'),
    ('media:create', 'Cargar medios editoriales.'),
    ('media:update', 'Modificar metadatos y visibilidad de medios.')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions (id_role, id_permission)
SELECT role.id_role, permission.id_permission
FROM roles role CROSS JOIN permissions permission
WHERE role.name IN ('EDITOR', 'PUBLISHER')
  AND permission.code IN ('media:read-internal', 'media:create', 'media:update')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id_role, id_permission)
SELECT role.id_role, permission.id_permission
FROM roles role CROSS JOIN permissions permission
WHERE role.name = 'ADMIN'
  AND permission.code LIKE 'media:%'
ON CONFLICT DO NOTHING;
