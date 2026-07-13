# Fase 5.2 - API editorial interna

## Alcance

Este incremento expone el flujo editorial interno sobre el modelo versionado de la Fase 5.0. Incluye creación y consulta de contenido, metadatos, revisiones, composición transaccional, plantillas, vista previa, historial y transiciones gobernadas por permisos.

## Migración

Aplicar después de `14_editorial_domain.sql`:

```text
database/migrations/15_editorial_api_rules.sql
```

La migración impide publicar composiciones con bloques desactivados, referencias sin relación versionada, medios privados o inexistentes y entidades de vigilancia que no tengan visibilidad pública.

## Endpoints

```text
GET    /api/admin/content
POST   /api/admin/content
GET    /api/admin/content/:id
PATCH  /api/admin/content/:id

GET    /api/admin/content/:id/versions
POST   /api/admin/content/:id/versions
GET    /api/admin/content/:id/versions/:versionId
PUT    /api/admin/content/:id/versions/:versionId/composition

GET    /api/admin/content/:id/history
GET    /api/admin/content/:id/preview
POST   /api/admin/content/:id/transitions

GET    /api/admin/content-templates
GET    /api/admin/content-templates/:id
GET    /api/admin/editorial/block-types
```

## Creación

```json
{
  "typeCode": "REPORT",
  "title": "Reporte de empaquetado avanzado",
  "summary": "Resumen inicial",
  "slug": "reporte-empaquetado-avanzado",
  "featuredMediaId": null,
  "templateId": 2
}
```

El autor se obtiene del JWT. El contenido y su primera versión se crean en `DRAFT`. Una plantilla debe corresponder al mismo `typeCode`; sus secciones y bloques con datos predeterminados se instancian en la misma transacción.

## Guardado de composición

El constructor React guarda una versión completa mediante `PUT`. El orden de los arreglos define las posiciones persistidas.

```json
{
  "updatedAt": "2026-07-13T05:00:00.000Z",
  "sections": [
    {
      "typeCode": "body",
      "title": "Desarrollo",
      "isVisible": true,
      "settings": {},
      "blocks": [
        {
          "type": "paragraph",
          "schemaVersion": 1,
          "data": {
            "text": "Contenido del reporte.",
            "format": "plain"
          },
          "settings": {}
        }
      ]
    }
  ],
  "relations": {
    "categoryIds": [],
    "signalIds": [],
    "trendIds": [],
    "alertIds": []
  }
}
```

El reemplazo elimina y reconstruye secciones, bloques y relaciones dentro de una sola transacción. `updatedAt` habilita concurrencia optimista y devuelve HTTP 409 cuando el contenido cambió. Solo la versión actual en `DRAFT` puede guardarse.

Los bloques `signal`, `trend` y `alert` agregan automáticamente su `entityId` a las relaciones versionadas, aunque el cliente no lo repita en `relations`.

## Permisos

| Operación | Permiso |
| --- | --- |
| Listar, consultar, historial, preview y plantillas | `content:read-internal` |
| Crear contenido | `content:create` |
| Editar, componer y crear revisión | `content:update` |
| Enviar a revisión | `content:submit` |
| Solicitar cambios, aprobar o reabrir | `content:approve` |
| Publicar | `content:publish` |
| Archivar | `content:archive` |

## Reglas de publicación

- Al menos una sección visible y un bloque visible.
- Contrato y `schemaVersion` vigentes para todos los bloques visibles.
- Señales relacionadas en `VALIDATED`.
- Tendencias relacionadas en `ACTIVE`.
- Alertas relacionadas en `PUBLISHED` o `CLOSED`.
- Bloques de vigilancia respaldados por su relación versionada.
- Bloques `image` y `file` vinculados con medios públicos existentes.
- Versión aprobada por una persona distinta de quien la creó.

## Verificación

- Migraciones `01-15` en PostgreSQL 17.
- Creación desde plantilla y guardado de composición mediante HTTP.
- Vista previa con la composición actual.
- Concurrencia desactualizada rechazada con HTTP 409.
- Edición durante revisión y después de publicar rechazada con HTTP 422.
- Aprobación intentada por `EDITOR` rechazada con HTTP 403.
- Publicación y creación posterior de revisión sin sustituir el puntero público.
- Referencia a señal no validada rechazada; publicación aceptada después de validarla.
- Pruebas reutilizables en `backend/scripts/content-e2e.js` y `database/tests/15_editorial_api_rules_e2e.sql`.
