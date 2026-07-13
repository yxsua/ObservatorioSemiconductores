# Fase 5 - Fundamentos editoriales y contratos de bloques

## Alcance

Los incrementos 5.0 y 5.1 establecen una base editorial versionada antes de implementar el constructor completo. Separan la versión de trabajo de la versión publicada, protegen las publicaciones contra mutaciones y definen los contratos que utilizarán el backend y los renderers React.

## Migración

Aplicar después de `13_alerts_domain.sql`:

```text
database/migrations/14_editorial_domain.sql
```

La migración añade:

- `current_version_id` y `published_version_id` en contenido;
- título, resumen e imagen principal por versión;
- aprobador, publicador y fechas por contenido y versión;
- historial de estados editoriales;
- categorías, señales, tendencias y alertas relacionadas por versión;
- versión de esquema por bloque;
- unicidad de posiciones de secciones y bloques;
- protección de versiones publicadas mediante triggers;
- creación segura y clonación transaccional de revisiones;
- transiciones editoriales semánticas;
- activación explícita de los bloques admitidos en el MVP.

## Ciclo editorial de base

```text
DRAFT --SUBMIT_FOR_REVIEW--> UNDER_REVIEW
UNDER_REVIEW --REQUEST_CHANGES--> DRAFT
UNDER_REVIEW --APPROVE--> APPROVED
APPROVED --REOPEN--> UNDER_REVIEW
APPROVED --PUBLISH--> PUBLISHED
PUBLISHED --ARCHIVE--> ARCHIVED
PUBLISHED|ARCHIVED --CREATE_REVISION--> DRAFT
```

La aprobación requiere un usuario distinto del creador de la versión. Publicar actualiza atómicamente `published_version_id`. Crear una revisión clona la composición y las relaciones en una versión editable sin reemplazar la publicación vigente.

## Inmutabilidad

Después de publicar una versión se rechazan modificaciones o eliminaciones de:

- metadatos de la versión;
- secciones;
- bloques;
- categorías;
- señales;
- tendencias;
- alertas relacionadas.

Los cambios posteriores deben comenzar con `sp_create_content_version`.

## Bloques MVP

Se habilitan trece tipos:

```text
heading paragraph quote list callout divider
image file table chart signal trend alert
```

Cada bloque requiere `schemaVersion: 1`. Los bloques `signal`, `trend` y `alert` guardan `entityId` y configuración de presentación, no copias de la entidad. Los párrafos admiten texto plano o Markdown sin HTML arbitrario. Imágenes y archivos usan referencias a `media`.

Los tipos `embed`, `video`, `gallery`, `timeline`, `dataset` y `accordion` permanecen desactivados hasta contar con contratos y reglas de seguridad específicos.

## Endpoint de descubrimiento

```text
GET /api/admin/editorial/block-types
```

Requiere autenticación y alguno de los permisos `content:read-internal`, `content:create` o `content:update`. Devuelve únicamente contratos activos cuya versión coincide entre PostgreSQL y el registro de backend.

## Forma común de un bloque

```json
{
  "type": "signal",
  "schemaVersion": 1,
  "data": {
    "entityId": 42,
    "variant": "card",
    "fields": {}
  },
  "settings": {
    "width": "content",
    "alignment": "left",
    "background": "none"
  },
  "position": 1,
  "isVisible": true,
  "cssClass": null
}
```

## Verificación

- Migraciones `01-14` ejecutadas en PostgreSQL 17.
- Creación de contenido y primera versión en `DRAFT`.
- Rechazo de autoaprobación por el editor.
- Ciclo `DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED`.
- Rechazo de mutación sobre un bloque publicado.
- Clonación de una revisión sin cambiar `published_version_id`.
- Historial con creación, revisión, aprobación, publicación y nueva revisión.
- Endpoint protegido: HTTP 401 sin sesión y HTTP 200 para `EDITOR`.
- Trece contratos activos y públicos, todos en versión 1.
- Pruebas de tipos desconocidos, HTML, tablas, gráficas y referencias.

El escenario PostgreSQL está en `database/tests/14_editorial_domain_e2e.sql`.
