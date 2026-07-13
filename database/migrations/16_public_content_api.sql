-- Fase 5.3: frontera de consulta pública para contenido editorial.

CREATE OR REPLACE VIEW vw_public_content AS
SELECT
    content.id_content,
    content.slug,
    content.content_type_id,
    type.code AS type_code,
    type.name AS type_name,
    version.id_content_version AS published_version_id,
    version.version_number,
    version.title,
    version.summary,
    CASE WHEN media.is_public THEN media.id_media ELSE NULL END
        AS featured_media_id,
    CASE WHEN media.is_public THEN media.filename ELSE NULL END
        AS featured_media_filename,
    CASE WHEN media.is_public THEN media.mime_type ELSE NULL END
        AS featured_media_mime_type,
    version.published_at
FROM content
INNER JOIN content_types type
    ON type.id_content_type = content.content_type_id
INNER JOIN content_version version
    ON version.id_content_version = content.published_version_id
   AND version.content_id = content.id_content
LEFT JOIN media
    ON media.id_media = version.featured_media_id
WHERE content.published_version_id IS NOT NULL
  AND version.published_at IS NOT NULL
  AND content.archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_content_public_pointer
    ON content (content_type_id, published_version_id)
    WHERE published_version_id IS NOT NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_content_version_public_search
    ON content_version USING GIN (
        to_tsvector(
            'spanish',
            COALESCE(title, '') || ' ' || COALESCE(summary, '')
        )
    )
    WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_version_category_public_filter
    ON content_version_category (category_id, content_version_id);

