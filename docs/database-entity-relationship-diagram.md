# Modelo entidad-relación del MVP

Este documento reconstruye el esquema efectivo de PostgreSQL a partir de las migraciones `01` a `22`. El modelo se divide por dominios para mantener legibles las relaciones. Los atributos mostrados son claves y campos funcionales principales; las tablas conservan columnas adicionales de auditoría, descripción y configuración.

## Vista general

```mermaid
flowchart LR
    IAM["Identidad y acceso\nusers · roles · permissions"]
    CAT["Catálogos y taxonomía\nfcv · categories · estados · niveles"]
    VT["Vigilancia tecnológica\nsources · signals · trends · alerts"]
    ED["Editorial\ncontent · versions · sections · blocks"]
    TM["Plantillas\ncontent_templates"]
    OP["Operación pública\nexports · view counts"]

    IAM -->|autoría, validación y publicación| VT
    IAM -->|autoría y flujo editorial| ED
    IAM -->|usuario registrado| OP
    CAT --> VT
    CAT --> ED
    VT -->|objetos relacionados| ED
    TM -->|estructura sugerida| ED
    ED --> OP
    VT --> OP
```

## 1. Identidad y control de acceso

Los usuarios y roles tienen una relación muchos-a-muchos. Los permisos se asignan a roles, no directamente a usuarios.

```mermaid
erDiagram
    USERS {
        bigint id_user PK
        varchar email UK
        varchar password_hash
        boolean active
        timestamp last_login
    }
    ROLES {
        int id_role PK
        varchar name UK
    }
    PERMISSIONS {
        int id_permission PK
        varchar code UK
    }
    USER_ROLES {
        bigint id_user PK, FK
        int id_role PK, FK
    }
    ROLE_PERMISSIONS {
        int id_role PK, FK
        int id_permission PK, FK
    }

    USERS ||--o{ USER_ROLES : tiene
    ROLES ||--o{ USER_ROLES : se_asigna
    ROLES ||--o{ ROLE_PERMISSIONS : concede
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : contiene
```

## 2. Taxonomía y vigilancia tecnológica

`signals` es el núcleo de captura. Una señal pertenece a una fuente y categoría, recibe clasificaciones que permiten calcular su IPS y puede alimentar múltiples tendencias y alertas. Las tendencias agregan señales y actores; las alertas pueden relacionar señales, tendencias y audiencias simultáneamente.

```mermaid
erDiagram
    FCV {
        int id_fcv PK
        varchar code UK
        varchar name
    }
    CATEGORIES {
        int id_category PK
        int id_fcv FK
        int parent_category_id FK
        varchar name
    }
    SOURCE_TYPES {
        int id_source_type PK
        varchar code UK
    }
    SOURCES {
        bigint id_source PK
        int id_source_type FK
        varchar name
        varchar website
        numeric reliability
        boolean active
    }
    SIGNALS {
        bigint id_signal PK
        varchar business_code UK
        int id_category FK
        bigint id_source FK
        int id_signal_type FK
        int id_impact FK
        int id_urgency FK
        int id_scope FK
        int id_signal_status FK
        int id_reliability FK
        bigint id_analyst FK
        bigint id_validator FK
        numeric ips
        varchar title
    }
    SIGNAL_TYPES {
        int id_signal_type PK
        varchar code UK
    }
    IMPACTS {
        int id_impact PK
        varchar code UK
        numeric weight
    }
    URGENCIES {
        int id_urgency PK
        varchar code UK
        numeric weight
    }
    SCOPES {
        int id_scope PK
        varchar code UK
    }
    RELIABILITY_LEVELS {
        int id_reliability PK
        varchar code UK
        numeric weight
    }
    SIGNAL_STATUSES {
        int id_signal_status PK
        varchar code UK
    }
    KEYWORDS {
        bigint id_keyword PK
        varchar name UK
    }
    SIGNAL_KEYWORDS {
        bigint id_signal PK, FK
        bigint id_keyword PK, FK
    }
    TRENDS {
        bigint id_trend PK
        varchar business_code UK
        int id_trend_direction FK
        int id_trend_maturity FK
        int id_trend_status FK
        bigint id_analyst FK
        bigint id_validator FK
        varchar title
    }
    TREND_DIRECTIONS {
        int id_trend_direction PK
        varchar code UK
    }
    TREND_MATURITY {
        int id_trend_maturity PK
        varchar code UK
    }
    TREND_STATUSES {
        int id_trend_status PK
        varchar code UK
    }
    SIGNAL_TRENDS {
        bigint id_signal PK, FK
        bigint id_trend PK, FK
    }
    ACTOR_TYPES {
        int id_actor_type PK
        varchar code UK
    }
    ACTORS {
        bigint id_actor PK
        int id_actor_type FK
        varchar name
    }
    TREND_ACTORS {
        bigint id_trend PK, FK
        bigint id_actor PK, FK
    }
    ALERTS {
        bigint id_alert PK
        varchar business_code UK
        int id_alert_level FK
        int id_alert_status FK
        int id_alert_origin FK
        bigint id_creator FK
        bigint id_validator FK
        bigint id_publisher FK
        varchar title
    }
    ALERT_LEVELS {
        int id_alert_level PK
        varchar code UK
    }
    ALERT_STATUSES {
        int id_alert_status PK
        varchar code UK
    }
    ALERT_ORIGINS {
        int id_alert_origin PK
        varchar code UK
    }
    ALERT_SIGNALS {
        bigint id_alert PK, FK
        bigint id_signal PK, FK
    }
    ALERT_TRENDS {
        bigint id_alert PK, FK
        bigint id_trend PK, FK
    }
    AUDIENCES {
        int id_audience PK
        varchar code UK
    }
    ALERT_AUDIENCES {
        bigint id_alert PK, FK
        int id_audience PK, FK
    }
    USERS {
        bigint id_user PK
        varchar email UK
    }

    FCV ||--o{ CATEGORIES : agrupa
    CATEGORIES o|--o{ CATEGORIES : categoria_padre
    SOURCE_TYPES ||--o{ SOURCES : clasifica
    SOURCES ||--o{ SIGNALS : sustenta
    CATEGORIES ||--o{ SIGNALS : clasifica
    SIGNAL_TYPES ||--o{ SIGNALS : tipifica
    IMPACTS ||--o{ SIGNALS : pondera
    URGENCIES ||--o{ SIGNALS : pondera
    SCOPES ||--o{ SIGNALS : delimita
    RELIABILITY_LEVELS ||--o{ SIGNALS : pondera
    SIGNAL_STATUSES ||--o{ SIGNALS : estado_actual
    USERS ||--o{ SIGNALS : analiza
    USERS o|--o{ SIGNALS : valida
    SIGNALS ||--o{ SIGNAL_KEYWORDS : etiqueta
    KEYWORDS ||--o{ SIGNAL_KEYWORDS : pertenece

    TREND_DIRECTIONS ||--o{ TRENDS : direccion
    TREND_MATURITY ||--o{ TRENDS : madurez
    TREND_STATUSES ||--o{ TRENDS : estado_actual
    USERS ||--o{ TRENDS : analiza
    USERS o|--o{ TRENDS : valida
    SIGNALS ||--o{ SIGNAL_TRENDS : evidencia
    TRENDS ||--o{ SIGNAL_TRENDS : agrega
    ACTOR_TYPES ||--o{ ACTORS : clasifica
    TRENDS ||--o{ TREND_ACTORS : involucra
    ACTORS ||--o{ TREND_ACTORS : participa

    ALERT_LEVELS ||--o{ ALERTS : severidad
    ALERT_STATUSES ||--o{ ALERTS : estado_actual
    ALERT_ORIGINS ||--o{ ALERTS : origen
    USERS ||--o{ ALERTS : crea
    USERS o|--o{ ALERTS : valida
    USERS o|--o{ ALERTS : publica
    ALERTS ||--o{ ALERT_SIGNALS : incluye
    SIGNALS ||--o{ ALERT_SIGNALS : dispara
    ALERTS ||--o{ ALERT_TRENDS : incluye
    TRENDS ||--o{ ALERT_TRENDS : contextualiza
    ALERTS ||--o{ ALERT_AUDIENCES : dirige
    AUDIENCES ||--o{ ALERT_AUDIENCES : recibe
```

### Historial de estados de vigilancia

Cada agregado conserva su estado actual en la tabla principal y registra cada transición en una tabla de historial con estado anterior, estado nuevo, actor, código de transición, notas y fecha.

```mermaid
erDiagram
    SIGNALS ||--o{ SIGNAL_STATUS_HISTORY : registra
    SIGNAL_STATUSES o|--o{ SIGNAL_STATUS_HISTORY : estado_anterior
    SIGNAL_STATUSES ||--o{ SIGNAL_STATUS_HISTORY : estado_nuevo
    USERS ||--o{ SIGNAL_STATUS_HISTORY : ejecuta

    TRENDS ||--o{ TREND_STATUS_HISTORY : registra
    TREND_STATUSES o|--o{ TREND_STATUS_HISTORY : estado_anterior
    TREND_STATUSES ||--o{ TREND_STATUS_HISTORY : estado_nuevo
    USERS ||--o{ TREND_STATUS_HISTORY : ejecuta

    ALERTS ||--o{ ALERT_STATUS_HISTORY : registra
    ALERT_STATUSES o|--o{ ALERT_STATUS_HISTORY : estado_anterior
    ALERT_STATUSES ||--o{ ALERT_STATUS_HISTORY : estado_nuevo
    USERS ||--o{ ALERT_STATUS_HISTORY : ejecuta

    SIGNAL_STATUS_HISTORY {
        bigint id_signal_status_history PK
        bigint id_signal FK
        int from_status_id FK
        int to_status_id FK
        bigint changed_by FK
        varchar transition_code
    }
    TREND_STATUS_HISTORY {
        bigint id_trend_status_history PK
        bigint id_trend FK
        int from_status_id FK
        int to_status_id FK
        bigint changed_by FK
        varchar transition_code
    }
    ALERT_STATUS_HISTORY {
        bigint id_alert_status_history PK
        bigint id_alert FK
        int from_status_id FK
        int to_status_id FK
        bigint changed_by FK
        varchar transition_code
    }
    SIGNALS { bigint id_signal PK }
    TRENDS { bigint id_trend PK }
    ALERTS { bigint id_alert PK }
    SIGNAL_STATUSES { int id_signal_status PK }
    TREND_STATUSES { int id_trend_status PK }
    ALERT_STATUSES { int id_alert_status PK }
    USERS { bigint id_user PK }
```

## 3. Contenido editorial versionado

`content` identifica la publicación y conserva el estado editorial actual. `content_version` guarda revisiones; cada versión contiene secciones ordenadas y cada sección bloques JSON tipados. `current_version_id` selecciona la revisión de trabajo y `published_version_id` fija la revisión pública inmutable.

```mermaid
erDiagram
    CONTENT_TYPES {
        int id_content_type PK
        varchar code UK
    }
    CONTENT_STATUSES {
        int id_content_status PK
        varchar code UK
    }
    MEDIA {
        bigint id_media PK
        bigint uploaded_by FK
        bigint created_by FK
        varchar filename
        varchar mime_type
        boolean is_public
    }
    CONTENT {
        bigint id_content PK
        int content_type_id FK
        int status_id FK
        bigint author_id FK
        bigint featured_media_id FK
        bigint current_version_id FK
        bigint published_version_id FK
        bigint approved_by FK
        bigint published_by FK
        bigint archived_by FK
        varchar slug UK
        varchar title
    }
    CONTENT_VERSION {
        bigint id_content_version PK
        bigint content_id FK
        bigint created_by FK
        bigint featured_media_id FK
        bigint approved_by FK
        bigint published_by FK
        int version_number
        varchar title
    }
    CONTENT_SECTION {
        bigint id_content_section PK
        bigint content_version_id FK
        int section_type_id FK
        int position
        boolean is_visible
    }
    SECTION_TYPES {
        int id_section_type PK
        varchar code UK
    }
    CONTENT_BLOCK {
        bigint id_content_block PK
        bigint section_id FK
        int block_type_id FK
        int position
        int schema_version
        jsonb data
    }
    BLOCK_TYPE {
        int id_block_type PK
        varchar code UK
        int schema_version
        boolean active
        boolean public_allowed
        jsonb schema
    }
    CONTENT_STATUS_HISTORY {
        bigint id_content_status_history PK
        bigint content_id FK
        bigint content_version_id FK
        int from_status_id FK
        int to_status_id FK
        bigint changed_by FK
        varchar transition_code
    }
    CONTENT_VERSION_CATEGORY {
        bigint content_version_id PK, FK
        int category_id PK, FK
    }
    CONTENT_VERSION_SIGNAL {
        bigint content_version_id PK, FK
        bigint signal_id PK, FK
    }
    CONTENT_VERSION_TREND {
        bigint content_version_id PK, FK
        bigint trend_id PK, FK
    }
    CONTENT_VERSION_ALERT {
        bigint content_version_id PK, FK
        bigint alert_id PK, FK
    }
    CONTENT_RELATION {
        bigint source_content_id PK, FK
        bigint target_content_id PK, FK
        int relation_type_id PK, FK
    }
    CONTENT_RELATION_TYPES {
        int id_content_relation_type PK
        varchar code UK
    }
    USERS { bigint id_user PK }
    CATEGORIES { int id_category PK }
    SIGNALS { bigint id_signal PK }
    TRENDS { bigint id_trend PK }
    ALERTS { bigint id_alert PK }

    CONTENT_TYPES ||--o{ CONTENT : tipifica
    CONTENT_STATUSES ||--o{ CONTENT : estado_actual
    USERS ||--o{ CONTENT : autor
    MEDIA o|--o{ CONTENT : portada
    CONTENT ||--|{ CONTENT_VERSION : versiona
    CONTENT o|--o| CONTENT_VERSION : version_actual
    CONTENT o|--o| CONTENT_VERSION : version_publicada
    USERS ||--o{ CONTENT_VERSION : edita
    USERS o|--o{ CONTENT_VERSION : aprueba
    USERS o|--o{ CONTENT_VERSION : publica
    MEDIA o|--o{ CONTENT_VERSION : portada_version
    CONTENT_VERSION ||--o{ CONTENT_SECTION : contiene
    SECTION_TYPES o|--o{ CONTENT_SECTION : clasifica
    CONTENT_SECTION ||--o{ CONTENT_BLOCK : contiene
    BLOCK_TYPE ||--o{ CONTENT_BLOCK : valida

    CONTENT ||--o{ CONTENT_STATUS_HISTORY : registra
    CONTENT_VERSION o|--o{ CONTENT_STATUS_HISTORY : contextualiza
    CONTENT_STATUSES o|--o{ CONTENT_STATUS_HISTORY : estado_anterior
    CONTENT_STATUSES ||--o{ CONTENT_STATUS_HISTORY : estado_nuevo
    USERS ||--o{ CONTENT_STATUS_HISTORY : ejecuta

    CONTENT_VERSION ||--o{ CONTENT_VERSION_CATEGORY : clasifica
    CATEGORIES ||--o{ CONTENT_VERSION_CATEGORY : aplica
    CONTENT_VERSION ||--o{ CONTENT_VERSION_SIGNAL : vincula
    SIGNALS ||--o{ CONTENT_VERSION_SIGNAL : fundamenta
    CONTENT_VERSION ||--o{ CONTENT_VERSION_TREND : vincula
    TRENDS ||--o{ CONTENT_VERSION_TREND : fundamenta
    CONTENT_VERSION ||--o{ CONTENT_VERSION_ALERT : vincula
    ALERTS ||--o{ CONTENT_VERSION_ALERT : fundamenta

    CONTENT ||--o{ CONTENT_RELATION : origen
    CONTENT ||--o{ CONTENT_RELATION : destino
    CONTENT_RELATION_TYPES ||--o{ CONTENT_RELATION : tipifica
```

### Relaciones editoriales heredadas

El esquema aún conserva `content_category`, `content_signal`, `content_trend` y `content_alert`, que vinculan el contenido sin distinguir versión. La migración `14_editorial_domain.sql` copia esos datos a las tablas `content_version_*`. Para nuevas operaciones, las relaciones versionadas son el modelo más consistente con la publicación inmutable.

## 4. Plantillas, exportaciones y visitas

```mermaid
erDiagram
    CONTENT_TYPES ||--o{ CONTENT_TEMPLATES : dispone
    CONTENT_TEMPLATES ||--o{ TEMPLATE_SECTIONS : contiene
    SECTION_TYPES ||--o{ TEMPLATE_SECTIONS : tipifica
    TEMPLATE_SECTIONS ||--o{ TEMPLATE_BLOCKS : propone
    BLOCK_TYPE ||--o{ TEMPLATE_BLOCKS : instancia
    TEMPLATE_SECTIONS ||--o{ TEMPLATE_SECTION_ALLOWED_BLOCKS : permite
    BLOCK_TYPE ||--o{ TEMPLATE_SECTION_ALLOWED_BLOCKS : autorizado
    USERS ||--o{ EXPORT_HISTORY : solicita

    CONTENT_TEMPLATES {
        bigint id_template PK
        int content_type_id FK
        varchar name
        boolean active
    }
    TEMPLATE_SECTIONS {
        bigint id_template_section PK
        bigint template_id FK
        int section_type_id FK
        int position
        boolean required
        boolean repeatable
    }
    TEMPLATE_BLOCKS {
        bigint id_template_block PK
        bigint template_section_id FK
        int block_type_id FK
        int position
        boolean required
        jsonb default_data
    }
    TEMPLATE_SECTION_ALLOWED_BLOCKS {
        bigint template_section_id PK, FK
        int block_type_id PK, FK
        int min_occurrences
        int max_occurrences
    }
    CONTENT_TYPES { int id_content_type PK }
    SECTION_TYPES { int id_section_type PK }
    BLOCK_TYPE { int id_block_type PK }
    USERS { bigint id_user PK }
    EXPORT_HISTORY {
        bigint id_export PK
        bigint user_id FK
        varchar resource_code
        varchar format_code
        jsonb filters
        bigint row_count
    }
    PUBLIC_VIEW_COUNTS {
        varchar resource_type PK
        bigint resource_id PK
        bigint view_count
        timestamp updated_at
    }
```

`public_view_counts` implementa una asociación polimórfica lógica: `(resource_type, resource_id)` puede identificar `content`, `signal`, `trend` o `alert`. No existe una clave foránea física porque un mismo campo puede apuntar a cuatro tablas distintas; la integridad de esa referencia corresponde al servicio de backend.

## Conclusiones del modelo

- El dominio de vigilancia está normalizado mediante catálogos y tablas puente; señales, tendencias y alertas mantienen relaciones muchos-a-muchos sin duplicar entidades.
- La trazabilidad se resuelve con historiales separados para los cuatro flujos con estados: señal, tendencia, alerta y contenido.
- El modelo editorial distingue identidad de publicación y versión. Las secciones, bloques y relaciones temáticas pertenecen a una versión concreta.
- `content.current_version_id` y `content.published_version_id` son claves foráneas compuestas con `id_content`, lo que impide seleccionar una versión perteneciente a otro contenido.
- Las publicaciones ya publicadas se protegen adicionalmente con funciones y triggers; esta regla de inmutabilidad no se aprecia solo mediante cardinalidades.
- Conviene tratar las cuatro tablas `content_*` no versionadas como compatibilidad heredada y evitar que nuevos desarrollos creen dos fuentes de verdad.
- El conteo de visitas es la única relación deliberadamente polimórfica y sin integridad referencial declarativa.

## Fuente analizada

- `database/migrations/01_catalogs.sql` a `database/migrations/22_public_view_counts.sql`.
- Las vistas, procedimientos, índices y triggers se revisaron para interpretar el uso de las relaciones, aunque el diagrama representa principalmente tablas y claves foráneas.
