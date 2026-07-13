# Fase 5.4 - Resolución pública de bloques

## Alcance

Este incremento enriquece los bloques de referencia devueltos por `GET /api/content/:slug`. La composición persistida conserva únicamente `entityId` o `mediaId`; el backend añade un objeto efímero `resolved` con datos públicos listos para React.

No se crean copias de señales, tendencias, alertas o medios dentro de las versiones editoriales. La resolución siempre refleja la visibilidad pública actual.

## Contrato

Un bloque de vigilancia conserva sus datos editoriales y añade la entidad resuelta:

```json
{
  "type": { "code": "signal", "name": "Señal" },
  "data": {
    "entityId": 42,
    "variant": "card",
    "fields": {}
  },
  "resolved": {
    "kind": "signal",
    "id": 42,
    "businessCode": "SIG-2026-0042",
    "title": "Nueva capacidad de empaquetado",
    "href": "/api/signals/42",
    "summary": "...",
    "metadata": {}
  }
}
```

Los bloques `image` y `file` reciben nombre, MIME, extensión y tamaño. Desde el incremento 5.5, las imágenes utilizan `url: /api/media/:id` y todos los medios reciben `downloadUrl: /api/media/:id/download`. Los archivos conservan `url: null` para impedir una visualización o descarga anónima.

## Proyección por variante

| Variante | Resumen | Metadatos | Relaciones |
| --- | --- | --- | --- |
| `compact` | No | No | No |
| `card` | Sí | Sí | No |
| `featured` | Sí | Sí | Sí |

`data.fields.summary`, `data.fields.metadata` y `data.fields.relations` sobrescriben individualmente esos valores.

Los campos base `kind`, `id`, `businessCode`, `title` y `href` siempre están presentes para entidades de vigilancia.

## Rendimiento y seguridad

- Los IDs se deduplican antes de consultar PostgreSQL.
- Se ejecuta como máximo una consulta por familia de referencia.
- Solo se resuelven señales `VALIDATED`, tendencias `ACTIVE`, alertas `PUBLISHED` o `CLOSED` y medios públicos.
- Una referencia que ya no pueda resolverse elimina el bloque; una sección sin bloques públicos también se elimina.
- `data` permanece sin cambios para conservar el contrato y la trazabilidad editorial.

## Verificación

- Proyección `compact`, `card` y `featured`.
- Sobrescritura mediante `fields`.
- Deduplicación de referencias.
- Rechazo de rutas locales y traversal en medios.
- Resolución HTTP real de una señal validada y una imagen pública.
- Persistencia de la publicación anterior durante una revisión DRAFT.
