# Fase 4 - Vertical de alertas

## Alcance

La vertical permite construir alertas manuales a partir de señales validadas y tendencias validadas o activas, seleccionar sus audiencias, someterlas a validación independiente, publicarlas y cerrarlas sin perder su consulta histórica.

## Migración

Aplicar después de `12_trends_domain.sql`:

```text
database/migrations/13_alerts_domain.sql
```

La migración añade el publicador, el historial de estados, procedimientos transaccionales para relaciones, validación previa a revisión y transiciones semánticas. El procedimiento anterior de cambio arbitrario de estado queda deshabilitado.

## Endpoints públicos

```text
GET /api/alerts
GET /api/alerts/:id
```

Exponen alertas `PUBLISHED` y `CLOSED`. Una alerta cerrada sigue disponible como registro histórico. La respuesta pública omite notas e identidades internas y filtra evidencia que haya dejado de cumplir los estados publicables.

## Endpoints internos

```text
GET    /api/admin/alerts
POST   /api/admin/alerts
GET    /api/admin/alerts/:id
PATCH  /api/admin/alerts/:id
GET    /api/admin/alerts/:id/history
POST   /api/admin/alerts/:id/transitions
POST   /api/admin/alerts/:id/signals
DELETE /api/admin/alerts/:id/signals/:signalId
POST   /api/admin/alerts/:id/trends
DELETE /api/admin/alerts/:id/trends/:trendId
POST   /api/admin/alerts/:id/audiences
DELETE /api/admin/alerts/:id/audiences/:audienceCode
```

Los campos y relaciones solo pueden cambiar en `NEW`. El creador puede editar su alerta; un usuario con capacidad de validación puede corregirla mientras siga en ese estado.

## Reglas para enviar a revisión

- Nivel, implicaciones, recomendaciones y regla de activación completos.
- Al menos una señal o una tendencia como evidencia.
- Todas las señales relacionadas en `VALIDATED`.
- Todas las tendencias relacionadas en `VALIDATED` o `ACTIVE`.
- Al menos una audiencia.

El validador debe ser distinto del creador. Publicar es una decisión independiente de validar y registra tanto al publicador como la fecha de publicación.

## Estados y transiciones

```text
NEW --SUBMIT_FOR_REVIEW--> UNDER_REVIEW
UNDER_REVIEW --REQUEST_CHANGES--> NEW
UNDER_REVIEW --VALIDATE--> VALIDATED
VALIDATED|PUBLISHED --REOPEN--> UNDER_REVIEW
VALIDATED --PUBLISH--> PUBLISHED
PUBLISHED --CLOSE--> CLOSED
```

`REOPEN` limpia los datos anteriores de validación y publicación para exigir una nueva revisión completa.

## Responsabilidades por permiso

| Acción | Permiso |
| --- | --- |
| Crear | `alerts:create` |
| Editar | `alerts:update` |
| Relacionar evidencia y audiencias | `alerts:link-evidence` |
| Enviar a revisión | `alerts:submit` |
| Solicitar cambios, validar o reabrir | `alerts:validate` |
| Publicar | `alerts:publish` |
| Cerrar | `alerts:close` |

## Verificación realizada

- Migraciones `01-13` ejecutadas en PostgreSQL 17.
- Una alerta sin evidencia ni audiencia fue rechazada con HTTP 422 al enviarse a revisión.
- Se relacionaron una señal `VALIDATED`, una tendencia `ACTIVE` y dos audiencias.
- Un analista sin permiso de validación recibió HTTP 403 al intentar validar.
- Se verificó `NEW → UNDER_REVIEW → VALIDATED → PUBLISHED → CLOSED`.
- El detalle público devolvió 404 antes de publicar y 200 después de publicar y después de cerrar.
- La proyección pública omitió notas y responsables internos.
- El historial registró creación y las cuatro transiciones.
- El escenario reutilizable está en `backend/scripts/alert-e2e.js`.
