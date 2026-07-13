# Convenciones de la API

## Base y formato

- Prefijo actual: `/api`.
- Formato: JSON UTF-8.
- Fechas civiles: `YYYY-MM-DD`.
- Instantes: ISO 8601 en UTC.
- Los nombres de propiedades se exponen en `camelCase`.
- Los códigos de catálogo se envían en mayúsculas, excepto los tipos editoriales existentes, cuyos códigos se conservan como están definidos.

## Respuesta exitosa

```json
{
  "success": true,
  "message": "Operación realizada correctamente.",
  "data": {}
}
```

## Colecciones paginadas

Parámetros comunes:

- `page`: entero desde 1; valor predeterminado 1.
- `pageSize`: entero de 1 a 100; valor predeterminado 20.
- `search`: texto libre cuando el recurso lo admita.
- `sort`: campo permitido; el prefijo `-` indica orden descendente.

```json
{
  "success": true,
  "message": "Recursos obtenidos correctamente.",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}
```

Los endpoints de catálogos no se paginan porque son colecciones pequeñas necesarias para construir controles de interfaz.

## Errores

```json
{
  "success": false,
  "message": "Los datos proporcionados no son válidos.",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "pageSize",
      "message": "No puede ser mayor que 100."
    }
  ]
}
```

Códigos transversales:

| HTTP | Código |
| ---: | --- |
| 400 | `VALIDATION_ERROR`, `INVALID_JSON`, `INVALID_VALUE` |
| 401 | `AUTHENTICATION_REQUIRED` |
| 403 | `PERMISSION_DENIED` |
| 404 | `RESOURCE_NOT_FOUND` |
| 409 | `CONFLICT`, `INVALID_TRANSITION`, `CONCURRENT_MODIFICATION` |
| 422 | `DOMAIN_RULE_VIOLATION` |
| 500 | `INTERNAL_SERVER_ERROR` |

## Autenticación y permisos

Las rutas protegidas reciben:

```http
Authorization: Bearer <jwt>
```

El JWT identifica al usuario, pero no es la autoridad final de permisos. Los permisos se consultan en PostgreSQL durante la solicitud para que una revocación tenga efecto inmediato.

Los controladores no comprueban nombres de roles. Las rutas declaran permisos mediante `requirePermissions(...)` o `requireAnyPermission(...)` después de `authenticate`.

```js
router.post(
    "/",
    authenticate,
    requirePermissions("signals:create"),
    asyncHandler(createSignal)
);
```

## Catálogos

- `GET /api/catalogs` descubre los nombres admitidos.
- `GET /api/catalogs/{catalog}` devuelve sus elementos activos cuando el catálogo soporta desactivación.
- El parámetro se resuelve contra una lista blanca; nunca se utiliza como nombre SQL directo.
- Los IDs pueden devolverse como referencia, pero el frontend debe preferir códigos estables cuando el catálogo los tenga.
- `categories` es la excepción actual: todavía utiliza `idCategory` porque el esquema no define un código estable para cada categoría.

## Señales

La lectura se divide explícitamente por visibilidad:

- `/api/signals`: acceso público; solo devuelve señales `VALIDATED` y omite notas e identidades internas.
- `/api/admin/signals`: requiere autenticación y permisos de vigilancia.

El cliente nunca envía `ips`, `analystId`, `validatorId` ni un estado arbitrario. El IPS se calcula en PostgreSQL y los cambios de estado se expresan mediante transiciones semánticas.

```json
{
  "transition": "SUBMIT_FOR_REVIEW",
  "notes": "Lista para revisión metodológica."
}
```

Para prevenir sobrescrituras, `PATCH /api/admin/signals/{id}` puede recibir el `updatedAt` obtenido previamente. Si el recurso cambió, devuelve `CONCURRENT_MODIFICATION`.

## Tendencias

- `/api/trends` expone únicamente tendencias `ACTIVE`.
- `/api/admin/trends` administra borradores y revisión.
- Las relaciones se modifican mediante endpoints explícitos y solo mientras la tendencia está en `NEW`.
- Validar y activar son operaciones distintas.
- La madurez sugerida es informativa; `maturityCode` registra la decisión humana.

## Alertas

- `/api/alerts` expone alertas `PUBLISHED` y `CLOSED`; el cierre conserva la consulta histórica.
- `/api/admin/alerts` administra borradores, evidencia, audiencias y el ciclo de revisión.
- Señales, tendencias y audiencias se relacionan mediante endpoints explícitos y solo en `NEW`.
- Enviar a revisión exige contenido operativo, al menos una evidencia válida y una audiencia.
- Validar, publicar y cerrar son decisiones distintas, trazables y gobernadas por permisos separados.
- La respuesta pública omite `notes`, `creator`, `validator`, `publisher` y `validationDate`.
- `PATCH /api/admin/alerts/{id}` admite `updatedAt` para control de concurrencia optimista.

## Fundamentos editoriales

- `content.current_version_id` identifica la versión de trabajo y `published_version_id` la versión visible públicamente.
- `/content` y `/content/{slug}` consultan exclusivamente `published_version_id`; no exponen estados, personas ni punteros del flujo interno.
- El detalle público usa el `slug` como identificador canónico y filtra nuevamente bloques, medios y relaciones cuya visibilidad haya cambiado después de publicar.
- Los bloques de referencia conservan `data.entityId` o `data.mediaId` y reciben `resolved` al consultar; este objeto derivado nunca se persiste en la versión editorial.
- Las imágenes raster públicas se sirven mediante `/media/{id}`; `/media/{id}/download` requiere `exports:download` y nunca expone la ubicación de almacenamiento en el DTO.
- Una nueva revisión no sustituye la versión pública hasta ejecutar `PUBLISH`.
- Las versiones publicadas y toda su composición son inmutables.
- Los bloques utilizan `type`, `schemaVersion`, `data` y `settings`; el backend valida el contrato correspondiente al tipo y versión.
- El frontend descubre los trece contratos MVP mediante `GET /api/admin/editorial/block-types`.
- Los bloques de vigilancia guardan referencias a señales, tendencias o alertas y nunca copias permanentes.
- No se acepta HTML arbitrario en los bloques de texto del MVP.

## Exportaciones

- `/api/exports/{resource}.{format}` requiere una cuenta con `exports:download`.
- Los recursos admitidos son `signals`, `trends`, `alerts` y `content`; los formatos iniciales son CSV UTF-8 y JSON.
- La extracción reutiliza los filtros, consultas y DTO de la API pública. Registrarse habilita la descarga, pero no amplía la visibilidad de los datos.
- `page`, `pageSize` y `status` se rechazan. La exportación recupera la colección completa hasta `EXPORT_MAX_ROWS` (5000 por defecto y 10000 como tope absoluto).
- El CSV incluye BOM para compatibilidad con Excel, utiliza CRLF, escapa todas las celdas y neutraliza prefijos interpretables como fórmulas.
- El JSON incluye `generatedAt`, `resource`, `rowCount`, `filters` y `data`.
- Cada descarga exitosa registra usuario, recurso, formato, filtros, filas, bytes y SHA-256. `/api/exports/history` sólo devuelve el historial del usuario autenticado.

## API editorial interna

- La composición se reemplaza completa mediante `PUT /api/admin/content/{id}/versions/{versionId}/composition`.
- El orden de secciones y bloques en los arreglos es la autoridad para `position`.
- El guardado de composición es transaccional: nunca persiste una versión parcial.
- `updatedAt` aplica concurrencia optimista al contenido y devuelve `CONCURRENT_MODIFICATION` si quedó desactualizado.
- La vista previa usa la versión actual, incluso si todavía no está publicada.
- Las relaciones de vigilancia se deducen también desde los bloques de referencia.
- Los permisos de transición se comprueban por acción; acceder a la ruta no concede aprobación o publicación.
