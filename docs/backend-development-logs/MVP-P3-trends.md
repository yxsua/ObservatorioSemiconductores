# Fase 3 - Vertical de tendencias

## Alcance

La vertical permite construir tendencias manuales a partir de señales, acompañar al analista con métricas y una madurez sugerida, validar metodológicamente el registro y activar únicamente las tendencias listas para consulta pública.

## Migración

Aplicar después de `11_signals_domain.sql`:

```text
database/migrations/12_trends_domain.sql
```

La migración añade:

- validador y fecha de validación;
- notas metodológicas;
- historial de estados;
- creación segura en estado `NEW`;
- vinculación y desvinculación transaccional de señales y actores;
- reglas de revisión;
- transiciones semánticas;
- compatibilidad controlada con los procedimientos anteriores.

## Endpoints públicos

```text
GET /api/trends
GET /api/trends/:id
```

Solo muestran tendencias `ACTIVE`. Las señales relacionadas que hayan dejado de estar validadas no se incluyen en la respuesta pública.

## Endpoints internos

```text
GET    /api/admin/trends
POST   /api/admin/trends
GET    /api/admin/trends/:id
PATCH  /api/admin/trends/:id
POST   /api/admin/trends/:id/transitions
GET    /api/admin/trends/:id/history
POST   /api/admin/trends/:id/signals
DELETE /api/admin/trends/:id/signals/:signalId
POST   /api/admin/trends/:id/actors
DELETE /api/admin/trends/:id/actors/:actorId
GET    /api/admin/actors
```

Las relaciones y campos de una tendencia solo pueden modificarse mientras esté en `NEW`.

## Reglas para enviar a revisión

- Dirección confirmada.
- Madurez confirmada por el analista.
- Al menos tres señales.
- Todas las señales en `VALIDATED`.
- Al menos dos fuentes distintas.
- Si se mezclan varios FCV, `methodologyNotes` debe justificarlo.

## Estados y transiciones

```text
NEW --SUBMIT_FOR_REVIEW--> UNDER_REVIEW
UNDER_REVIEW --REQUEST_CHANGES--> NEW
UNDER_REVIEW --VALIDATE--> VALIDATED
VALIDATED|ACTIVE --REOPEN--> UNDER_REVIEW
VALIDATED --ACTIVATE--> ACTIVE
NEW|UNDER_REVIEW|VALIDATED|ACTIVE --ARCHIVE--> ARCHIVED
```

El validador debe ser distinto del analista creador. Una tendencia no se hace pública al validarse; requiere la transición independiente `ACTIVATE`.

## Madurez sugerida

La sugerencia no reemplaza el criterio humano:

| Sugerencia | Condición inicial |
| --- | --- |
| `EMERGING` | 3 señales y 2 fuentes |
| `CONSOLIDATING` | 5 señales y 2 actores o 3 fuentes |
| `ESTABLISHED` | 8 señales y 3 actores o 4 fuentes |

La respuesta incluye los criterios cumplidos para que el frontend explique la sugerencia.

## Verificación realizada

- Migraciones `01-12` ejecutadas en PostgreSQL 17.
- Una tendencia con dos señales fue rechazada con HTTP 422.
- Tres señales validadas y dos fuentes permitieron enviar a revisión.
- Se verificó el ciclo `NEW → UNDER_REVIEW → VALIDATED → ACTIVE`.
- La tendencia devolvió 404 antes de activarse y 200 después.
- El historial registró creación y tres transiciones.
- La madurez sugerida fue `EMERGING`.
- La prueba atravesó Express, JWT, RBAC, Zod, repositorios y PostgreSQL.
