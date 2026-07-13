-- Índices de soporte para claves foráneas, filtros y búsquedas del MVP.
-- PostgreSQL no crea índices automáticamente para las columnas que referencian FK.

-- Seguridad y usuarios
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission
    ON role_permissions (id_permission);
CREATE INDEX IF NOT EXISTS idx_user_roles_role
    ON user_roles (id_role);
CREATE INDEX IF NOT EXISTS idx_users_active
    ON users (active);

-- Catálogos
CREATE INDEX IF NOT EXISTS idx_categories_fcv
    ON categories (id_fcv);
CREATE INDEX IF NOT EXISTS idx_categories_parent
    ON categories (parent_category_id)
    WHERE parent_category_id IS NOT NULL;

-- Vigilancia
CREATE INDEX IF NOT EXISTS idx_sources_type_active
    ON sources (id_source_type, active);
CREATE INDEX IF NOT EXISTS idx_signals_status_publication
    ON signals (id_signal_status, publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_signals_category_publication
    ON signals (id_category, publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_signals_source
    ON signals (id_source);
CREATE INDEX IF NOT EXISTS idx_signals_analyst
    ON signals (id_analyst);
CREATE INDEX IF NOT EXISTS idx_signals_validator
    ON signals (id_validator)
    WHERE id_validator IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signals_ips
    ON signals (ips DESC)
    WHERE ips IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signals_search
    ON signals USING GIN (
        to_tsvector(
            'spanish',
            coalesce(title, '') || ' ' || coalesce(summary, '')
        )
    );
CREATE INDEX IF NOT EXISTS idx_signal_keywords_keyword
    ON signal_keywords (id_keyword);
CREATE INDEX IF NOT EXISTS idx_signal_trends_trend
    ON signal_trends (id_trend);

CREATE INDEX IF NOT EXISTS idx_trends_status_updated
    ON trends (id_trend_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_maturity
    ON trends (id_trend_maturity);
CREATE INDEX IF NOT EXISTS idx_trends_analyst
    ON trends (id_analyst);
CREATE INDEX IF NOT EXISTS idx_trends_search
    ON trends USING GIN (
        to_tsvector(
            'spanish',
            coalesce(title, '') || ' ' || coalesce(narrative, '') || ' ' ||
            coalesce(implications, '')
        )
    );
CREATE INDEX IF NOT EXISTS idx_trend_actors_actor
    ON trend_actors (id_actor);

CREATE INDEX IF NOT EXISTS idx_alerts_status_generation
    ON alerts (id_alert_status, generation_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_level
    ON alerts (id_alert_level);
CREATE INDEX IF NOT EXISTS idx_alerts_creator
    ON alerts (id_creator);
CREATE INDEX IF NOT EXISTS idx_alerts_search
    ON alerts USING GIN (
        to_tsvector(
            'spanish',
            coalesce(title, '') || ' ' || coalesce(executive_summary, '') || ' ' ||
            coalesce(implications, '') || ' ' || coalesce(recommendations, '')
        )
    );
CREATE INDEX IF NOT EXISTS idx_alert_signals_signal
    ON alert_signals (id_signal);
CREATE INDEX IF NOT EXISTS idx_alert_trends_trend
    ON alert_trends (id_trend);
CREATE INDEX IF NOT EXISTS idx_alert_audiences_audience
    ON alert_audiences (id_audience);

-- CMS editorial
CREATE INDEX IF NOT EXISTS idx_content_status_published
    ON content (status_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_type_status
    ON content (content_type_id, status_id);
CREATE INDEX IF NOT EXISTS idx_content_author
    ON content (author_id);
CREATE INDEX IF NOT EXISTS idx_content_search
    ON content USING GIN (
        to_tsvector(
            'spanish',
            coalesce(title, '') || ' ' || coalesce(summary, '')
        )
    );
CREATE INDEX IF NOT EXISTS idx_content_version_content_created
    ON content_version (content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_section_position
    ON content_section (content_version_id, position);
CREATE INDEX IF NOT EXISTS idx_content_section_type
    ON content_section (section_type_id);
CREATE INDEX IF NOT EXISTS idx_content_block_position
    ON content_block (section_id, position);
CREATE INDEX IF NOT EXISTS idx_content_block_type
    ON content_block (block_type_id);
CREATE INDEX IF NOT EXISTS idx_content_category_category
    ON content_category (category_id);
CREATE INDEX IF NOT EXISTS idx_content_relation_target
    ON content_relation (target_content_id);
CREATE INDEX IF NOT EXISTS idx_content_signal_signal
    ON content_signal (signal_id);
CREATE INDEX IF NOT EXISTS idx_content_trend_trend
    ON content_trend (trend_id);
CREATE INDEX IF NOT EXISTS idx_content_alert_alert
    ON content_alert (alert_id);

-- Plantillas
CREATE INDEX IF NOT EXISTS idx_content_templates_type_active
    ON content_templates (content_type_id, active);
CREATE INDEX IF NOT EXISTS idx_template_sections_template_position
    ON template_sections (template_id, position);
CREATE INDEX IF NOT EXISTS idx_template_blocks_section_position
    ON template_blocks (template_section_id, position);
CREATE INDEX IF NOT EXISTS idx_template_allowed_block_type
    ON template_section_allowed_blocks (block_type_id);
