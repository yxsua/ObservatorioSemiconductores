# Fase 5.3 - API pública de contenido

## Alcance

Este incremento expone contenido editorial publicado para construir las vistas públicas en React. No requiere autenticación y no incluye descargas ni exportaciones.

## Endpoints

```text
GET /api/content
GET /api/content/:slug
```

La colección admite `page`, `pageSize`, `search`, `type`, `categoryId`, `fcv`, `from`, `to` y `sort`. Los órdenes válidos son `publishedAt`, `-publishedAt`, `title` y `-title`.

Ejemplo:

```text
GET /api/content?type=REPORT&fcv=TECHNOLOGICAL&sort=-publishedAt&page=1&pageSize=12
```

## Frontera de visibilidad

La vista `vw_public_content` se apoya en `content.published_version_id`. La versión de trabajo nunca se utiliza para responder al público.

- Un borrador sin publicación previa devuelve 404 y no aparece en la colección.
- Crear una revisión conserva visible la publicación anterior.
- Archivar el contenido lo retira de la API pública.
- Solo se devuelven secciones y bloques marcados como visibles.
- Solo se devuelven tipos de bloque activos, públicos y con el contrato vigente.
- Los medios privados y sus bloques se excluyen.
- Los bloques y relaciones de vigilancia se excluyen si la entidad dejó de ser pública.

## DTO público

El detalle contiene metadatos de presentación, categorías, `versionNumber`, secciones, bloques y relaciones públicas. No incluye:

- autor o cuentas internas;
- aprobadores o publicadores;
- historial y notas editoriales;
- `currentVersionId` o `publishedVersionId`;
- estados de trabajo;
- metadatos internos de plantilla.

La API devuelve `data.sections` ordenado por posición. Cada bloque conserva `type.code`, `schemaVersion`, `data`, `settings` y `cssClass`. Desde el incremento 5.4, los bloques `image`, `file`, `signal`, `trend` y `alert` incluyen además un objeto efímero `resolved`.

## Migración

Aplicar después de `15_editorial_api_rules.sql`:

```text
database/migrations/16_public_content_api.sql
```

La migración crea la vista pública e índices parciales para publicación, búsqueda de texto y filtrado por categorías.

## Verificación

- Consulta sin autenticación.
- Borradores ausentes de lista y detalle.
- Secciones y bloques ocultos filtrados.
- Revisión DRAFT sin reemplazar título ni composición publicados.
- Contenido archivado retirado de la vista pública.
- Metadatos internos ausentes del DTO.
- Filtros, paginación, búsqueda y orden validados.
